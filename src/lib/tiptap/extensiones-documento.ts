import type { Extensions } from "@tiptap/core";
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
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

import { FontSize } from "@/lib/tiptap/font-size-extension";
import { LineHeight } from "@/lib/tiptap/line-height-extension";
import { TabSeguro } from "@/lib/tiptap/tab-seguro";

type OpcionesEsquema = {
  // false en editor-colaborativo.tsx: ahí el historial de deshacer/rehacer
  // lo maneja Yjs (Collaboration.configure), no StarterKit.
  historial?: boolean;
  // true solo en detalle-publicacion.tsx: la lectura pública de Comunidad
  // permite abrir enlaces con un clic, el editor (privado/colaborativo) no,
  // para no navegar afuera sin querer mientras se escribe.
  enlaceClicable?: boolean;
};

// StarterKit.configure() tiene que llamarse A LO SUMO UNA VEZ por
// configuración distinta en todo el árbol de módulos: agrupa (entre otras)
// la extensión Gapcursor, y ProseMirror registra su "selection JSON ID" en
// un registro global que revienta con "Duplicate use of selection JSON ID"
// si dos instancias distintas de StarterKit (una por cada módulo que llama
// a crearExtensionesEsquema(), aunque sea una sola vez cada uno) terminan
// coexistiendo en el mismo bundle — pasa acá porque editor-estatico.tsx y
// editor-colaborativo.tsx se importan los dos siempre desde apunte-editor.tsx,
// aunque solo uno se monte según la visibilidad del apunte. Por eso estas dos
// instancias (las únicas dos configuraciones que este proyecto usa) se
// construyen una sola vez acá, a nivel de módulo, y crearExtensionesEsquema
// reutiliza la que corresponda en vez de volver a llamar a .configure().
const STARTER_KIT_CON_HISTORIAL = StarterKit.configure({});
const STARTER_KIT_SIN_HISTORIAL = StarterKit.configure({ history: false });

// Única lista de extensiones del esquema Tiptap, compartida por los tres
// lugares que antes la declaraban a mano por separado (editor-estatico.tsx,
// editor-colaborativo.tsx y detalle-publicacion.tsx): si un apunte con
// negrita/resaltado/enlaces se edita, coedita o publica a Comunidad, se ve
// igual en los tres porque los tres importan de acá, no porque un
// comentario lo pida. Paginacion queda deliberadamente afuera: no define
// nodos ni marcas, así que no es parte del esquema que alimenta getSchema()
// para sembrar Yjs, cada consumidor la agrega aparte a su propio arreglo de
// extensions en vivo.
export function crearExtensionesEsquema(opciones?: OpcionesEsquema): Extensions {
  return [
    opciones?.historial === false ? STARTER_KIT_SIN_HISTORIAL : STARTER_KIT_CON_HISTORIAL,
    Underline,
    FontSize,
    Color,
    FontFamily,
    Highlight.configure({ multicolor: true }),
    Link.configure({
      openOnClick: opciones?.enlaceClicable ?? false,
      autolink: true,
    }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Image,
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    CharacterCount,
    Subscript,
    Superscript,
    TaskList,
    TaskItem.configure({ nested: true }),
    LineHeight,
    TabSeguro,
  ];
}
