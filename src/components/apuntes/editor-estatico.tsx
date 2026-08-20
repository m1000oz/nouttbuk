"use client";

import { useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import CharacterCount from "@tiptap/extension-character-count";

import { FontSize } from "@/lib/tiptap/font-size-extension";
import type { Json } from "@/lib/types/database.types";

type EditorEstaticoProps = {
  contenido?: Json;
  editable: boolean;
  onEditorListo: (editor: Editor | null) => void;
};

// El editor sin coedición: creación de apuntes nuevos, apuntes no `group`,
// y colaboradores con permiso `read` (la coedición en vivo se acota a
// `group`+`edit`, ver editor-colaborativo.tsx). El set de extensiones (más
// allá de StarterKit) tiene que coincidir con editor-colaborativo.tsx y
// detalle-publicacion.tsx: si un apunte con negrita/resaltado/enlaces se lee
// acá o se publica a Comunidad, tiene que verse igual en los tres lugares.
// La barra de formato y el contador de palabras no se renderizan acá: los
// monta ApunteEditor (el padre), que es quien conoce el layout completo del
// overlay (header, ancho del contenido) — este componente solo entrega la
// instancia del editor vía onEditorListo.
export function EditorEstatico({
  contenido,
  editable,
  onEditorListo,
}: EditorEstaticoProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      FontSize,
      Color,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      CharacterCount,
    ],
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
    },
  });

  useEffect(() => {
    onEditorListo(editor);
  }, [editor, onEditorListo]);

  return <EditorContent editor={editor} className="flex-1" />;
}
