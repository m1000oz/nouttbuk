import { Extension } from "@tiptap/core";

// A diferencia de FontSize (una marca sobre un tramo de texto, correcto
// para un atributo inline), el interlineado es una propiedad de bloque:
// se agrega como atributo global sobre paragraph/heading, mismo patrón que
// font-size-extension.ts (Tiptap v2 no trae esto propio, llegó recién en
// v3), pero vía addGlobalAttributes en vez de extender una marca.
export type LineHeightOptions = {
  types: string[];
};

export const LineHeight = Extension.create<LineHeightOptions>({
  name: "lineHeight",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => element.style.lineHeight || null,
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) return {};
              return { style: `line-height: ${attributes.lineHeight}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight:
        (lineHeight: string) =>
        ({ commands }) => {
          return this.options.types.every((tipo) =>
            commands.updateAttributes(tipo, { lineHeight }),
          );
        },
      unsetLineHeight:
        () =>
        ({ commands }) => {
          return this.options.types.every((tipo) =>
            commands.resetAttributes(tipo, "lineHeight"),
          );
        },
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight: (lineHeight: string) => ReturnType;
      unsetLineHeight: () => ReturnType;
    };
  }
}
