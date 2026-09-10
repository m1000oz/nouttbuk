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
      // `...this.parent?.()` (igual que en addAttributes, arriba): sin esto,
      // el comando `removeEmptyTextStyle` que TextStyle define en su propio
      // addCommands() se pierde por completo, porque un addCommands() que
      // no hace spread REEMPLAZA al del padre en vez de extenderlo (a
      // diferencia de otros hooks de Tiptap). Como esta extensión es la
      // única instancia real de la marca "textStyle" en el esquema (Color y
      // FontFamily solo le agregan atributos globales, no la redefinen),
      // ese comando faltante rompía en producción tres botones distintos
      // que lo llaman por dentro: "Predeterminado" acá mismo (más abajo),
      // "Predeterminada" en SelectorFuente (unsetFontFamily) y "Quitar
      // color" en SelectorColor (unsetColor) — los tres tiraban
      // `removeEmptyTextStyle is not a function` al hacer clic y se
      // quedaban sin aplicar nada, con el menú abierto (la excepción corta
      // la función antes de llegar al setOpen(false) final).
      ...this.parent?.(),
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
