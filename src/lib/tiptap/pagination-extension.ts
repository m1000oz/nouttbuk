import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { EditorView } from "@tiptap/pm/view";

import {
  ALTURA_PAGINA_PX,
  MARGEN_PAGINA_PX,
  SEPARACION_PAGINAS_PX,
} from "@/lib/tiptap/geometria-pagina";
import {
  actualizarPaginasCalculadas,
  EVENTO_GEOMETRIA_CAMBIO,
} from "@/lib/tiptap/configuracion-pagina";

type GeometriaPaginacion = {
  // Alto de una hoja en px, y su margen interno: juntos determinan cuánto
  // contenido "cabe" antes de empujar el resto a la siguiente hoja.
  alturaPagina: number;
  margenPagina: number;
  // Espacio visual entre el borde inferior de una hoja y el borde superior
  // de la siguiente (el "pasillo" entre páginas).
  separacionPaginas: number;
};

export type OpcionesPaginacion = {
  // Getter, no valores fijos: el diálogo "Configurar página" cambia la
  // geometría en vivo (src/lib/tiptap/configuracion-pagina.ts) después de
  // que esta extensión ya se creó (Tiptap solo la construye una vez, ver el
  // comentario sobre StarterKit/Gapcursor en extensiones-documento.ts), así
  // que leer un valor fijo capturado en addProseMirrorPlugins() nunca vería
  // un cambio posterior. Se re-lee en cada medirYDecorar(), que ya se
  // re-ejecuta solo vía ResizeObserver.
  obtenerGeometria: () => GeometriaPaginacion;
};

const paginacionPluginKey = new PluginKey<DecorationSet>("paginacion");

// Cuántas veces seguidas esta pasada dividió un nodo demasiado alto (ver más
// abajo) sin que una pasada intermedia haya terminado limpia. Cota generosa
// (un párrafo de ~20 hojas sin cortar ya es un caso patológico) para que un
// párrafo larguísimo termine de dividirse en varias pasadas sucesivas sin
// arriesgar un bucle infinito si `posAtCoords` alguna vez devolviera una
// posición que no reduce la altura del nodo. No comparte contador con
// `pasadasEncadenadas` (más abajo, dentro de `view()`): ese es solo para la
// convergencia de decoraciones, esta cuenta pasadas de un tipo de operación
// distinta (una edición real del documento, no una decoración).
const MAX_DIVISIONES_ENCADENADAS = 200;

// Encuentra, dentro de `elementoNodo`, la posición del documento que cae
// justo en el borde inferior de una hoja completa (`alturaObjetivo` px desde
// el propio tope del nodo) — el punto donde ese nodo debería partirse en dos
// para que la primera mitad termine de llenar la hoja actual. Reutiliza
// `editorView.posAtCoords`, el mismo método que `hojas-editor.tsx`
// (`manejarClicPila`) ya usa para resolver un clic a una posición del
// documento, en vez de reimplementar la búsqueda a mano con
// `caretRangeFromPoint`/`caretPositionFromPoint`.
function encontrarPosicionDeCorte(
  editorView: EditorView,
  elementoNodo: HTMLElement,
  alturaObjetivo: number,
  posInicioNodo: number,
  tamanoNodo: number
): number | null {
  const rect = elementoNodo.getBoundingClientRect();
  const yObjetivo = rect.top + alturaObjetivo;
  
  // posAtCoords solo funciona si la coordenada está dentro del viewport visible.
  // Si el usuario pegó 15 páginas de texto de golpe, el punto de corte casi
  // siempre estará fuera de la pantalla y esto devolverá null.
  const resultado = editorView.posAtCoords({
    left: rect.left + 4,
    top: yObjetivo,
  });
  
  if (resultado) {
    return resultado.pos;
  }
  
  // Fallback heurístico poderoso: si el navegador no puede medirlo porque está
  // fuera de pantalla, calculamos la proporción (ej. si el objetivo es 1000px
  // y el bloque mide 5000px, cortamos al 20% del contenido de texto).
  // La siguiente pasada del ResizeObserver refinará el corte si fue inexacto.
  const alturaTotal = elementoNodo.offsetHeight;
  if (alturaTotal > 0 && tamanoNodo > 2) {
    const proporcion = Math.max(0.1, Math.min(0.95, alturaObjetivo / alturaTotal));
    // Calculamos el offset interno y lo sumamos a la posición de inicio
    const corteEstimado = posInicioNodo + Math.floor((tamanoNodo - 2) * proporcion) + 1;
    return corteEstimado;
  }
  
  return null;
}

