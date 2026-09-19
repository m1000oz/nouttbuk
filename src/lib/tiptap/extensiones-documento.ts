import type { Extensions } from "@tiptap/core";

import {
  crearExtensionesConImagen,
  type OpcionesEsquema,
} from "@/lib/tiptap/extensiones-base";
import { ImagenRedimensionable } from "@/lib/tiptap/imagen-extension";

// Única lista de extensiones del esquema Tiptap en el navegador, compartida
// por editor-estatico.tsx, editor-colaborativo.tsx y detalle-publicacion.tsx:
// si un apunte con negrita/resaltado/enlaces se edita, coedita o publica a
// Comunidad, se ve igual en los tres porque los tres importan de acá.
// Ver extensiones-base.ts para el detalle de cada extensión y del gotcha de
// StarterKit; el servidor usa la variante sin NodeView de React
// (extensiones-servidor.ts), con el mismo esquema.
export function crearExtensionesEsquema(opciones?: OpcionesEsquema): Extensions {
  return crearExtensionesConImagen(ImagenRedimensionable, opciones);
}
