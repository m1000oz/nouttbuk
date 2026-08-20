"use client";

import { useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import type { Json } from "@/lib/types/database.types";

type EditorEstaticoProps = {
  contenido?: Json;
  editable: boolean;
  onEditorListo: (editor: Editor | null) => void;
};

// El editor sin coedición: creación de apuntes nuevos, apuntes no `group`,
// y colaboradores con permiso `read` (la coedición en vivo se acota a
// `group`+`edit`, ver editor-colaborativo.tsx).
export function EditorEstatico({
  contenido,
  editable,
  onEditorListo,
}: EditorEstaticoProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: contenido as object | undefined,
    editable,
    // Evita el mismatch de hidratación: ProseMirror necesita el DOM real
    // del navegador, así que el primer render no debe intentar coincidir
    // con nada renderizado en el servidor.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-content focus:outline-none",
      },
    },
  });

  useEffect(() => {
    onEditorListo(editor);
  }, [editor, onEditorListo]);

  return <EditorContent editor={editor} className="flex-1" />;
}
