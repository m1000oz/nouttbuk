"use client";

import { useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";

import { crearExtensionesEsquema } from "@/lib/tiptap/extensiones-documento";
import { Paginacion } from "@/lib/tiptap/pagination-extension";
import { obtenerGeometriaConfiguracionPagina } from "@/lib/tiptap/configuracion-pagina";
import { BuscarReemplazar } from "@/lib/tiptap/buscar-reemplazar-extension";
import { ComandoBarra } from "@/lib/tiptap/comando-barra";
import { crearItemsComando, crearRenderizadorComandos } from "@/components/apuntes/menu-comandos";
import { crearTransformPasted } from "@/lib/tiptap/pegar-lineas-como-parrafos";
import { manejarClicParaAbrirEnlace } from "@/lib/tiptap/abrir-enlace-con-clic";
import type { Json } from "@/lib/types/database.types";

// Calculado una sola vez al cargar el módulo, no dentro del componente:
// StarterKit.configure() crea una instancia nueva de su extensión Gapcursor
// en cada llamada, y ProseMirror registra el "selection JSON ID" de esa
// extensión en un registro global que revienta con "Duplicate use of
// selection JSON ID" si se registra más de una vez con una instancia
// distinta (pasaba en cada re-render, ver editor-colaborativo.tsx que ya
// evitaba esto calculando su propio arreglo a nivel de módulo).
const EXTENSIONES = [
  ...crearExtensionesEsquema(),
  Paginacion.configure({ obtenerGeometria: obtenerGeometriaConfiguracionPagina }),
  BuscarReemplazar,
  ComandoBarra.configure({
    suggestion: {
      items: ({ query }: { query: string }) =>
        crearItemsComando().filter((item) =>
          item.titulo.toLowerCase().includes(query.toLowerCase()),
        ),
      render: crearRenderizadorComandos(),
    },
  }),
];

type EditorEstaticoProps = {
  contenido?: Json;
  editable: boolean;
  onEditorListo: (editor: Editor | null) => void;
};

// El editor sin coedición: creación de apuntes nuevos, apuntes no `group`,
// y colaboradores con permiso `read` (la coedición en vivo se acota a
// `group`+`edit`, ver editor-colaborativo.tsx). El set de extensiones viene
// de crearExtensionesEsquema() (src/lib/tiptap/extensiones-documento.ts),
// compartido con editor-colaborativo.tsx y detalle-publicacion.tsx: si un
// apunte con negrita/resaltado/enlaces se lee acá o se publica a Comunidad,
// se ve igual en los tres porque importan la misma función, no por
// convención. La barra de formato y el contador de palabras no se
// renderizan acá: los monta ApunteEditor (el padre), que es quien conoce el
// layout completo del overlay (header, ancho del contenido) — este
// componente solo entrega la instancia del editor vía onEditorListo.
export function EditorEstatico({
  contenido,
  editable,
  onEditorListo,
}: EditorEstaticoProps) {
  const editor = useEditor({
    extensions: EXTENSIONES,
    content: contenido as object | undefined,
    editable,
    // Evita el mismatch de hidratación: ProseMirror necesita el DOM real
    // del navegador, así que el primer render no debe intentar coincidir
    // con nada renderizado en el servidor.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-content focus:outline-none",
        spellcheck: "true",
      },
      transformPasted: crearTransformPasted(),
      handleClick: manejarClicParaAbrirEnlace,
    },
  });

  useEffect(() => {
    onEditorListo(editor);
  }, [editor, onEditorListo]);

  return <EditorContent editor={editor} className="flex-1" />;
}
