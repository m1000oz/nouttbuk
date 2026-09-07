"use client";

import { type MouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

import {
  GEOMETRIA_POR_DEFECTO,
  ENCABEZADO_PIE_POR_DEFECTO,
  EVENTO_PAGINAS_CAMBIO,
  obtenerPaginasCalculadas,
  type GeometriaPagina,
  type ConfiguracionEncabezadoPie,
} from "@/lib/tiptap/configuracion-pagina";

type HojasEditorProps = {
  editor: Editor | null;
  children: ReactNode;
  // Opcionales con default = el preset A4 original: detalle-publicacion.tsx
  // (la vista pública de Comunidad, sin UI de configuración de página) sigue
  // llamando a este componente sin pasarlos, y debe verse exactamente igual
  // que antes de esta ronda de cambios.
  geometria?: GeometriaPagina;
  encabezadoPie?: ConfiguracionEncabezadoPie;
  // El diálogo de contar palabras (dialogo-contar-palabras.tsx) necesita el
  // total de páginas, que ya se calcula acá: se levanta hacia el padre en
  // vez de recalcularlo una segunda vez con la misma fórmula.
  onPaginasChange?: (paginas: number) => void;
};

function sustituirTokens(texto: string, numero: number, total: number): string {
  return texto.replaceAll("{numero}", String(numero)).replaceAll("{total}", String(total));
}

// Reemplaza la única `.hoja-editor` de antes por N hojas apiladas: el
// contenido real (children, el <EditorContent> de EditorEstatico/
// EditorColaborativo) se renderiza una sola vez, en flujo normal, y los
// espaciadores que agrega la extensión Paginacion lo van empujando para que
// atraviese visualmente cada hoja de fondo en el punto correcto.
export function HojasEditor({
  editor,
  children,
  geometria = GEOMETRIA_POR_DEFECTO,
  encabezadoPie = ENCABEZADO_PIE_POR_DEFECTO,
  onPaginasChange,
}: HojasEditorProps) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [paginas, setPaginas] = useState(1);
  const { alturaPagina, anchoPagina, margenPagina, separacionPaginas } = geometria;

  // El conteo de páginas ya no se calcula acá (antes dividía el alto total
  // del contenedor entre el alto de una hoja, una cuenta cruda que incluye
  // el padding de arriba Y de abajo una sola vez, no por página, y por eso
  // podía desacordar con la cuenta real de la extensión Paginacion —
  // dejando una hoja de fondo vacía, o un tramo de texto sin hoja detrás
  // porque Paginacion no había insertado el salto que esta cuenta asumía).
  // Ahora solo se refleja el valor que Paginacion ya calculó nodo por
  // nodo, la única cuenta que también decide dónde van los saltos reales.
  useEffect(() => {
    function sincronizar() {
      const total = obtenerPaginasCalculadas();
      setPaginas(total);
      onPaginasChange?.(total);
    }

    sincronizar();
    window.addEventListener(EVENTO_PAGINAS_CAMBIO, sincronizar);
    return () => window.removeEventListener(EVENTO_PAGINAS_CAMBIO, sincronizar);
    // onPaginasChange no está en las dependencias a propósito, mismo
    // motivo que antes: si el padre no la memoiza, incluirla resuscribiría
    // el listener en cada render en vez de solo una vez por instancia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // `.hoja-editor` (fondo de página, alto fijo) y el contenedor real del
  // contenido (alto = el de su propio texto) son hermanos: si el apunte
  // tiene poco texto, el resto de la hoja que se ve de fondo no tiene nada
  // clickeable encima y el clic cae en el vacío. Si el clic no aterrizó
  // dentro del propio DOM de ProseMirror, se resuelve a mano la posición más
  // cercana (o el final del documento si quedó por debajo de todo).
  function manejarClicPila(event: MouseEvent<HTMLDivElement>) {
    if (!editor || !editor.isEditable) return;
    const dom = editor.view.dom;
    const objetivo = event.target as HTMLElement;
    if (dom.contains(objetivo)) return;
    // Defensivo: si algún día un elemento interactivo vive como hermano del
    // ProseMirror dentro de este contenedor (el título vivió acá antes de
    // moverse al header), un clic para usarlo no debe robarle el foco de
    // vuelta al cuerpo del apunte.
    if (objetivo.closest('input, textarea, button, a, select, [contenteditable="true"]')) {
      return;
    }
    const resultado = editor.view.posAtCoords({
      left: event.clientX,
      top: event.clientY,
    });
    if (resultado) {
      editor.chain().focus().setTextSelection(resultado.pos).run();
    } else {
      editor.chain().focus("end").run();
    }
  }

  return (
    <div
      className="pila-hojas relative"
      // `width` fijo, no `w-full` + `maxWidth`: el div que envuelve esto en
      // apunte-editor.tsx (el que aplica `transform: scale(zoom)`) es un
      // ítem flex sin ancho propio, así que su tamaño se calcula por
      // shrink-to-fit a partir de sus hijos. Un ancho en `%` (w-full) no
      // aporta nada a ese cálculo (el spec trata los porcentajes como 0 para
      // fines de sizing intrínseco), así que con una hoja recién creada y
      // sin texto, el shrink-to-fit terminaba viendo solo el padding del
      // contenedor de contenido (144px) en vez de los 794px reales del
      // preset A4, y la hoja salía "delgadísima" hasta que había texto
      // suficiente para forzar un ancho mayor. Un ancho fijo en px sí cuenta
      // como preferred width real, así que rompe esa ambigüedad de raíz.
      style={{ width: anchoPagina, maxWidth: "100%" }}
      onClick={manejarClicPila}
    >
      {Array.from({ length: paginas }).map((_, indice) => {
        const esPrimera = indice === 0;
        const ocultarEncabezadoPie = encabezadoPie.primeraPaginaDistinta && esPrimera;
        const numeroPagina = indice + 1;
        const textoPie = encabezadoPie.pie
          ? sustituirTokens(encabezadoPie.pie, numeroPagina, paginas)
          : encabezadoPie.mostrarNumeroPagina
            ? String(numeroPagina)
            : "";

        return (
          <div
            key={indice}
            aria-hidden
            className="hoja-editor absolute w-full"
            style={{
              top: indice * (alturaPagina + separacionPaginas),
              height: alturaPagina,
            }}
          >
            {!ocultarEncabezadoPie && encabezadoPie.encabezado && (
              <span
                className="hoja-encabezado-pie"
                style={{ top: Math.max(12, margenPagina * 0.3) }}
              >
                {sustituirTokens(encabezadoPie.encabezado, numeroPagina, paginas)}
              </span>
            )}
            {!ocultarEncabezadoPie && textoPie && (
              <span
                className="hoja-encabezado-pie"
                style={{ bottom: Math.max(12, margenPagina * 0.3) }}
              >
                {textoPie}
              </span>
            )}
          </div>
        );
      })}
      <div
        ref={contenedorRef}
        className="relative"
        style={{ padding: `${margenPagina}px ${Math.round(margenPagina * 0.75)}px` }}
      >
        {children}
      </div>
    </div>
  );
}
