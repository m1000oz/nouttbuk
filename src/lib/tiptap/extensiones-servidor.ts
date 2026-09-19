import type { Extensions } from "@tiptap/core";

import {
  crearExtensionesConImagen,
  type OpcionesEsquema,
} from "@/lib/tiptap/extensiones-base";
import { ImagenEsquema } from "@/lib/tiptap/imagen-esquema";

// Mismo esquema que crearExtensionesEsquema() (extensiones-documento.ts) pero
// sin nada de React, para poder usarlo en rutas de servidor (sembrar salas
// Yjs). Si se agrega un nodo o marca nuevo, va en extensiones-base.ts y las
// dos listas lo heredan; tests/esquema-cliente-servidor.spec.ts vigila que no
// se desalineen.
export function crearExtensionesEsquemaServidor(opciones?: OpcionesEsquema): Extensions {
  return crearExtensionesConImagen(ImagenEsquema, opciones);
}
