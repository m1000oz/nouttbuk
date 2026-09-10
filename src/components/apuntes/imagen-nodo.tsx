"use client";

import { useRef } from "react";
import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import {
  ArrowCounterClockwiseIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
} from "@phosphor-icons/react";

// "linea": en línea con el texto, sin float — el modo por defecto de Docs,
// la imagen es un carácter más del párrafo. "izquierda"/"derecha": flotante
// de verdad (`float`, ver globals.css), el texto del propio párrafo fluye
// alrededor — el equivalente real a "Ajustar texto" de Docs, no una
// alineación de bloque disfrazada de eso.
export type ModoImagen = "linea" | "izquierda" | "derecha";

const ANCHO_MINIMO_PX = 80;

type Esquina = "arriba-izquierda" | "arriba-derecha" | "abajo-izquierda" | "abajo-derecha";

const ASAS: { esquina: Esquina; estilo: { top?: number; bottom?: number; left?: number; right?: number }; cursor: string }[] = [
  { esquina: "arriba-izquierda", estilo: { top: -4, left: -4 }, cursor: "nwse-resize" },
  { esquina: "arriba-derecha", estilo: { top: -4, right: -4 }, cursor: "nesw-resize" },
  { esquina: "abajo-izquierda", estilo: { bottom: -4, left: -4 }, cursor: "nesw-resize" },
  { esquina: "abajo-derecha", estilo: { bottom: -4, right: -4 }, cursor: "nwse-resize" },
];

// NodeView de React para el nodo `image` extendido (ver imagen-extension.ts):
// dibuja las cuatro asas de esquina para redimensionar arrastrando y una
// barrita con los tres modos de convivencia con el texto, ambas visibles
// solo cuando la imagen está seleccionada (selección de nodo real de
// ProseMirror, no un estado local) y el editor es editable (nunca en la
// vista pública de solo lectura de Comunidad, ver detalle-publicacion.tsx).
export function ImagenNodo({ node, updateAttributes, selected, editor, getPos }: ReactNodeViewProps) {
  const imagenRef = useRef<HTMLImageElement>(null);
  const editable = editor.isEditable;
  const modo = (node.attrs.align as ModoImagen | null) ?? "linea";
  const anchoGuardado = node.attrs.width as string | null;

  // A diferencia de un nodo de bloque (donde ProseMirror ya resolvía un
  // clic directo a una NodeSelection del nodo completo), un nodo `inline`
  // no lo hace por defecto: un clic sobre una imagen en línea con el texto
  // resuelve a la posición de cursor de texto más cercana, no a
  // seleccionar la imagen (comportamiento propio de ProseMirror, no un
  // bug de esta extensión). Sin esto, un clic normal nunca mostraba las
  // asas ni la barrita de modo, la única forma de seleccionar la imagen
  // era llegar con las flechas del teclado.
  function seleccionar() {
    if (!editable) return;
    editor.commands.setNodeSelection(getPos());
  }

  // Arrastre resuelto por completo con DOM imperativo (sin useState): cada
  // sesión de arrastre define `mover`/`soltar` frescas, cerrando sobre el
  // ancho y la posición inicial de ESE arrastre puntual, así que no hay
  // closures obsoletas de un estado de React que todavía no terminó de
  // re-renderizar. Solo al soltar se confirma el ancho final con
  // `updateAttributes`, una única transacción (no una por cada pixel
  // arrastrado, que en el editor colaborativo se sincronizaría entera a
  // cada colaborador en vivo vía Yjs).
  function iniciarArrastre(evento: React.PointerEvent, esquina: Esquina) {
    if (!editable || !imagenRef.current) return;
    evento.preventDefault();
    evento.stopPropagation();

    const imagen = imagenRef.current;
    const anchoInicial = imagen.getBoundingClientRect().width;
    const clienteXInicial = evento.clientX;
    const haciaLaIzquierda = esquina.endsWith("izquierda");
    // Tope real de ancho disponible: el propio DOM de ProseMirror (la hoja
    // ya descuenta sus márgenes de página), no un valor fijo que ignoraría
    // un margen de página distinto al preset A4 (ver configuracion-pagina.ts).
    const anchoMaximo = imagen.closest(".tiptap-content")?.clientWidth ?? Number.POSITIVE_INFINITY;

    function mover(eventoMovimiento: PointerEvent) {
      const delta = (eventoMovimiento.clientX - clienteXInicial) * (haciaLaIzquierda ? -1 : 1);
      const nuevoAncho = Math.min(anchoMaximo, Math.max(ANCHO_MINIMO_PX, anchoInicial + delta));
      imagen.style.width = `${nuevoAncho}px`;
    }

    function soltar() {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      const anchoFinal = Math.round(imagen.getBoundingClientRect().width);
      updateAttributes({ width: `${anchoFinal}px` });
    }

    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
  }

  return (
    <NodeViewWrapper
      as="span"
      className={`imagen-nodo${selected ? " is-seleccionada" : ""}`}
      data-align={modo}
      onClick={seleccionar}
    >
      <img
        ref={imagenRef}
        src={node.attrs.src}
        alt={node.attrs.alt ?? ""}
        title={node.attrs.title ?? undefined}
        style={anchoGuardado ? { width: anchoGuardado } : undefined}
        draggable={false}
      />
      {selected && editable && (
        <>
          {ASAS.map(({ esquina, estilo, cursor }) => (
            <div
              key={esquina}
              className="imagen-asa"
              style={{ ...estilo, cursor }}
              onPointerDown={(evento) => iniciarArrastre(evento, esquina)}
            />
          ))}
          <div className="imagen-barra-flotante" onMouseDown={(evento) => evento.preventDefault()}>
            <button
              type="button"
              aria-label="Ajustar texto a la izquierda"
              title="Ajustar texto a la izquierda"
              aria-pressed={modo === "izquierda"}
              className={`barra-flotante-boton${modo === "izquierda" ? " is-activo" : ""}`}
              onClick={() => updateAttributes({ align: "izquierda" as ModoImagen })}
            >
              <TextAlignLeftIcon aria-hidden />
            </button>
            <button
              type="button"
              aria-label="En línea con el texto"
              title="En línea con el texto"
              aria-pressed={modo === "linea"}
              className={`barra-flotante-boton${modo === "linea" ? " is-activo" : ""}`}
              onClick={() => updateAttributes({ align: "linea" as ModoImagen })}
            >
              <TextAlignCenterIcon aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Ajustar texto a la derecha"
              title="Ajustar texto a la derecha"
              aria-pressed={modo === "derecha"}
              className={`barra-flotante-boton${modo === "derecha" ? " is-activo" : ""}`}
              onClick={() => updateAttributes({ align: "derecha" as ModoImagen })}
            >
              <TextAlignRightIcon aria-hidden />
            </button>
            {anchoGuardado && (
              <button
                type="button"
                aria-label="Restablecer tamaño original"
                title="Restablecer tamaño original"
                className="barra-flotante-boton"
                onClick={() => updateAttributes({ width: null })}
              >
                <ArrowCounterClockwiseIcon aria-hidden />
              </button>
            )}
          </div>
        </>
      )}
    </NodeViewWrapper>
  );
}
