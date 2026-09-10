import type { EditorView } from "@tiptap/pm/view";

// Link.configure({ openOnClick: false }) en el editor privado/colaborativo
// (extensiones-documento.ts) es intencional: un clic normal sobre un enlace
// debe mover el cursor para poder editar el texto de alrededor, no navegar
// afuera sin querer mientras se escribe (a diferencia de la vista pública de
// Comunidad, que sí navega con un clic simple). Pero eso dejaba sin ninguna
// forma de abrir el enlace desde dentro del editor. Se agrega acá el
// atajo estándar de cualquier editor de texto enriquecido (Docs, Notion,
// Word Online): Ctrl/Cmd + clic abre el enlace en una pestaña nueva, un
// clic simple sigue editando.
export function manejarClicParaAbrirEnlace(
  _view: EditorView,
  _pos: number,
  event: MouseEvent,
): boolean {
  if (!event.ctrlKey && !event.metaKey) return false;
  const objetivo = event.target as HTMLElement | null;
  const ancla = objetivo?.closest("a[href]");
  const href = ancla?.getAttribute("href");
  if (!href) return false;
  window.open(href, "_blank", "noopener,noreferrer");
  return true;
}
