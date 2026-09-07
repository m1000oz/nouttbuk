import { Extension, type CommandProps } from "@tiptap/core";
import { PluginKey, Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

// No existe un paquete oficial de Tiptap para esto (ni siquiera en v3):
// extensión hermana de pagination-extension.ts en espíritu (Plugin +
// Decoration para resaltar coincidencias, nunca toca `doc` para eso), salvo
// que reemplazar sí despacha transacciones reales — las únicas dos
// operaciones de este archivo que mutan el documento.
export type ResultadoBusqueda = { from: number; to: number };

export type EstadoBusqueda = {
  termino: string;
  resultados: ResultadoBusqueda[];
  indiceActual: number;
};

const ESTADO_VACIO: EstadoBusqueda = { termino: "", resultados: [], indiceActual: -1 };

const pluginKey = new PluginKey<DecorationSet>("buscarReemplazar");

function encontrarCoincidencias(doc: ProseMirrorNode, termino: string): ResultadoBusqueda[] {
  const buscado = termino.trim().toLowerCase();
  if (!buscado) return [];
  const resultados: ResultadoBusqueda[] = [];
  doc.descendants((nodo, pos) => {
    if (!nodo.isText || !nodo.text) return;
    const texto = nodo.text.toLowerCase();
    let indice = texto.indexOf(buscado);
    while (indice !== -1) {
      resultados.push({ from: pos + indice, to: pos + indice + buscado.length });
      indice = texto.indexOf(buscado, indice + 1);
    }
  });
  return resultados;
}

function construirDecoraciones(
  doc: ProseMirrorNode,
  resultados: ResultadoBusqueda[],
  indiceActual: number,
): DecorationSet {
  return DecorationSet.create(
    doc,
    resultados.map(({ from, to }, indice) =>
      Decoration.inline(from, to, {
        class: indice === indiceActual ? "buscar-resultado-activo" : "buscar-resultado",
      }),
    ),
  );
}

export const BuscarReemplazar = Extension.create({
  name: "buscarReemplazar",

  addStorage(): EstadoBusqueda {
    return { ...ESTADO_VACIO };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: pluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, decoraciones) {
            const meta = tr.getMeta(pluginKey) as DecorationSet | undefined;
            if (meta) return meta;
            if (!tr.docChanged) return decoraciones;
            return decoraciones.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return pluginKey.getState(state);
          },
        },
      }),
    ];
  },

  addCommands() {
    return {
      // Reescanea todo el documento y resalta cada coincidencia (sin
      // distinguir mayúsculas/minúsculas). No mueve la selección: eso lo
      // hace irResultadoSiguiente/Anterior, para que "Buscar" y "navegar
      // entre resultados" sean pasos separados, como en cualquier buscador.
      buscarTermino:
        (termino: string) =>
        ({ editor, tr, dispatch }: CommandProps) => {
          const resultados = encontrarCoincidencias(editor.state.doc, termino);
          const indiceActual = resultados.length > 0 ? 0 : -1;
          this.storage.termino = termino;
          this.storage.resultados = resultados;
          this.storage.indiceActual = indiceActual;
          if (dispatch) {
            dispatch(
              tr.setMeta(pluginKey, construirDecoraciones(editor.state.doc, resultados, indiceActual)),
            );
          }
          return resultados.length > 0;
        },
      irResultadoSiguiente:
        () =>
        ({ editor, chain }: CommandProps) => {
          const { resultados, indiceActual } = this.storage as EstadoBusqueda;
          if (resultados.length === 0) return false;
          const siguiente = (indiceActual + 1) % resultados.length;
          this.storage.indiceActual = siguiente;
          const { from, to } = resultados[siguiente];
          editor.view.dispatch(
            editor.state.tr.setMeta(pluginKey, construirDecoraciones(editor.state.doc, resultados, siguiente)),
          );
          return chain().setTextSelection({ from, to }).scrollIntoView().run();
        },
      irResultadoAnterior:
        () =>
        ({ editor, chain }: CommandProps) => {
          const { resultados, indiceActual } = this.storage as EstadoBusqueda;
          if (resultados.length === 0) return false;
          const anterior = (indiceActual - 1 + resultados.length) % resultados.length;
          this.storage.indiceActual = anterior;
          const { from, to } = resultados[anterior];
          editor.view.dispatch(
            editor.state.tr.setMeta(pluginKey, construirDecoraciones(editor.state.doc, resultados, anterior)),
          );
          return chain().setTextSelection({ from, to }).scrollIntoView().run();
        },
      // Reemplaza solo la coincidencia actualmente seleccionada
      // (indiceActual) y vuelve a escanear desde cero: las posiciones de
      // las demás coincidencias cambian si el reemplazo tiene otra
      // longitud que el término buscado.
      reemplazarActual:
        (texto: string) =>
        ({ tr, dispatch, commands }: CommandProps) => {
          const { resultados, indiceActual, termino } = this.storage as EstadoBusqueda;
          const actual = resultados[indiceActual];
          if (!actual) return false;
          if (dispatch) {
            tr.insertText(texto, actual.from, actual.to);
            dispatch(tr);
          }
          return commands.buscarTermino(termino);
        },
      // Reemplaza todas las coincidencias en una sola transacción, en orden
      // descendente de posición: así ninguna posición ya usada se corre por
      // culpa de un reemplazo anterior dentro de la misma pasada.
      reemplazarTodos:
        (texto: string) =>
        ({ tr, dispatch }: CommandProps) => {
          const { resultados } = this.storage as EstadoBusqueda;
          if (resultados.length === 0) return false;
          if (dispatch) {
            const ordenados = [...resultados].sort((a, b) => b.from - a.from);
            for (const { from, to } of ordenados) {
              tr.insertText(texto, from, to);
            }
            tr.setMeta(pluginKey, DecorationSet.empty);
            dispatch(tr);
          }
          this.storage.termino = "";
          this.storage.resultados = [];
          this.storage.indiceActual = -1;
          return true;
        },
      limpiarBusqueda:
        () =>
        ({ tr, dispatch }: CommandProps) => {
          this.storage.termino = "";
          this.storage.resultados = [];
          this.storage.indiceActual = -1;
          if (dispatch) dispatch(tr.setMeta(pluginKey, DecorationSet.empty));
          return true;
        },
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    buscarReemplazar: {
      buscarTermino: (termino: string) => ReturnType;
      irResultadoSiguiente: () => ReturnType;
      irResultadoAnterior: () => ReturnType;
      reemplazarActual: (texto: string) => ReturnType;
      reemplazarTodos: (texto: string) => ReturnType;
      limpiarBusqueda: () => ReturnType;
    };
  }
}
