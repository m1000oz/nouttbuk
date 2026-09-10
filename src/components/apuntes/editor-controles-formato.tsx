"use client";

import { type ChangeEvent, type FormEvent, type RefObject, useRef, useState } from "react";
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
            // Base UI's Menu attaches a typeahead keydown listener (via
            // floating-ui-react's useTypeahead) to the popup root to jump to
            // items as you type their label; it calls preventDefault on
            // every single-character keydown while the menu is open,
            // regardless of which descendant has focus, since it has no way
            // to know this particular child is a real text field and not a
            // menu item list. That swallowed every keystroke here before it
            // could reach this input's own value (confirmed live: DOM focus
            // stayed on the input, but `value` never changed). Stopping
            // propagation at the input itself keeps the keystroke from ever
            // reaching that listener.
            onKeyDown={(event) => event.stopPropagation()}
            placeholder="https://..."
            className="menu-flotante-input h-7 flex-1 rounded-md px-2 text-xs"
          />
          <button type="submit" className="menu-flotante-boton-primario rounded-md px-2.5 text-xs">
            {url.trim() ? "Aplicar" : "Quitar"}
          </button>
        </form>
        {/* Un clic simple sigue moviendo el cursor (para poder editar el
            texto de alrededor del enlace); sin esta pista, no había ninguna
            forma visible de enterarse de que Ctrl/Cmd+clic sí lo abre. */}
        {activo && (
          <p className="mt-1.5 px-0.5 text-[0.6875rem] opacity-60">
            Ctrl+clic (⌘+clic en Mac) para abrirlo
          </p>
        )}
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

