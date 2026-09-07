import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

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

// Extensión que solo agrega decoraciones de vista (nunca toca `doc`): mide el
// alto real ya renderizado de cada nodo de nivel superior y, cuando uno haría
// que el acumulado cruce el límite de una hoja A4, inserta un espaciador
// invisible justo antes de ese nodo para empujarlo al inicio de la próxima
// hoja. El salto siempre cae en un límite de nodo completo (párrafo, tabla,
// imagen), así que nunca corta uno a la mitad. Al no modificar el documento,
// es segura tanto para el editor estático como para el colaborativo (Yjs
// solo sincroniza transacciones que cambian `doc`, y esta nunca lo hace) y
// para el guardado (`editor.getJSON()` sigue devolviendo el documento real,
// sin rastro de las decoraciones).
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
              if (acumulado > 0 && acumulado + alturaConMargen > paginaActual * alturaUtil) {
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
                  const hueco =
                    paginaActual * alturaUtil -
                    acumulado +
                    margenPagina * 2 +
                    separacionPaginas;
                  puntosDeCorte.push({ pos, hueco });
                  // `acumulado` tiene que seguir siendo una cuenta PURA de
                  // contenido real aplanado (comparable contra
                  // `paginaActual * alturaUtil`, la capacidad de N páginas
                  // de contenido, ambas en el mismo espacio "sin huecos").
                  // Sumarle el propio `hueco` acá (como hacía la versión
                  // anterior) mezclaba las dos escalas: cada salto inflaba
                  // `acumulado` con puro relleno de margen/separación que
                  // nunca fue contenido, así que para el segundo salto en
                  // adelante el umbral se cruzaba antes de tiempo (con
                  // documentos de 3+ hojas, la hoja 3 conservaba texto
                  // todavía dentro del rectángulo de la hoja 2). Solo
                  // `paginaActual` avanza acá; `acumulado` sigue
                  // acumulando nada más que altura de nodos reales, más
                  // abajo, igual que en cualquier otra vuelta del bucle.
                  paginaActual += 1;
                }
              }
              acumulado += alturaConMargen;
              finRealAnterior = inicioAplanado + alturaHijo;
            }

            // Única fuente de verdad para "cuántas páginas hacen falta":
            // HojasEditor ya no lo calcula por su cuenta (dividía el alto
            // total del contenedor entre el alto de una hoja, una cuenta
            // más cruda que podía desacordar con esta, dejando una hoja de
            // fondo vacía o un tramo de texto sin hoja detrás). Se llama
            // siempre, incluso si más abajo no hace falta redespachar las
            // decoraciones, para que nunca quede desactualizado.
            actualizarPaginasCalculadas(paginaActual);

            // Evita despachar una transacción idéntica a la anterior: sin
            // esto, el ResizeObserver reaccionaría a los cambios de tamaño
            // que sus propias decoraciones provocan en un ciclo (converge
            // solo, pero de forma más lenta e innecesaria).
            const firma = JSON.stringify(puntosDeCorte);
            if (firma === firmaAnterior) {
              // Pasada que no cambió nada: la cadena de recálculos (si
              // hubiera una en curso) terminó acá, así que es seguro volver
              // a permitir que se programe una nueva desde cero.
              pasadasEncadenadas = 0;
              recalculoProgramado = false;
              return;
            }

            pasadasEncadenadas += 1;
            if (pasadasEncadenadas > MAX_PASADAS_ENCADENADAS) {
              console.warn(
                "[Paginacion] el recálculo de paginación no convergió tras varias pasadas seguidas; se deja de recalcular para no colgar la pestaña. Esto no debería pasar en un documento normal — revisar el contenido de este apunte.",
              );
              pasadasEncadenadas = 0;
              recalculoProgramado = false;
              return;
            }
            firmaAnterior = firma;

            const decoraciones = puntosDeCorte.map(({ pos, hueco }) =>
              Decoration.widget(
                pos,
                () => {
                  const espaciador = document.createElement("div");
                  espaciador.className = "pagina-fantasma";
                  espaciador.style.height = `${hueco}px`;
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
          window.addEventListener(EVENTO_GEOMETRIA_CAMBIO, programarRecalculo);

          return {
            update: () => programarRecalculo(),
            destroy: () => {
              observador.disconnect();
              window.removeEventListener(EVENTO_GEOMETRIA_CAMBIO, programarRecalculo);
            },
          };
        },
      }),
    ];
  },
});
