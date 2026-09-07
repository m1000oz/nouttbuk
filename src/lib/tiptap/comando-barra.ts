import { Extension } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";

export type ItemComando = {
  titulo: string;
  descripcion: string;
  ejecutar: (editor: import("@tiptap/react").Editor) => void;
};

export type OpcionesComandoBarra = {
  suggestion: Partial<SuggestionOptions<ItemComando>>;
};

// Slash-command estilo Notion/Linear: escribir "/" al inicio de una línea
// abre un menú para insertar o cambiar de estilo, en vez de exigir que el
// usuario aprenda dónde vive cada botón en una barra siempre visible. Usa
// el mismo utilitario Suggestion que Tiptap ya usa para @menciones, no una
// reimplementación propia de detección de texto.
export const ComandoBarra = Extension.create<OpcionesComandoBarra>({
  name: "comandoBarra",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        startOfLine: true,
        command: ({ editor, range, props }) => {
          editor.chain().focus().deleteRange(range).run();
          (props as ItemComando).ejecutar(editor);
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
