"use client";

import { useState } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import {
  ListBulletsIcon,
  ListNumbersIcon,
  LinkSimpleIcon,
  ParagraphIcon,
  QuotesIcon,
  TextAaIcon,
  TextBIcon,
  TextHOneIcon,
  TextHTwoIcon,
  TextHThreeIcon,
  TextItalicIcon,
  TextStrikethroughIcon,
  TextUnderlineIcon,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { COLORES_CARPETA, type ColorCarpeta } from "@/lib/carpetas/colores";

type EditorToolbarProps = {
  editor: Editor | null;
};

// editor.isActive(...)/editor.storage no son reactivos por sí solos: Tiptap
// muta su estado interno fuera del ciclo de React, así que sin
// useEditorState (que sí se suscribe a cada transacción) los botones de
// formato y el contador de palabras se quedarían con el valor del primer
// render, sin actualizarse mientras se escribe.
function useEstadoEditor(editor: Editor | null) {
  return useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      if (!ed) return null;
      return {
        parrafo: ed.isActive("paragraph"),
        h1: ed.isActive("heading", { level: 1 }),
        h2: ed.isActive("heading", { level: 2 }),
        h3: ed.isActive("heading", { level: 3 }),
        bold: ed.isActive("bold"),
        italic: ed.isActive("italic"),
        subrayado: ed.isActive("underline"),
        tachado: ed.isActive("strike"),
        listaVinetas: ed.isActive("bulletList"),
        listaNumerada: ed.isActive("orderedList"),
        cita: ed.isActive("blockquote"),
        enlace: ed.isActive("link"),
        urlEnlace: ed.getAttributes("link").href as string | undefined,
        palabras: ed.storage.characterCount?.words() ?? 0,
        caracteres: ed.storage.characterCount?.characters() ?? 0,
      };
    },
  });
}

function Divisor() {
  return <div className="mx-0.5 h-5 w-px shrink-0 bg-border" aria-hidden />;
}

function BotonToolbar({
  activo,
  onClick,
  label,
  children,
}: {
  activo?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={activo ? "secondary" : "ghost"}
      size="icon-sm"
      aria-label={label}
      aria-pressed={activo}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function SelectorColor({
  label,
  icon,
  onElegir,
  onQuitar,
}: {
  label: string;
  icon: React.ReactNode;
  onElegir: (hex: string) => void;
  onQuitar: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button type="button" variant="ghost" size="icon-sm" aria-label={label} />
        }
      >
        {icon}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-auto min-w-0 p-2">
        <div className="grid grid-cols-4 gap-1">
          {(Object.keys(COLORES_CARPETA) as ColorCarpeta[]).map((clave) => (
            <button
              key={clave}
              type="button"
              className="size-6 rounded-full ring-1 ring-inset ring-foreground/10 transition-transform hover:scale-110"
              style={{ backgroundColor: COLORES_CARPETA[clave] }}
              aria-label={clave}
              onClick={() => {
                onElegir(COLORES_CARPETA[clave]);
                setOpen(false);
              }}
            />
          ))}
        </div>
        <button
          type="button"
          className="mt-2 w-full rounded-md px-1.5 py-1 text-left text-xs text-muted-foreground hover:bg-muted"
          onClick={() => {
            onQuitar();
            setOpen(false);
          }}
        >
          Quitar color
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SelectorEnlace({
  editor,
  activo,
  urlActual,
}: {
  editor: Editor;
  activo: boolean;
  urlActual: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  function aplicar() {
    const valor = url.trim();
    if (valor) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: valor }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    }
    setUrl("");
    setOpen(false);
  }

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(siguiente) => {
        setOpen(siguiente);
        if (siguiente) setUrl(urlActual ?? "");
      }}
    >
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant={activo ? "secondary" : "ghost"}
            size="icon-sm"
            aria-label="Enlace"
          />
        }
      >
        <LinkSimpleIcon aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-2">
        <form
          className="flex gap-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            aplicar();
          }}
        >
          <Input
            autoFocus
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://..."
            className="h-7 text-xs"
          />
          <Button type="submit" size="sm">
            {url.trim() ? "Aplicar" : "Quitar"}
          </Button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Barra de formato del editor: solo aparece cuando el documento es editable
// (nunca en modo solo lectura). Reutiliza la paleta de colores de carpeta
// (src/lib/carpetas/colores.ts) para resaltado y color de texto en vez de
// inventar una paleta nueva.
export function EditorToolbar({ editor }: EditorToolbarProps) {
  const estado = useEstadoEditor(editor);

  if (!editor || !editor.isEditable || !estado) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-4 py-1.5">
      <BotonToolbar
        label="Párrafo"
        activo={estado.parrafo}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        <ParagraphIcon aria-hidden />
      </BotonToolbar>
      <BotonToolbar
        label="Encabezado 1"
        activo={estado.h1}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <TextHOneIcon aria-hidden />
      </BotonToolbar>
      <BotonToolbar
        label="Encabezado 2"
        activo={estado.h2}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <TextHTwoIcon aria-hidden />
      </BotonToolbar>
      <BotonToolbar
        label="Encabezado 3"
        activo={estado.h3}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <TextHThreeIcon aria-hidden />
      </BotonToolbar>

      <Divisor />

      <BotonToolbar
        label="Negrita"
        activo={estado.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <TextBIcon aria-hidden />
      </BotonToolbar>
      <BotonToolbar
        label="Cursiva"
        activo={estado.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <TextItalicIcon aria-hidden />
      </BotonToolbar>
      <BotonToolbar
        label="Subrayado"
        activo={estado.subrayado}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <TextUnderlineIcon aria-hidden />
      </BotonToolbar>
      <BotonToolbar
        label="Tachado"
        activo={estado.tachado}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <TextStrikethroughIcon aria-hidden />
      </BotonToolbar>

      <Divisor />

      <SelectorColor
        label="Resaltado"
        icon={<TextAaIcon className="rounded bg-warning/30" aria-hidden />}
        onElegir={(hex) => editor.chain().focus().toggleHighlight({ color: hex }).run()}
        onQuitar={() => editor.chain().focus().unsetHighlight().run()}
      />
      <SelectorColor
        label="Color de texto"
        icon={<TextAaIcon aria-hidden />}
        onElegir={(hex) => editor.chain().focus().setColor(hex).run()}
        onQuitar={() => editor.chain().focus().unsetColor().run()}
      />

      <Divisor />

      <BotonToolbar
        label="Lista con viñetas"
        activo={estado.listaVinetas}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <ListBulletsIcon aria-hidden />
      </BotonToolbar>
      <BotonToolbar
        label="Lista numerada"
        activo={estado.listaNumerada}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListNumbersIcon aria-hidden />
      </BotonToolbar>
      <BotonToolbar
        label="Cita"
        activo={estado.cita}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <QuotesIcon aria-hidden />
      </BotonToolbar>

      <Divisor />

      <SelectorEnlace editor={editor} activo={estado.enlace} urlActual={estado.urlEnlace} />
    </div>
  );
}

// Píldora fija en la esquina de la pantalla, no dentro de la hoja del
// editor — el pedido explícito era "herramientas que no están en la hoja".
export function EditorContadorPalabras({ editor }: EditorToolbarProps) {
  const estado = useEstadoEditor(editor);
  if (!estado) return null;

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-10 rounded-full bg-popover px-3 py-1 text-xs text-muted-foreground shadow-md ring-1 ring-foreground/10">
      {estado.palabras} {estado.palabras === 1 ? "palabra" : "palabras"} ·{" "}
      {estado.caracteres} {estado.caracteres === 1 ? "carácter" : "caracteres"}
    </div>
  );
}