// `valor` (antes un segundo campo sin usar en ningún lado de este
// componente, código muerto) se quita: `pila` ya es la única clave real,
// tanto para aplicar la fuente como para encontrar la opción activa.
// Lista ampliada a propósito (53 fuentes reales + Predeterminada): el
// usuario encontró mediocres las 4 opciones anteriores y pidió "libertad
// agrandada, mínimo 50 tipos de letra". Cada `pila` referencia la variable
// CSS de una fuente cargada con next/font/google en layout.tsx (self-hosted,
// nunca se descarga el archivo real hasta que algún texto la usa de verdad,
// ver el comentario ahí); las cuatro primeras (Manuscrita/Editorial/Serif/
// Monoespaciada) son las que ya existían.
const FUENTES: { etiqueta: string; pila?: string }[] = [
  { etiqueta: "Predeterminada" },
  { etiqueta: "Manuscrita", pila: "var(--font-cursiva), 'Segoe Script', cursive" },
  { etiqueta: "Editorial", pila: "var(--font-manuscrito), Georgia, serif" },
  { etiqueta: "Serif", pila: "Georgia, 'Times New Roman', serif" },
  { etiqueta: "Monoespaciada", pila: "ui-monospace, 'Courier New', monospace" },
  // Sans-serif
  { etiqueta: "Roboto", pila: "var(--font-roboto), sans-serif" },
  { etiqueta: "Open Sans", pila: "var(--font-open-sans), sans-serif" },
  { etiqueta: "Lato", pila: "var(--font-lato), sans-serif" },
  { etiqueta: "Montserrat", pila: "var(--font-montserrat), sans-serif" },
  { etiqueta: "Poppins", pila: "var(--font-poppins), sans-serif" },
  { etiqueta: "Inter", pila: "var(--font-inter), sans-serif" },
  { etiqueta: "Nunito", pila: "var(--font-nunito), sans-serif" },
  { etiqueta: "Raleway", pila: "var(--font-raleway), sans-serif" },
  { etiqueta: "Rubik", pila: "var(--font-rubik), sans-serif" },
  { etiqueta: "Work Sans", pila: "var(--font-work-sans), sans-serif" },
  { etiqueta: "Ubuntu", pila: "var(--font-ubuntu), sans-serif" },
  { etiqueta: "Mulish", pila: "var(--font-mulish), sans-serif" },
  { etiqueta: "Karla", pila: "var(--font-karla), sans-serif" },
  { etiqueta: "Manrope", pila: "var(--font-manrope), sans-serif" },
  { etiqueta: "Barlow", pila: "var(--font-barlow), sans-serif" },
  // Serif
  { etiqueta: "Merriweather", pila: "var(--font-merriweather), serif" },
  { etiqueta: "Playfair Display", pila: "var(--font-playfair-display), serif" },
  { etiqueta: "PT Serif", pila: "var(--font-pt-serif), serif" },
  { etiqueta: "Lora", pila: "var(--font-lora), serif" },
  { etiqueta: "Crimson Text", pila: "var(--font-crimson-text), serif" },
  { etiqueta: "Libre Baskerville", pila: "var(--font-libre-baskerville), serif" },
  { etiqueta: "EB Garamond", pila: "var(--font-eb-garamond), serif" },
  { etiqueta: "Cormorant Garamond", pila: "var(--font-cormorant-garamond), serif" },
  { etiqueta: "Bitter", pila: "var(--font-bitter), serif" },
  { etiqueta: "Noto Serif", pila: "var(--font-noto-serif), serif" },
  // Display / decorativa
  { etiqueta: "Oswald", pila: "var(--font-oswald), sans-serif" },
  { etiqueta: "Bebas Neue", pila: "var(--font-bebas-neue), sans-serif" },
  { etiqueta: "Anton", pila: "var(--font-anton), sans-serif" },
  { etiqueta: "Archivo Black", pila: "var(--font-archivo-black), sans-serif" },
  { etiqueta: "Righteous", pila: "var(--font-righteous), sans-serif" },
  { etiqueta: "Fjalla One", pila: "var(--font-fjalla-one), sans-serif" },
  { etiqueta: "Bangers", pila: "var(--font-bangers), sans-serif" },
  { etiqueta: "Lobster", pila: "var(--font-lobster), sans-serif" },
  { etiqueta: "Abril Fatface", pila: "var(--font-abril-fatface), serif" },
  { etiqueta: "Passion One", pila: "var(--font-passion-one), sans-serif" },
  // Manuscrita / script
  { etiqueta: "Dancing Script", pila: "var(--font-dancing-script), cursive" },
  { etiqueta: "Pacifico", pila: "var(--font-pacifico), cursive" },
  { etiqueta: "Great Vibes", pila: "var(--font-great-vibes), cursive" },
  { etiqueta: "Sacramento", pila: "var(--font-sacramento), cursive" },
  { etiqueta: "Satisfy", pila: "var(--font-satisfy), cursive" },
  { etiqueta: "Indie Flower", pila: "var(--font-indie-flower), cursive" },
  { etiqueta: "Shadows Into Light", pila: "var(--font-shadows-into-light), cursive" },
  { etiqueta: "Permanent Marker", pila: "var(--font-permanent-marker), cursive" },
  { etiqueta: "Kalam", pila: "var(--font-kalam), cursive" },
  // Monoespaciada
  { etiqueta: "Roboto Mono", pila: "var(--font-roboto-mono), monospace" },
  { etiqueta: "Space Mono", pila: "var(--font-space-mono), monospace" },
  { etiqueta: "JetBrains Mono", pila: "var(--font-jetbrains-mono), monospace" },
  { etiqueta: "IBM Plex Mono", pila: "var(--font-ibm-plex-mono), monospace" },
  { etiqueta: "Courier Prime", pila: "var(--font-courier-prime), monospace" },
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
        // max-h calibrado a ~20 filas visibles de 32px cada una: el resto de
        // las 54 opciones se alcanza haciendo scroll dentro del propio menú,
        // pedido explícito ("que la barra de selección muestre 20 y de ahí
        // scrolleas") en vez de una lista larga sin límite. `w-56` (más ancho
        // que antes) para que nombres largos como "Shadows Into Light" no
        // fuercen dos líneas en la mayoría de los casos.
        className="w-56 max-h-[640px] overflow-y-auto p-1"
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
const TAMANO_PERSONALIZADO_MINIMO = 6;
const TAMANO_PERSONALIZADO_MAXIMO = 200;

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
  // Solo el borrador del campo de tamaño a mano, ver aplicarPersonalizado:
  // se limpia al cerrar el menú, no persiste como el resto de los props que
  // sí vienen del propio documento (tamanoActual).
  const [personalizado, setPersonalizado] = useState("");

  function aplicar(tamano: string | null) {
    if (tamano) {
      editor.chain().focus().setFontSize(tamano).run();
    } else {
      editor.chain().focus().unsetFontSize().run();
    }
    setOpen(false);
  }

  // Los presets de abajo cubren los tamaños típicos, pero "personalización"
  // es justamente lo que un apunte académico necesita más: un subtítulo a
  // 20px, una tabla apretada a 13px, nada de eso calza en la lista fija.
  function aplicarPersonalizado(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numero = Number(personalizado);
    if (!Number.isFinite(numero) || numero <= 0) return;
    const acotado = Math.min(
      TAMANO_PERSONALIZADO_MAXIMO,
      Math.max(TAMANO_PERSONALIZADO_MINIMO, Math.round(numero)),
    );
    aplicar(`${acotado}px`);
    setPersonalizado("");
  }

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(siguiente) => {
        setOpen(siguiente);
        if (!siguiente) setPersonalizado("");
      }}
    >
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
        className="w-32 p-1"
      >
        <form className="mb-1 px-0.5" onSubmit={aplicarPersonalizado}>
          <input
            autoFocus
            type="number"
            min={TAMANO_PERSONALIZADO_MINIMO}
            max={TAMANO_PERSONALIZADO_MAXIMO}
            inputMode="numeric"
            value={personalizado}
            onChange={(event) => setPersonalizado(event.target.value)}
            // Ver el comentario igual de largo en el input de URL de
            // SelectorEnlace más arriba: sin esto, el typeahead de Base UI
            // Menu (useTypeahead, se activa con cualquier keydown de un solo
            // carácter mientras el menú está abierto) se comía cada dígito
            // antes de que llegara al valor del input — confirmado en vivo,
            // reportado también por el usuario ("no puedo escribir con el
            // teclado el num de px").
            onKeyDown={(event) => event.stopPropagation()}
            placeholder="Tamaño en px"
            aria-label="Tamaño de fuente personalizado en píxeles"
            className="menu-flotante-input h-7 w-full rounded-md px-2 text-xs"
          />
        </form>
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
