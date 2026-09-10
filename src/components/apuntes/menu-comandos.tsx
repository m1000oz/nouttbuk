"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import {
  CheckSquareIcon,
  ImageIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  ParagraphIcon,
  QuotesIcon,
  TableIcon,
  TextHOneIcon,
  TextHTwoIcon,
  TextHThreeIcon,
  SigmaIcon,
} from "@phosphor-icons/react";
import type { Editor } from "@tiptap/react";
import { ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";

import type { ItemComando } from "@/lib/tiptap/comando-barra";
import { obtenerTemaEditor } from "@/lib/tiptap/tema-editor";
import { cn } from "@/lib/utils";

const ICONOS: Record<string, React.ComponentType<{ className?: string }>> = {
  parrafo: ParagraphIcon,
  h1: TextHOneIcon,
  h2: TextHTwoIcon,
  h3: TextHThreeIcon,
  vinetas: ListBulletsIcon,
  numerada: ListNumbersIcon,
  tarea: CheckSquareIcon,
  cita: QuotesIcon,
  tabla: TableIcon,
  imagen: ImageIcon,
  formula: SigmaIcon,
};

// Nombre del evento que dispara el input de imagen persistente montado en
// apunte-editor.tsx: evita tener que hilar una función a través de
// EditorEstatico/EditorColaborativo solo para que el comando "/Imagen" (que
// vive fuera de su árbol de props, dentro de la config de la extensión
// ComandoBarra) pueda abrir el selector de archivo.
export const EVENTO_INSERTAR_IMAGEN = "nouttbuk:insertar-imagen";

export function crearItemsComando(): (ItemComando & { icono: string })[] {
  return [
    {
      icono: "parrafo",
      titulo: "Párrafo",
      descripcion: "Texto normal",
      ejecutar: (editor) => editor.chain().focus().setParagraph().run(),
    },
    {
      icono: "h1",
      titulo: "Encabezado 1",
      descripcion: "Título principal de sección",
      ejecutar: (editor) =>
        editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      icono: "h2",
      titulo: "Encabezado 2",
      descripcion: "Subtítulo",
      ejecutar: (editor) =>
        editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      icono: "h3",
      titulo: "Encabezado 3",
      descripcion: "Subtítulo menor",
      ejecutar: (editor) =>
        editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      icono: "vinetas",
      titulo: "Lista con viñetas",
      descripcion: "Lista sin orden",
      ejecutar: (editor) => editor.chain().focus().toggleBulletList().run(),
    },
    {
      icono: "numerada",
      titulo: "Lista numerada",
      descripcion: "Lista con orden",
      ejecutar: (editor) => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      icono: "tarea",
      titulo: "Tarea",
      descripcion: "Lista de tareas con casillas",
      ejecutar: (editor) => editor.chain().focus().toggleTaskList().run(),
    },
    {
      icono: "cita",
      titulo: "Cita",
      descripcion: "Bloque de cita",
      ejecutar: (editor) => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      icono: "tabla",
      titulo: "Tabla",
      descripcion: "Tabla de 3x3",
      ejecutar: (editor) =>
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
    },
    {
      icono: "imagen",
      titulo: "Imagen",
      descripcion: "Subir una imagen",
      ejecutar: () => window.dispatchEvent(new CustomEvent(EVENTO_INSERTAR_IMAGEN)),
    },
    {
      icono: "formula",
      titulo: "Fórmula matemática",
      descripcion: "Fórmula matemática inline o en bloque",
      ejecutar: (editor) => editor.chain().focus().insertContent('$$ $$').run(),
    },
  ];
}

type MenuComandosProps = {
  items: ItemComando[];
  command: (item: ItemComando) => void;
};

export const MenuComandos = forwardRef<
  { onKeyDown: (props: { event: KeyboardEvent }) => boolean },
  MenuComandosProps
>(function MenuComandos({ items, command }, ref) {
  const [seleccionado, setSeleccionado] = useState(0);

  useEffect(() => {
    setSeleccionado(0);
  }, [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown({ event }) {
      if (event.key === "ArrowDown") {
        setSeleccionado((actual) => (actual + 1) % items.length);
        return true;
      }
      if (event.key === "ArrowUp") {
        setSeleccionado((actual) => (actual + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        const item = items[seleccionado];
        if (item) command(item);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="menu-comandos w-64 rounded-xl px-3 py-2 text-sm">
        Sin resultados
      </div>
    );
  }

  return (
    <div className="menu-comandos w-64 overflow-hidden rounded-xl p-1.5">
      {items.map((item, indice) => {
        const Icono = ICONOS[(item as ItemComando & { icono?: string }).icono ?? "parrafo"];
        return (
          <button
            key={item.titulo}
            type="button"
            className={cn(
              "menu-comandos-item flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left",
              indice === seleccionado && "is-activo",
            )}
            onClick={() => command(item)}
            onMouseEnter={() => setSeleccionado(indice)}
          >
            <span className="menu-comandos-icono flex size-8 shrink-0 items-center justify-center rounded-md">
              <Icono className="size-4" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-medium">{item.titulo}</span>
              <span className="text-xs opacity-60">{item.descripcion}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
});

// Fábrica del `render()` que Suggestion espera: monta MenuComandos en un
// contenedor con position:fixed posicionado a mano en cada onUpdate (no hay
// tippy.js en este proyecto), siguiendo el mismo patrón de "renderer
// imperativo + ReactRenderer" que Tiptap documenta para menciones/comandos.
export function crearRenderizadorComandos(): SuggestionOptions<ItemComando>["render"] {
  return () => {
    let componente: ReactRenderer<{ onKeyDown: (props: { event: KeyboardEvent }) => boolean }>;
    let contenedor: HTMLDivElement;

    function posicionar(clientRect: (() => DOMRect | null) | null | undefined) {
      const rect = clientRect?.();
      if (!rect) return;
      contenedor.style.left = `${rect.left}px`;
      contenedor.style.top = `${rect.bottom + 8}px`;
    }

    return {
      onStart: (props) => {
        componente = new ReactRenderer(MenuComandos, {
          props,
          editor: props.editor as Editor,
        });
        contenedor = document.createElement("div");
        contenedor.style.position = "fixed";
        contenedor.style.zIndex = "80";
        // Este popup vive en document.body, no dentro de .apunte-editor-
        // overlay: no puede heredar sus custom properties de tema, así que
        // el valor se refleja a mano como atributo (ver tema-editor.ts).
        contenedor.dataset.tema = obtenerTemaEditor();
        contenedor.appendChild(componente.element);
        document.body.appendChild(contenedor);
        posicionar(props.clientRect);
      },
      onUpdate(props) {
        contenedor.dataset.tema = obtenerTemaEditor();
        componente.updateProps(props);
        posicionar(props.clientRect);
      },
      onKeyDown(props) {
        if (props.event.key === "Escape") {
          // Igual que onExit: si solo se quita el contenedor del DOM sin
          // destruir el ReactRenderer, su .ref sigue vivo y @tiptap/suggestion
          // sigue enrutándole flechas/Enter (su estado interno "active" solo
          // se apaga cuando el cursor sale del rango "/query", no con Escape).
          contenedor.remove();
          componente.destroy();
          return true;
        }
        return componente.ref?.onKeyDown(props) ?? false;
      },
      onExit() {
        contenedor.remove();
        componente.destroy();
      },
    };
  };
}
