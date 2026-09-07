"use client";

import { type ChangeEvent, type RefObject, useRef, useState } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import {
  CaretDownIcon,
  ImageIcon,
  LinkSimpleIcon,
  TextAaIcon,
} from "@phosphor-icons/react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSubirImagenApunte } from "@/lib/tiptap/usar-subir-imagen-apunte";
import { COLORES_CARPETA, type ColorCarpeta } from "@/lib/carpetas/colores";
import { cn } from "@/lib/utils";

// Piezas de formato compartidas entre la barra de herramientas persistente
// (editor-barra-persistente.tsx) y el menú superior (editor-menu-bar.tsx).
// Vivían en editor-toolbar.tsx cuando el único consumidor era el BubbleMenu
// (la burbuja flotante al seleccionar texto, eliminada al copiar la
// profundidad funcional de Docs): se extrajeron acá tal cual, sin
// reescribirlas, porque ya resuelven bien un problema real (el robo de foco
// al hacer clic en un control mientras hay texto seleccionado).

export const ESTILOS_BLOQUE: Record<string, string> = {
  parrafo: "Párrafo",
  h1: "Encabezado 1",
  h2: "Encabezado 2",
  h3: "Encabezado 3",
};

// editor.isActive(...)/editor.storage no son reactivos por sí solos: Tiptap
// muta su estado interno fuera del ciclo de React, así que sin
// useEditorState (que sí se suscribe a cada transacción) los botones de
// formato y el contador de palabras se quedarían con el valor del primer
// render, sin actualizarse mientras se escribe.
export function useEstadoEditor(editor: Editor | null) {
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
        subindice: ed.isActive("subscript"),
        superindice: ed.isActive("superscript"),
        listaVinetas: ed.isActive("bulletList"),
        listaNumerada: ed.isActive("orderedList"),
        listaTarea: ed.isActive("taskList"),
        cita: ed.isActive("blockquote"),
        enlace: ed.isActive("link"),
        urlEnlace: ed.getAttributes("link").href as string | undefined,
        alinIzquierda: ed.isActive({ textAlign: "left" }),
        alinCentro: ed.isActive({ textAlign: "center" }),
        alinDerecha: ed.isActive({ textAlign: "right" }),
        alinJustificado: ed.isActive({ textAlign: "justify" }),
        fuenteActual: ed.getAttributes("textStyle").fontFamily as string | undefined,
        tamanoActual: ed.getAttributes("textStyle").fontSize as string | undefined,
        interlineadoActual: ed.getAttributes("paragraph").lineHeight as
          | string
          | undefined,
        puedeInsertarTabla: ed.can().insertTable(),
        puedeDeshacer: ed.can().undo(),
        puedeRehacer: ed.can().redo(),
        palabras: ed.storage.characterCount?.words() ?? 0,
        caracteres: ed.storage.characterCount?.characters() ?? 0,
      };
    },
  });
}

export function BotonBarra({
  activo,
  disabled,
  onClick,
  label,
  children,
}: {
  activo?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={activo}
      disabled={disabled}
      // Sin esto, el mousedown nativo del botón le roba el foco al
      // ProseMirror contenteditable antes de que onClick corra su comando:
      // se ve un blur momentáneo, y cualquier comando que reflowee el texto
      // (alineación, estilo de bloque) hace que el resto de la interfaz
      // salte de posición al reenfocar. Prevenir el default del mousedown
      // evita que el foco se mueva en absoluto.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn("barra-flotante-boton", activo && "is-activo")}
    >
      {children}
    </button>
  );
}

export function Separador() {
  return <span className="barra-flotante-separador" aria-hidden />;
}