// Comprueba si dos listas de puntos de corte son funcionalmente equivalentes:
// las mismas posiciones exactas en el documento y alturas de hueco dentro de
// una tolerancia de subpíxeles (2px por defecto). Esto corta de raíz bucles
// infinitos donde el navegador oscila 1px debido al redondeo o reflow.
export function sonCortesEquivalentes(
  cortesA: { pos: number; hueco: number }[] | null,
  cortesB: { pos: number; hueco: number }[] | null,
  toleranciaHueco = 2,
): boolean {
  if (!cortesA || !cortesB) return false;
  if (cortesA.length !== cortesB.length) return false;
  for (let i = 0; i < cortesA.length; i++) {
    if (cortesA[i].pos !== cortesB[i].pos) return false;
    if (Math.abs(cortesA[i].hueco - cortesB[i].hueco) > toleranciaHueco) return false;
  }
  return true;
}

// Extensión que casi siempre solo agrega decoraciones de vista (nunca toca
// `doc`): mide el alto real ya renderizado de cada nodo de nivel superior y,
// cuando uno haría que el acumulado cruce el límite de una hoja A4, inserta
// un espaciador invisible justo antes de ese nodo para empujarlo al inicio
// de la próxima hoja. El salto siempre cae en un límite de nodo completo
// (párrafo, tabla, imagen). La única excepción, agregada en Pass 14: cuando
// un párrafo o encabezado por sí solo ya es más alto que una hoja completa
// (se escribió sin presionar Enter, o se pegó un bloque largo), empujarlo
// entero no sirve de nada, sigue sin caber en la hoja siguiente tampoco, así
// que en ese caso puntual esta extensión SÍ despacha una edición real del
// documento (`tr.split`, exactamente lo que hace Enter) para partirlo en dos
// párrafos de verdad — ver el bloque `if (alturaHijo > alturaUtil)` dentro
// de `medirYDecorar`. Se decidió así, en vez de partir y volver a unir solo
// en la vista, porque `y-prosemirror` sincroniza cualquier transacción que
// cambie `doc` sin ninguna forma de excluirla: un corte reversible se
// transmitiría a los demás colaboradores y quedaría en el historial de Yjs
// antes de poder revertirlo. Fuera de ese único caso, esta extensión sigue
// sin tocar el documento, así que el guardado (`editor.getJSON()`) sigue
// devolviendo exactamente lo que hay, sin rastro de las decoraciones.
export const Paginacion = Extension.create<OpcionesPaginacion>({
  name: "paginacion",

  addOptions() {
    return {
      obtenerGeometria: () => ({
        alturaPagina: ALTURA_PAGINA_PX,
        margenPagina: MARGEN_PAGINA_PX,
        separacionPaginas: SEPARACION_PAGINAS_PX,
      }),
    };
  },

  addProseMirrorPlugins() {
    const { obtenerGeometria } = this.options;

    return [
      new Plugin({
        key: paginacionPluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, decoraciones) {
            const meta = tr.getMeta(paginacionPluginKey) as
              | DecorationSet
              | undefined;
            if (meta) return meta;
            if (!tr.docChanged) return decoraciones;
            // Mientras se recalcula (próximo frame), las decoraciones viejas
            // se remapean sobre el nuevo documento en vez de desaparecer, así
            // no hay un parpadeo de "sin paginación" en cada tecla.
            return decoraciones.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return paginacionPluginKey.getState(state);
          },
        },
        view(editorView) {
          let recalculoProgramado = false;
          let firmaAnterior = "";
          let cortesAnteriores: { pos: number; hueco: number }[] | null = null;
          const historialFirmas = new Set<string>();
          // Cuántas veces seguidas esta misma función se volvió a disparar a
          // sí misma (dispatch → update() del plugin → programarRecalculo())
          // sin que una pasada intermedia haya convergido (visto abajo,
          // donde se resetea a 0). No debería pasar de 1-2 en un documento
          // normal; es un cinturón de seguridad para que un contenido futuro
          // que por lo que sea nunca logre estabilizarse degrade a "la
          // paginación se queda como está" en vez de colgar la pestaña
          // recalculando para siempre.
          let pasadasEncadenadas = 0;
          const MAX_PASADAS_ENCADENADAS = 8;
          // Ver el comentario de `MAX_DIVISIONES_ENCADENADAS` más arriba:
          // cuenta divisiones reales de párrafo (Pass 14), no pasadas de
          // decoración, se resetea junto con `pasadasEncadenadas` cuando una
          // pasada termina limpia.
          let divisionesEncadenadas = 0;
          const observador = new ResizeObserver(() => programarRecalculo());

          function medirYDecorar() {
            if (editorView.isDestroyed) {
              recalculoProgramado = false;
              return;
            }

            const { alturaPagina, margenPagina, separacionPaginas } = obtenerGeometria();
            const alturaUtil = alturaPagina - margenPagina * 2;

            const dom = editorView.dom as HTMLElement;
            const hijos = Array.from(dom.children) as HTMLElement[];

            const puntosDeCorte: { pos: number; hueco: number }[] = [];
            // Alto de contenido real acumulado SOLO desde el último salto de
            // página (se reinicia a 0 cada vez que se inserta uno, más
            // abajo), nunca un total global desde el principio del
            // documento. Una versión anterior de este cálculo comparaba un
            // total global contra `paginaActual * alturaUtil`: cualquier
            // hoja que no se llenara al pixel exacto (el caso normal, un
            // párrafo casi nunca termina justo en el borde) dejaba un
            // sobrante que la fórmula del hueco volvía a sumar en el salto
            // siguiente, y en el siguiente, acumulando ese error hoja tras
            // hoja (confirmado con números concretos: exacto en el primer
            // salto, pero cada salto posterior heredaba el sobrante de
            // TODOS los anteriores). Con documentos cortos (2-3 hojas) el
            // error era demasiado chico para notarse; recién a partir de la
            // hoja 4-5 se veía como la última línea antes del salto pegada
            // al borde inferior sin margen y un hueco de sobra al empezar la
            // siguiente. Comparar siempre contra una sola `alturaUtil` (una
            // página, no un múltiplo acumulado) elimina el error de raíz en
            // vez de sólo reducirlo.
            let acumulado = 0;
            let paginaActual = 1;
            // Alto acumulado de los `.pagina-fantasma` ya atravesados: los
            // espaciadores de la pasada anterior siguen físicamente en el
            // DOM hasta que termina esta función (el reemplazo ocurre
            // recién al final, vía dispatch), así que el `offsetTop` de
            // cualquier nodo real que venga DESPUÉS de uno ya incluye ese
            // hueco horneado adentro. Restar este acumulado de cada
            // `offsetTop` "aplana" la posición de vuelta a como se vería si
            // ningún salto existiera todavía — el mismo espacio de
            // coordenadas en el que vive `acumulado`, sin importar cuántas
            // hojas ya se hayan insertado antes en pasadas previas.
            let desplazamientoPorHuecos = 0;
            // Fin (posición aplanada) del último nodo de contenido real
            // medido: sirve para recuperar el margen CSS colapsado entre
            // hermanos (ver más abajo). A diferencia de una versión anterior
            // de este cálculo, NO se reinicia a null al cruzar un
            // `.pagina-fantasma` — ambos lados de un salto ya están en el
            // mismo espacio aplanado gracias a `desplazamientoPorHuecos`,
            // así que seguir la cuenta ahí también es válido (con un margen
            // de error de un par de px, aceptable, porque el propio div del
            // espaciador impide que el navegador colapse el margen real
            // entre los dos párrafos como lo haría si estuvieran contiguos).
            let finRealAnterior: number | null = null;
            // El propio div del espaciador, al ser un elemento real entre
            // dos párrafos, le impide al navegador colapsar sus márgenes
            // como lo haría si fueran hermanos directos (un margen de cada
            // lado se aplica completo en vez de compartir uno solo): la
            // resta de `inicioAplanado - finRealAnterior` para el primer
            // nodo real después de un salto queda inflada por ese margen
            // extra "fantasma" (nunca existió tal separación en el
            // documento real). Esta bandera fuerza ese único margen a 0 en
            // vez de dejar que se sume al acumulado, evitando que el error
            // crezca con cada salto adicional en documentos largos.
            let justoTrasHueco = false;

            for (let indice = 0; indice < hijos.length; indice += 1) {
              const hijo = hijos[indice];
              // Un widget no es contenido del documento: no debe aportar
              // altura al acumulado (ver el comentario de
              // `desplazamientoPorHuecos` de más arriba) ni participar en la
              // comparación de desborde. Sin este filtro, cada
              // `.pagina-fantasma` de una pasada anterior se contaba como si
              // fuera un párrafo más, y su alto se volvía a sumar a
              // `acumulado` en cada recálculo posterior: en un apunte de 3+
              // hojas esto duplicaba (y triplicaba) el hueco acumulado con
              // cada letra escrita después del primer salto, y el segundo
              // salto de página terminaba resolviendo una posición tan
              // adelantada que el párrafo "de la página 3" en realidad se
              // seguía viendo dentro de la página 2.
              if (hijo.classList.contains("pagina-fantasma")) {
                desplazamientoPorHuecos += hijo.offsetHeight;
                justoTrasHueco = true;
                continue;
              }
              const alturaHijo = hijo.offsetHeight;
              const inicioAplanado = hijo.offsetTop - desplazamientoPorHuecos;
              // `offsetHeight` nunca incluye el margen CSS del propio nodo
              // (ninguna medida de caja lo incluye), y el margen entre dos
              // párrafos hermanos colapsa a uno solo en vez de sumar los
              // dos: sumar solo `offsetHeight` subestima el espacio real
              // que cada párrafo ocupa en el flujo, un poco cada vez, y ese
              // error se acumulaba a lo largo del documento (bit una parte
              // del "la hoja 2 no se siente natural": el salto llegaba
              // decenas de píxeles tarde, dejando un hueco de más arriba de
              // lo esperado al empezar la hoja siguiente). Se corrige
              // leyendo la distancia real ya calculada por el navegador
              // entre el fin del nodo anterior y el inicio de este (en el
              // espacio aplanado), en vez de asumir un valor de margen fijo
              // (que además cambiaría según el tipo de bloque: párrafo,
              // encabezado, cita...).
              const margenReal =
                finRealAnterior === null || justoTrasHueco
                  ? 0
                  : Math.max(0, inicioAplanado - finRealAnterior);
              justoTrasHueco = false;
              const alturaConMargen = alturaHijo + margenReal;

              // Pass 14: un nodo que por sí solo ya es más alto que una hoja
              // completa nunca puede resolverse empujándolo (la lógica de
              // más abajo), sigue sin caber en la hoja siguiente tampoco.
              // Ver el comentario grande sobre esto en la extensión, arriba
              // del todo del archivo.
              if (alturaHijo > alturaUtil) {
                try {
                  const posInicioNodo = editorView.posAtDOM(dom, indice);
                  const nodoPM = editorView.state.doc.nodeAt(posInicioNodo);
                  const esDivisible =
                    nodoPM &&
                    [
                      "paragraph",
                      "heading",
                      "bulletList",
                      "orderedList",
                      "blockquote",
                      "taskList"
                    ].includes(nodoPM.type.name);

                  if (
                    esDivisible &&
                    editorView.editable &&
                    divisionesEncadenadas < MAX_DIVISIONES_ENCADENADAS
                  ) {
                    const posFinNodo = editorView.posAtDOM(dom, indice + 1);
                    const posCorte = encontrarPosicionDeCorte(
                      editorView,
                      hijo,
                      alturaUtil,
                      posInicioNodo,
                      nodoPM.nodeSize
                    );
                    if (
                      posCorte !== null &&
                      posCorte > posInicioNodo + 1 &&
                      posCorte < posFinNodo - 1
                    ) {
                      divisionesEncadenadas += 1;
                      const $pos = editorView.state.doc.resolve(posCorte);
                      
                      // Intento de división profunda (rompe hasta la raíz).
                      // Si falla por restricciones del esquema de ProseMirror,
                      // baja un nivel a la vez hasta encontrar una división válida.
                      let exito = false;
                      for (let d = $pos.depth; d >= 1; d--) {
                        try {
                          const tr = editorView.state.tr.split(posCorte, d);
                          editorView.dispatch(tr);
                          exito = true;
                          break;
                        } catch (e) {
                          // Ignorar y probar con un nivel menos profundo
                        }
                      }
                      
                      if (exito) return;
                    }
                  }
                } catch {
                  // posAtDOM puede fallar en algún caso puntual (igual que
                  // más abajo, en el empuje entre nodos): se pierde solo
                  // esta oportunidad de dividir, no el recálculo completo.
                }
                // No se pudo dividir (nodo no divisible, sin permiso de
                // edición, límite de divisiones encadenadas alcanzado, no se
                // encontró un punto de corte válido, o posAtDOM falló): cae
                // al comportamiento de antes de Pass 14, empujarlo entero
                // como mejor esfuerzo más abajo.
              }

              // `continue` acá adentro (cuando posAtDOM falla) saltaba
              // también el `acumulado += alturaConMargen` de más abajo, del
              // hijo entero: el acumulado quedaba permanentemente atrasado
              // en la altura de ese nodo, y ningún nodo posterior podía
              // disparar un salto nuevo aunque el contenido siguiera
              // creciendo muy por encima de una hoja — parte del bug real
              // detrás de "algunas hojas salen delgadísimas y no se puede
              // escribir ni scrollear". Ahora la altura del nodo siempre
              // se contabiliza; si posAtDOM falla, solo se pierde ESE
              // punto de corte puntual, no el conteo de páginas completo.
              if (acumulado > 0 && acumulado + alturaConMargen > alturaUtil) {
                let pos: number | null = null;
                try {
                  // `posAtDOM(hijo, 0)` (la versión anterior) devuelve la
                  // posición justo DESPUÉS de que `hijo` abre, es decir
                  // DENTRO del párrafo, antes de su primer carácter, no
                  // antes del párrafo como hermano. El widget terminaba
                  // montado como primer hijo del propio `<p>` que se quería
                  // empujar, no como un div hermano antes de él: el párrafo
                  // se volvía uno solo con el hueco de 200+px dentro de su
                  // propia caja, así que su texto visible arrancaba muy por
                  // debajo de donde el cursor de ProseMirror realmente
                  // estaba parado. Esto es lo que se sentía como "la hoja 2
                  // no es natural y rompe la escritura": escribir justo en
                  // ese párrafo movía el cursor a una altura que no
                  // coincidía con el texto visible. `posAtDOM(dom, indice)`
                  // pide la posición en el offset `indice` DENTRO DEL PADRE
                  // (editorView.dom), que es exactamente el límite entre el
                  // hermano anterior y `hijo`, o sea antes del párrafo.
                  pos = editorView.posAtDOM(dom, indice);
                } catch {
                  pos = null;
                }
                if (pos !== null) {
                  // Espacio que sobra en la página ACTUAL (una sola
                  // `alturaUtil`, no un múltiplo) más el margen inferior de
                  // esta página, el pasillo entre hojas, y el margen
                  // superior de la próxima. Se redondea a px enteros para
                  // erradicar oscilaciones por subpíxeles entre pasadas.
                  const hueco = Math.round(
                    Math.max(0, alturaUtil - acumulado) + margenPagina * 2 + separacionPaginas,
                  );
                  puntosDeCorte.push({ pos, hueco });
                  paginaActual += 1;
                  // Reinicio, no seguir sumando: el nodo que se está por
                  // empujar es el primer contenido de la página nueva, así
                  // que su presupuesto de altura vuelve a arrancar en 0 (ver
                  // el comentario de más arriba sobre por qué un total
                  // global en vez de esto causaba el error acumulado hoja
                  // tras hoja). La propia altura de este nodo se suma normal
                  // más abajo (`acumulado += alturaConMargen`), como
                  // cualquier otra vuelta del bucle, así que ya queda
                  // contando para el presupuesto de la página nueva.
                  acumulado = 0;
                }
              }
              acumulado += alturaConMargen;
              finRealAnterior = inicioAplanado + alturaHijo;

              // Corrección maestra para nodos gigantes que no pudieron ser cortados:
              // si el texto fluyó de forma continua cruzando físicamente una o más
              // páginas enteras, sincronizamos el contador y el acumulado.
              // Cruzar una página y su hueco consume exactamente alturaPagina + separacionPaginas.
              const saltoCompleto = alturaPagina + separacionPaginas;
              while (acumulado > saltoCompleto) {
                acumulado -= saltoCompleto;
                paginaActual += 1;
              }
            }

            // Única fuente de verdad para "cuántas páginas hacen falta":
            // HojasEditor ya no lo calcula por su cuenta (dividía el alto
            // total del contenedor entre el alto de una hoja, una cuenta
            // más cruda que podía desacordar con esta, dejando una hoja de
            // fondo vacía o un tramo de texto sin hoja detrás). Se llama
            // siempre, incluso si más abajo no hace falta redespachar las
            // decoraciones, para que nunca quede desactualizado.
            actualizarPaginasCalculadas(paginaActual);

            // Evita despachar una transacción idéntica o equivalente a la anterior:
            // 1. firma === firmaAnterior: Pasada exactamente idéntica a la previa.
            // 2. sonCortesEquivalentes: Mismas posiciones de corte con diferencia de
            //    hueco <= 2px (subpixel jitter / colapso de margen estabilizado).
            // 3. historialFirmas.has(firma): Ciclo cerrado detectado (p. ej. oscilación
            //    periódica A -> B -> A). Detiene el bucle inmediatamente manteniendo
            //    el estado actual, sin agotar MAX_PASADAS_ENCADENADAS.
            const firma = JSON.stringify(puntosDeCorte);
            if (
              firma === firmaAnterior ||
              sonCortesEquivalentes(puntosDeCorte, cortesAnteriores, 2) ||
              historialFirmas.has(firma)
            ) {
              pasadasEncadenadas = 0;
              divisionesEncadenadas = 0;
              recalculoProgramado = false;
              historialFirmas.clear();
              cortesAnteriores = puntosDeCorte;
              firmaAnterior = firma;
              return;
            }

            pasadasEncadenadas += 1;
            if (pasadasEncadenadas > MAX_PASADAS_ENCADENADAS) {
              console.warn(
                "[Paginacion] el recálculo de paginación no convergió tras varias pasadas seguidas; se deja de recalcular para no colgar la pestaña. Esto no debería pasar en un documento normal — revisar el contenido de este apunte.",
              );
              pasadasEncadenadas = 0;
              divisionesEncadenadas = 0;
              recalculoProgramado = false;
              historialFirmas.clear();
              return;
            }

            historialFirmas.add(firma);
            cortesAnteriores = puntosDeCorte;
            firmaAnterior = firma;

            const decoraciones = puntosDeCorte.map(({ pos, hueco }) =>
              Decoration.widget(
                pos,
                () => {
                  const espaciador = document.createElement("div");
                  espaciador.className = "pagina-fantasma";
                  espaciador.contentEditable = "false";
                  espaciador.style.height = `${hueco}px`;
                  espaciador.style.userSelect = "none";
                  espaciador.style.pointerEvents = "none";
                  return espaciador;
                },
                { side: -1, key: `salto-${pos}` },
              ),
            );

            const tr = editorView.state.tr.setMeta(
              paginacionPluginKey,
              DecorationSet.create(editorView.state.doc, decoraciones),
            );
            editorView.dispatch(tr);
            // Recién acá se libera `recalculoProgramado`, DESPUÉS del
            // dispatch: `dispatch` invoca sincrónicamente el hook `update()`
            // de este plugin (más abajo), que llama a `programarRecalculo()`
            // de nuevo — si el flag ya estuviera en `false` en ese momento
            // (como pasaba antes, reseteándolo al principio de la función),
            // esa llamada programaría una pasada de "confirmación"
            // garantizada en cada cambio real, pagando el costo de medir
            // todo el documento dos veces en vez de una. Dejar el flag en
            // `true` hasta que el dispatch ya haya terminado evita esa
            // pasada redundante; si de verdad hace falta un recálculo
            // posterior (el alto del contenedor cambió de verdad), el propio
            // `ResizeObserver` lo dispara solo, en un macrotask aparte, así
            // que no se pierde ningún caso real.
            recalculoProgramado = false;
          }

          function programarRecalculo() {
            if (recalculoProgramado) return;
            recalculoProgramado = true;
            // setTimeout, no requestAnimationFrame: esto no es una animación
            // (rAF nunca corre si el navegador no está pintando un frame
            // nuevo, algo que puede tardar o no pasar en absoluto según el
            // estado de la pestaña/compositor), es un recálculo de layout
            // disparado por contenido. setTimeout(0) corre de todos modos,
            // incluso en pestañas en segundo plano, así que la paginación
            // nunca se queda "congelada" esperando un frame que no llega.
            setTimeout(medirYDecorar, 0);
          }

          if (editorView.dom.parentElement) {
            observador.observe(editorView.dom.parentElement);
          }
          programarRecalculo();

          // Un cambio de geometría (tamaño/orientación de página) sin
          // reflujo de texto no siempre dispara el ResizeObserver de
          // arriba: EVENTO_GEOMETRIA_CAMBIO fuerza el recálculo cuando eso
          // pasa (ver configuracion-pagina.ts).
          const manejarCambioGeometria = () => {
            cortesAnteriores = null;
            firmaAnterior = "";
            historialFirmas.clear();
            pasadasEncadenadas = 0;
            programarRecalculo();
          };
          window.addEventListener(EVENTO_GEOMETRIA_CAMBIO, manejarCambioGeometria);

          return {
            update: (view, prevState) => {
              if (prevState && prevState.doc !== view.state.doc) {
                cortesAnteriores = null;
                firmaAnterior = "";
                historialFirmas.clear();
                pasadasEncadenadas = 0;
              }
              programarRecalculo();
            },
            destroy: () => {
              observador.disconnect();
              window.removeEventListener(EVENTO_GEOMETRIA_CAMBIO, manejarCambioGeometria);
            },
          };
        },
      }),
    ];
  },
});
