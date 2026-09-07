export type TemaEditor = "oscuro" | "claro";

export const TEMA_EDITOR_POR_DEFECTO: TemaEditor = "oscuro";

// Puente fuera de React para el menú de comandos "/" (menu-comandos.tsx):
// ese popup se agrega a mano a document.body (no es un portal de Base UI),
// así que no puede heredar las custom properties de .apunte-editor-overlay
// ni reaccionar a un cambio de tema por CSS solo. Se lee este valor al
// crear/actualizar el popup y se refleja como data-tema en su contenedor,
// mismo mecanismo que configuracion-pagina.ts usa para la geometría.
let temaActual: TemaEditor = TEMA_EDITOR_POR_DEFECTO;

export function actualizarTemaEditor(tema: TemaEditor) {
  temaActual = tema;
}

export function obtenerTemaEditor(): TemaEditor {
  return temaActual;
}