export function SelectorColor({
  label,
  icon,
  overlayRef,
  onElegir,
  onQuitar,
}: {
  label: string;
  icon: React.ReactNode;
  overlayRef?: RefObject<HTMLElement | null>;
  onElegir: (hex: string) => void;
  onQuitar: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className="barra-flotante-boton"
        aria-label={label}
        onMouseDown={(event) => event.preventDefault()}
      >
        {icon}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        container={overlayRef}
        className="w-auto min-w-0 p-2"
      >
        <div className="grid grid-cols-4 gap-1">
          {(Object.keys(COLORES_CARPETA) as ColorCarpeta[]).map((clave) => (
            <button
              key={clave}
              type="button"
              className="size-6 rounded-full ring-1 ring-inset ring-white/15 transition-transform hover:scale-110"
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
          className="mt-2 w-full rounded-md px-1.5 py-1 text-left text-xs opacity-70 hover:opacity-100"
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

export function SelectorEnlace({
  editor,
  activo,
  urlActual,
  overlayRef,
}: {
  editor: Editor;
  activo: boolean;
  urlActual: string | undefined;
  overlayRef?: RefObject<HTMLElement | null>;
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
        className={cn("barra-flotante-boton", activo && "is-activo")}
        aria-label="Enlace"
        onMouseDown={(event) => event.preventDefault()}
      >
        <LinkSimpleIcon aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        container={overlayRef}
        className="w-64 p-2"
      >
        <form
          className="flex gap-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            aplicar();
          }}
        >
          <input
            autoFocus
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://..."
            className="menu-flotante-input h-7 flex-1 rounded-md px-2 text-xs"
          />
          <button type="submit" className="menu-flotante-boton-primario rounded-md px-2.5 text-xs">
            {url.trim() ? "Aplicar" : "Quitar"}
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Botón para insertar imagen: la subida a Supabase Storage vive en
// useSubirImagenApunte (src/lib/tiptap/usar-subir-imagen-apunte.ts),
// compartida con el comando "/Imagen" (menu-comandos.tsx).
export function BotonImagen({ editor }: { editor: Editor }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { subiendo, error, subirArchivo } = useSubirImagenApunte(editor);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0];
    event.target.value = "";
    if (!archivo) return;
    await subirArchivo(archivo);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Insertar imagen"
        aria-busy={subiendo}
        onClick={() => inputRef.current?.click()}
        className="barra-flotante-boton"
      >
        <ImageIcon aria-hidden />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      {error && (
        <span className="sr-only" role="alert">
          No se pudo insertar la imagen.
        </span>
      )}
    </>
  );
}

// Colapsa los cuatro estilos de bloque (Párrafo/H1/H2/H3) en un solo control
// con etiqueta de texto, restyled a la paleta oscura del editor (no el
// <Select> claro de shadcn, que rompería el mundo visual del atelier).
export function SelectorEstiloBloque({
  editor,
  estado,
  overlayRef,
}: {
  editor: Editor;
  estado: { parrafo: boolean; h1: boolean; h2: boolean; h3: boolean };
  overlayRef?: RefObject<HTMLElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const claveActual = estado.h1 ? "h1" : estado.h2 ? "h2" : estado.h3 ? "h3" : "parrafo";

  function aplicar(valor: string) {
    if (valor === "parrafo") {
      editor.chain().focus().setParagraph().run();
    } else {
      const nivel = valor === "h1" ? 1 : valor === "h2" ? 2 : 3;
      editor.chain().focus().toggleHeading({ level: nivel as 1 | 2 | 3 }).run();
    }
    setOpen(false);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className="barra-flotante-boton barra-flotante-boton-ancho gap-1.5 px-2.5"
        onMouseDown={(event) => event.preventDefault()}
      >
        <span className="text-xs">{ESTILOS_BLOQUE[claveActual]}</span>
        <CaretDownIcon className="size-3" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        container={overlayRef}
        className="w-40 p-1"
      >
        {Object.entries(ESTILOS_BLOQUE).map(([valor, label]) => (
          <button
            key={valor}
            type="button"
            className={cn(
              "w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
              claveActual === valor && "bg-accent",
            )}
            onClick={() => aplicar(valor)}
          >
            {label}
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const FUENTES: { valor: string | null; etiqueta: string; pila?: string }[] = [
  { valor: null, etiqueta: "Predeterminada" },
  { valor: "serif", etiqueta: "Serif", pila: "Georgia, 'Times New Roman', serif" },
  {
    valor: "monospace",
    etiqueta: "Monoespaciada",
    pila: "ui-monospace, 'Courier New', monospace",
  },
];

// Activa FontFamily (@tiptap/extension-font-family), instalada en el
// esquema desde antes de esta ronda pero sin ningún control que la usara.
export function SelectorFuente({
  editor,
  fuenteActual,
  overlayRef,
}: {
  editor: Editor;
  fuenteActual: string | undefined;
  overlayRef?: RefObject<HTMLElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const actual = FUENTES.find((f) => f.pila === fuenteActual) ?? FUENTES[0];

  function aplicar(fuente: (typeof FUENTES)[number]) {
    if (fuente.pila) {
      editor.chain().focus().setFontFamily(fuente.pila).run();
    } else {
      editor.chain().focus().unsetFontFamily().run();
    }
    setOpen(false);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className="barra-flotante-boton barra-flotante-boton-ancho gap-1.5 px-2.5"
        onMouseDown={(event) => event.preventDefault()}
        aria-label="Fuente"
      >
        <span className="text-xs">{actual.etiqueta}</span>
        <CaretDownIcon className="size-3" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        container={overlayRef}
        className="w-44 p-1"
      >
        {FUENTES.map((fuente) => (
          <button
            key={fuente.etiqueta}
            type="button"
            style={fuente.pila ? { fontFamily: fuente.pila } : undefined}
            className={cn(
              "w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
              actual.etiqueta === fuente.etiqueta && "bg-accent",
            )}
            onClick={() => aplicar(fuente)}
          >
            {fuente.etiqueta}
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const TAMANOS = ["12px", "14px", "16px", "18px", "24px", "32px"];

// Activa FontSize (src/lib/tiptap/font-size-extension.ts), también instalada
// desde antes de esta ronda pero sin ningún control que la usara.
export function SelectorTamano({
  editor,
  tamanoActual,
  overlayRef,
}: {
  editor: Editor;
  tamanoActual: string | undefined;
  overlayRef?: RefObject<HTMLElement | null>;
}) {
  const [open, setOpen] = useState(false);

  function aplicar(tamano: string | null) {
    if (tamano) {
      editor.chain().focus().setFontSize(tamano).run();
    } else {
      editor.chain().focus().unsetFontSize().run();
    }
    setOpen(false);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className="barra-flotante-boton barra-flotante-boton-ancho gap-1.5 px-2"
        onMouseDown={(event) => event.preventDefault()}
        aria-label="Tamaño de fuente"
      >
        <span className="text-xs">{tamanoActual ?? "16px"}</span>
        <CaretDownIcon className="size-3" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        container={overlayRef}
        className="w-28 p-1"
      >
        <button
          type="button"
          className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
          onClick={() => aplicar(null)}
        >
          Predeterminado
        </button>
        {TAMANOS.map((tamano) => (
          <button
            key={tamano}
            type="button"
            className={cn(
              "w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
              tamanoActual === tamano && "bg-accent",
            )}
            onClick={() => aplicar(tamano)}
          >
            {tamano}
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const INTERLINEADOS: { valor: string | null; etiqueta: string }[] = [
  { valor: null, etiqueta: "Predeterminado" },
  { valor: "1", etiqueta: "Sencillo" },
  { valor: "1.15", etiqueta: "1.15" },
  { valor: "1.5", etiqueta: "1.5" },
  { valor: "2", etiqueta: "Doble" },
];

export function SelectorInterlineado({
  editor,
  interlineadoActual,
  overlayRef,
}: {
  editor: Editor;
  interlineadoActual: string | undefined;
  overlayRef?: RefObject<HTMLElement | null>;
}) {
  const [open, setOpen] = useState(false);

  function aplicar(valor: string | null) {
    if (valor) {
      editor.chain().focus().setLineHeight(valor).run();
    } else {
      editor.chain().focus().unsetLineHeight().run();
    }
    setOpen(false);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className="barra-flotante-boton"
        aria-label="Interlineado"
        onMouseDown={(event) => event.preventDefault()}
      >
        <TextAaIcon aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        container={overlayRef}
        className="w-36 p-1"
      >
        {INTERLINEADOS.map((item) => (
          <button
            key={item.etiqueta}
            type="button"
            className={cn(
              "w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
              (interlineadoActual ?? null) === item.valor && "bg-accent",
            )}
            onClick={() => aplicar(item.valor)}
          >
            {item.etiqueta}
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
