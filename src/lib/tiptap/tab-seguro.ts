import { Extension } from "@tiptap/core";

// Sin esto, Tab fuera de una lista no está atado a ningún comando: el
// navegador ejecuta su comportamiento nativo y mueve el foco al siguiente
// elemento enfocable de la página (el botón "Guardar"), perdiendo cualquier
// texto que se estuviera por escribir. Siempre devuelve true (maneja la
// tecla) para que el foco jamás se le escape al editor, sin depender del
// orden de registro frente a ListItem (incluida en StarterKit).
export const TabSeguro = Extension.create({
  name: "tabSeguro",

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (this.editor.can().sinkListItem("listItem")) {
          return this.editor.commands.sinkListItem("listItem");
        }
        return this.editor.commands.insertContent("    ");
      },
      "Shift-Tab": () => {
        if (this.editor.can().liftListItem("listItem")) {
          return this.editor.commands.liftListItem("listItem");
        }
        return true;
      },
    };
  },
});
