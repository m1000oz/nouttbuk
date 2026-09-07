"use client";

import { type RefObject, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  CheckSquareIcon,
  EraserIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  QuotesIcon,
  TextSubscriptIcon,
  TextSuperscriptIcon,
  TableIcon,
  TextAaIcon,
  TextAlignCenterIcon,
  TextAlignJustifyIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  TextBIcon,
  TextItalicIcon,
  TextStrikethroughIcon,
  TextUnderlineIcon,
} from "@phosphor-icons/react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BotonBarra,
  BotonImagen,
  Separador,
  SelectorColor,
  SelectorEnlace,
  SelectorEstiloBloque,
  SelectorFuente,
  SelectorInterlineado,
  SelectorTamano,
  useEstadoEditor,
} from "@/components/apuntes/editor-controles-formato";
import { cn } from "@/lib/utils";

const TABLA_MAX_FILAS = 6;
const TABLA_MAX_COLUMNAS = 8;

// Selector de tabla estilo Docs: una grilla de celdas donde el hover elige
// filas x columnas antes de confirmar con clic, en vez de insertar siempre
// un 3x3 fijo.
function SelectorTabla({
  editor,
  puedeInsertar,
  overlayRef,
}: {
  editor: Editor;
  puedeInsertar: boolean;
  overlayRef?: RefObject<HTMLElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState({ filas: 0, columnas: 0 });

  function insertar(filas: number, columnas: number) {
    editor.chain().focus().insertTable({ rows: filas, cols: columnas, withHeaderRow: true }).run();
    setOpen(false);
    setHover({ filas: 0, columnas: 0 });
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className="barra-flotante-boton"
        aria-label="Insertar tabla"
        disabled={!puedeInsertar}
        onMouseDown={(event) => event.preventDefault()}
      >
        <TableIcon aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" container={overlayRef} className="menu-flotante-popover w-auto p-2">
        <div className="mb-1.5 text-center text-xs opacity-70">
          {hover.filas > 0 ? `${hover.filas} x ${hover.columnas}` : "Elegir tamaño"}
        </div>
        <div
          className="grid gap-0.5"
          style={{ gridTemplateColumns: `repeat(${TABLA_MAX_COLUMNAS}, 1.1rem)` }}
        >
          {Array.from({ length: TABLA_MAX_FILAS * TABLA_MAX_COLUMNAS }).map((_, indice) => {
            const fila = Math.floor(indice / TABLA_MAX_COLUMNAS) + 1;
            const columna = (indice % TABLA_MAX_COLUMNAS) + 1;
            const activa = fila <= hover.filas && columna <= hover.columnas;
            return (
              <button
                key={indice}
                type="button"
                aria-label={`${fila} x ${columna}`}
                className={cn(
                  "size-[1.1rem] rounded-[2px] border border-foreground/15",
                  activa ? "bg-primary" : "bg-foreground/5",
                )}
                onMouseEnter={() => setHover({ filas: fila, columnas: columna })}
                onClick={() => insertar(fila, columna)}
              />
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type EditorBarraPersistenteProps = {
  editor: Editor | null;
  overlayRef?: RefObject<HTMLElement | null>;
};

// Barra de formato siempre visible, debajo del menú superior (ver
// editor-menu-bar.tsx) — a diferencia de la burbuja flotante que reemplaza
// (aparecía solo al seleccionar texto), esta se ve todo el tiempo, como en
// Google Docs. Construida sobre las mismas piezas que ya existían
// (editor-controles-formato.tsx), no reescritas desde cero.
export function EditorBarraPersistente({ editor, overlayRef }: EditorBarraPersistenteProps) {
  const estado = useEstadoEditor(editor);

  if (!editor || !editor.isEditable || !estado) return null;

  return (
    <div className="barra-persistente print:hidden">
      <SelectorEstiloBloque editor={editor} estado={estado} overlayRef={overlayRef} />
      <SelectorFuente editor={editor} fuenteActual={estado.fuenteActual} overlayRef={overlayRef} />
      <SelectorTamano editor={editor} tamanoActual={estado.tamanoActual} overlayRef={overlayRef} />
      <Separador />
      <BotonBarra
        label="Negrita"
        activo={estado.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <TextBIcon aria-hidden />
      </BotonBarra>
      <BotonBarra
        label="Cursiva"
        activo={estado.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <TextItalicIcon aria-hidden />
      </BotonBarra>
      <BotonBarra
        label="Subrayado"
        activo={estado.subrayado}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <TextUnderlineIcon aria-hidden />
      </BotonBarra>
      <BotonBarra
        label="Tachado"
        activo={estado.tachado}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <TextStrikethroughIcon aria-hidden />
      </BotonBarra>
      <BotonBarra
        label="Subíndice"
        activo={estado.subindice}
        onClick={() => editor.chain().focus().toggleSubscript().run()}
      >
        <TextSubscriptIcon aria-hidden />
      </BotonBarra>
      <BotonBarra
        label="Superíndice"
        activo={estado.superindice}
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
      >
        <TextSuperscriptIcon aria-hidden />
      </BotonBarra>
      <Separador />
      <SelectorColor
        label="Resaltado"
        overlayRef={overlayRef}
        icon={<TextAaIcon className="rounded bg-warning/30" aria-hidden />}
        onElegir={(hex) => editor.chain().focus().toggleHighlight({ color: hex }).run()}
        onQuitar={() => editor.chain().focus().unsetHighlight().run()}
      />
      <SelectorColor
        label="Color de texto"
        overlayRef={overlayRef}
        icon={<TextAaIcon aria-hidden />}
        onElegir={(hex) => editor.chain().focus().setColor(hex).run()}
        onQuitar={() => editor.chain().focus().unsetColor().run()}
      />
      <SelectorInterlineado
        editor={editor}
        interlineadoActual={estado.interlineadoActual}
        overlayRef={overlayRef}
      />
      <Separador />
      <BotonBarra
        label="Alinear a la izquierda"
        activo={estado.alinIzquierda}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <TextAlignLeftIcon aria-hidden />
      </BotonBarra>
      <BotonBarra
        label="Centrar"
        activo={estado.alinCentro}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <TextAlignCenterIcon aria-hidden />
      </BotonBarra>
      <BotonBarra
        label="Alinear a la derecha"
        activo={estado.alinDerecha}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <TextAlignRightIcon aria-hidden />
      </BotonBarra>
      <BotonBarra
        label="Justificar"
        activo={estado.alinJustificado}
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
      >
        <TextAlignJustifyIcon aria-hidden />
      </BotonBarra>
      <Separador />
      <BotonBarra
        label="Lista con viñetas"
        activo={estado.listaVinetas}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <ListBulletsIcon aria-hidden />
      </BotonBarra>
      <BotonBarra
        label="Lista numerada"
        activo={estado.listaNumerada}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListNumbersIcon aria-hidden />
      </BotonBarra>
      <BotonBarra
        label="Lista de tareas"
        activo={estado.listaTarea}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <CheckSquareIcon aria-hidden />
      </BotonBarra>
      <BotonBarra
        label="Cita"
        activo={estado.cita}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <QuotesIcon aria-hidden />
      </BotonBarra>
      <Separador />
      <SelectorEnlace
        editor={editor}
        activo={estado.enlace}
        urlActual={estado.urlEnlace}
        overlayRef={overlayRef}
      />
      <BotonImagen editor={editor} />
      <SelectorTabla editor={editor} puedeInsertar={estado.puedeInsertarTabla} overlayRef={overlayRef} />
      <Separador />
      <BotonBarra
        label="Borrar formato"
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
      >
        <EraserIcon aria-hidden />
      </BotonBarra>
    </div>
  );
}
