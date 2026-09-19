import { ReactNodeViewRenderer } from "@tiptap/react";

import { ImagenNodo, type ModoImagen } from "@/components/apuntes/imagen-nodo";
import { ImagenEsquema } from "@/lib/tiptap/imagen-esquema";

export type { ModoImagen };

// Nodo imagen del editor: el esquema de imagen-esquema.ts (ver ahí el detalle
// de `inline: true` y los tres modos de ajuste) más el NodeView de React
// (ImagenNodo) que dibuja las asas de arrastre y la barrita de modo.
export const ImagenRedimensionable = ImagenEsquema.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImagenNodo);
  },
});
