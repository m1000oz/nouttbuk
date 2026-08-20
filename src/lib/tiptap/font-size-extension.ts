import TextStyle from "@tiptap/extension-text-style";

// Tiptap v2 no trae un tamaño de fuente propio (llegó recién en v3, ver el
// gotcha de este proyecto sobre no poder subir de v2). Se extiende TextStyle
// (el mismo mark que ya usa Color) con un atributo `fontSize`, patrón
// documentado por el propio Tiptap para este caso exacto.
export const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize}` };
        },
      },
    };
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) =>
          chain().setMark(this.name, { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark(this.name, { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}
