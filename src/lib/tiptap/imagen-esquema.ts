import Image from "@tiptap/extension-image";

import type { ModoImagen } from "@/components/apuntes/imagen-nodo";

export type { ModoImagen };

// Definición de ESQUEMA del nodo imagen: atributos y opciones, sin vista.
// Está separada de imagen-extension.ts (que le agrega el NodeView de React)
// porque el servidor necesita el esquema exacto para sembrar salas Yjs
// (src/lib/liveblocks/sembrar-sala.ts) y `@tiptap/react` no se puede cargar
// en ese entorno. Un NodeView no cambia el esquema, así que ambos coinciden.

// El nodo Image de Tiptap no trae `width` ni una forma de alinearla (ver el
// gotcha correspondiente): se extiende acá con esos dos atributos y un
// NodeView de React (ImagenNodo) que dibuja las asas de arrastre y la
// barrita de modo de ajuste.
//
// `inline: true` (Image trae `inline: false` por defecto, ver
// addOptions() de @tiptap/extension-image): pedido explícito del usuario
// ("las imágenes... podrías hacer que convivan con el texto? Así como las
// funciones de Docs"). Con `inline: false` la imagen es un nodo de bloque
// propio: insertarla en medio de un párrafo lo parte en dos, y no hay forma
// de que el texto la rodee. Con `inline: true` se vuelve parte del flujo de
// texto del párrafo (group: "inline", ver la propia extensión), igual que
// Docs trata "En línea con el texto" como el modo por defecto. Los otros dos
// modos ("izquierda"/"derecha", ver ModoImagen en imagen-nodo.tsx) usan
// `float` en vez de position/margin de bloque, que es lo que de verdad deja
// que el texto fluya alrededor — el equivalente real a "Ajustar texto" de
// Docs, no una alineación de bloque disfrazada. `.tiptap-content p::after`
// (globals.css) limpia el float al final de cada párrafo a propósito: sin
// eso el float podría "escaparse" hacia párrafos siguientes y desalinear la
// medición de altura por nodo que usa Paginacion (cada párrafo es la unidad
// que se mide para paginar, así que cada uno necesita poder medirse solo).
// Como ningún apunte real todavía tiene imágenes guardadas (proyecto nuevo,
// confirmado en la base de datos), no hace falta migrar nada: no existe una
// imagen real con el layout de bloque anterior que este cambio pueda
// descolocar.
export const ImagenEsquema = Image.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      inline: true,
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => element.style.width || element.getAttribute("width") || null,
        renderHTML: (attributes) => (attributes.width ? { style: `width: ${attributes.width}` } : {}),
      },
      align: {
        default: "linea" as ModoImagen,
        parseHTML: (element) => (element.getAttribute("data-align") as ModoImagen | null) ?? "linea",
        renderHTML: (attributes) => ({ "data-align": attributes.align }),
      },
    };
  },

});
