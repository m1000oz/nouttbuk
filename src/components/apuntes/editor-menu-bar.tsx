"use client";

import { type RefObject, useState } from "react";
import { useRouter } from "next/navigation";
import type { Editor } from "@tiptap/react";

import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from "@/components/ui/menubar";
import { useEstadoEditor } from "@/components/apuntes/editor-controles-formato";
import { crearItemsComando } from "@/components/apuntes/menu-comandos";
import { toast } from "@/components/ui/toast";
import type { TemaEditor } from "@/lib/tiptap/tema-editor";
import { repararParrafosDelDocumento } from "@/lib/tiptap/pegar-lineas-como-parrafos";
import { convertirDocumentoAMarkdown } from "@/lib/tiptap/exportar-markdown";

const ZOOM_OPCIONES = [50, 75, 100, 125, 150];
const INTERLINEADO_OPCIONES: { valor: string; etiqueta: string }[] = [
  { valor: "1", etiqueta: "Sencillo" },
  { valor: "1.15", etiqueta: "1.15" },
  { valor: "1.5", etiqueta: "1.5" },
  { valor: "2", etiqueta: "Doble" },
];

// Clipboard API moderna en vez de document.execCommand("cut"/"copy"),
// deprecado: writeText no exige un permiso especial en un contexto seguro
// para una acción iniciada por el usuario (un clic de menú cuenta). Pegar sí
// exige permiso de lectura del portapapeles (readText), por eso muestra un
// aviso si el usuario lo rechaza en vez de fallar en silencio.
function copiarSeleccion(editor: Editor) {
  const { from, to, empty } = editor.state.selection;
  if (empty) return;
  const texto = editor.state.doc.textBetween(from, to, "\n");
  navigator.clipboard?.writeText(texto).catch(() => {});
}

function cortarSeleccion(editor: Editor) {
  const { from, to, empty } = editor.state.selection;
  if (empty) return;
  const texto = editor.state.doc.textBetween(from, to, "\n");
  navigator.clipboard?.writeText(texto).catch(() => {});
  editor.chain().focus().deleteSelection().run();
}

async function pegarDesdePortapapeles(editor: Editor) {
  try {
    const texto = await navigator.clipboard.readText();
    editor.chain().focus().insertContent(texto).run();
  } catch {
    toast.add({ title: "No se pudo pegar. Usa Ctrl+V.", type: "error" });
  }
}

// Único helper de descarga para los cuatro formatos de "Archivo > Descargar"
// (antes solo existía para .txt): arma el Blob y dispara la descarga vía un
// <a download> temporal, el mismo patrón para cualquier tipo MIME/extensión.
function descargarArchivo(contenido: string, nombreArchivo: string, extension: string, tipoMime: string) {
  const blob = new Blob([contenido], { type: `${tipoMime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `${nombreArchivo.trim() || "apunte"}.${extension}`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

// Documento HTML mínimo pero autocontenido (sin depender de las clases
// .tiptap-content de la app, que no viajan con el archivo): reproduce solo
// lo que Markdown no puede (negrita/cursiva/tablas se ven, alineación de
// texto y resaltado de color también, ya que HTML sí los soporta de forma
// nativa vía el propio `style` que ya generan las extensiones del editor).
function descargarHtml(editor: Editor, nombreArchivo: string) {
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${nombreArchivo.trim() || "Apunte"}</title>
<style>
body { font-family: system-ui, sans-serif; line-height: 1.6; max-width: 794px; margin: 2rem auto; padding: 0 1rem; }
img { max-width: 100%; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #ccc; padding: 0.4em 0.6em; }
blockquote { border-inline-start: 3px solid #ccc; padding-inline-start: 1em; color: #555; margin-inline-start: 0; }
</style>
</head>
<body>
${editor.getHTML()}
</body>
</html>
`;
  descargarArchivo(html, nombreArchivo, "html", "text/html");
}

function descargarMarkdown(editor: Editor, nombreArchivo: string) {
  const markdown = convertirDocumentoAMarkdown(editor.getJSON());
  descargarArchivo(markdown, nombreArchivo, "md", "text/markdown");
}

function descargarTexto(editor: Editor, nombreArchivo: string) {
  descargarArchivo(editor.getText(), nombreArchivo, "txt", "text/plain");
}

type EditorMenuBarProps = {
  editor: Editor | null;
  overlayRef?: RefObject<HTMLElement | null>;
  soloLectura: boolean;
  titulo: string;
  tituloInputRef: RefObject<HTMLInputElement | null>;
  onGuardar: () => void;
  esquemaVisible: boolean;
  onEsquemaVisibleChange: (visible: boolean) => void;
  guiaVisible: boolean;
  onGuiaVisibleChange: (visible: boolean) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onAbrirConfigurarPagina: () => void;
  onAbrirBuscarReemplazar: () => void;
  onAbrirContarPalabras: () => void;
  tema: TemaEditor;
  onTemaChange: (tema: TemaEditor) => void;
  // Diferencias puntuales para reutilizar este mismo menú en CvEditor
  // (src/components/cv/cv-editor.tsx): un CV es un documento único por
  // persona, sin lista a la que volver ni "Nuevo apunte", se descarga solo
  // como PDF (no tiene sentido consumirlo como .md/.html), y "Reparar
  // formato" es específico de recuperar apuntes corrompidos por edición
  // colaborativa, algo que un CV nunca tiene. Parametrizar estas 4
  // diferencias evita duplicar las ~450 líneas de este componente en un
  // segundo archivo casi idéntico.
  mostrarNuevoApunte?: boolean;
  mostrarRenombrar?: boolean;
  formatosDescarga?: Array<"pdf" | "html" | "md" | "txt">;
  mostrarRepararFormato?: boolean;
  rutaCerrar?: string;
};

// Menú superior tipo Docs (Archivo/Edición/Ver/Insertar/Formato/Herramientas),
// restyled sobre los tokens del atelier (ver Decisión 4 en el plan: el
// Menubar y su MenubarContent no necesitan overrides propios porque viven
// dentro de .apunte-editor-overlay, sea directamente o vía el prop
// `container` que ancla el portal ahí). Es un despachador delgado: cada
// ítem llama a un comando que ya existe (reutilizando crearItemsComando()
// para Insertar, en vez de reimplementar inserciones) o a un callback que
// ApunteEditor ya posee.
export function EditorMenuBar({
  editor,
  overlayRef,
  soloLectura,
  titulo,
  tituloInputRef,
  onGuardar,
  esquemaVisible,
  onEsquemaVisibleChange,
  guiaVisible,
  onGuiaVisibleChange,
  zoom,
  onZoomChange,
  onAbrirConfigurarPagina,
  onAbrirBuscarReemplazar,
  onAbrirContarPalabras,
  tema,
  onTemaChange,
  mostrarNuevoApunte = true,
  mostrarRenombrar = true,
  formatosDescarga = ["pdf", "html", "md", "txt"],
  mostrarRepararFormato = true,
  rutaCerrar = "/apuntes",
}: EditorMenuBarProps) {
  const router = useRouter();
  const estado = useEstadoEditor(editor);
  const [spellcheckActivo, setSpellcheckActivo] = useState(true);
  // Ajuste de estado durante el render (no un efecto): así no hay un primer
  // render con el valor por defecto seguido de un re-render inmediato cada
  // vez que cambia la instancia de editor (estático -> colaborativo).
  const [ultimoEditor, setUltimoEditor] = useState(editor);
  if (editor !== ultimoEditor) {
    setUltimoEditor(editor);
    if (editor) setSpellcheckActivo(editor.view.dom.getAttribute("spellcheck") !== "false");
  }

  if (!editor || !estado || soloLectura) return null;

  const itemsComando = crearItemsComando();
  function ejecutarComando(tituloItem: string) {
    const item = itemsComando.find((i) => i.titulo === tituloItem);
    if (item && editor) item.ejecutar(editor);
  }

  function alternarOrtografia() {
    const nuevo = !spellcheckActivo;
    editor!.view.dom.setAttribute("spellcheck", String(nuevo));
    setSpellcheckActivo(nuevo);
  }

  function insertarEnlace() {
    const url = window.prompt("URL del enlace", "https://");
    if (!url) return;
    editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function repararFormato() {
    const reparado = repararParrafosDelDocumento(editor!);
    toast.add({
      title: reparado
        ? "Formato reparado. Guarda el apunte para conservar el cambio."
        : "No se encontró nada que reparar en este apunte.",
      type: reparado ? "success" : "info",
    });
  }

  return (
    <Menubar
      // text-foreground explícito (no alcanza con heredarlo): body ya fijó
      // `color` en el scope global (tema claro), y esa herencia no se
      // reevalúa solo porque .apunte-editor-overlay redefina --foreground
      // más abajo. Solo un elemento con su propia declaración de color
      // dispara una reevaluación de var(--foreground) en este scope.
      className="menu-superior-atelier print:hidden overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden h-auto rounded-none border-0 bg-transparent text-foreground"
    >
      <MenubarMenu>
        <MenubarTrigger>Archivo</MenubarTrigger>
        <MenubarContent container={overlayRef}>
          {mostrarNuevoApunte && (
            <MenubarItem onClick={() => router.push("/apuntes/nuevo")}>
              Nuevo apunte
            </MenubarItem>
          )}
          <MenubarItem onClick={onGuardar}>
            Guardar
            <MenubarShortcut>Ctrl+S</MenubarShortcut>
          </MenubarItem>
          {mostrarRenombrar && (
            <MenubarItem
              onClick={() => {
                // Diferido: al cerrarse, el menú de Base UI le devuelve el
                // foco a su propio trigger recién cuando termina su
                // animación de cierre (duration-100 en dropdown-menu.tsx),
                // después de que este onClick ya corrió — un focus()
                // síncrono, o incluso en el siguiente tick, se pisa un
                // instante más tarde. 150ms le gana con margen a esa
                // restauración.
                setTimeout(() => {
                  tituloInputRef.current?.focus();
                  tituloInputRef.current?.select();
                }, 150);
              }}
            >
              Renombrar
            </MenubarItem>
          )}
          <MenubarItem onClick={onAbrirConfigurarPagina}>Configurar página</MenubarItem>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>Descargar</MenubarSubTrigger>
            <MenubarSubContent container={overlayRef}>
              {formatosDescarga.includes("pdf") && (
                <MenubarItem onClick={() => window.print()}>
                  Documento (PDF)
                </MenubarItem>
              )}
              {formatosDescarga.includes("html") && (
                <MenubarItem onClick={() => descargarHtml(editor, titulo)}>
                  Página web (.html)
                </MenubarItem>
              )}
              {formatosDescarga.includes("md") && (
                <MenubarItem onClick={() => descargarMarkdown(editor, titulo)}>
                  Markdown (.md)
                </MenubarItem>
              )}
              {formatosDescarga.includes("txt") && (
                <MenubarItem onClick={() => descargarTexto(editor, titulo)}>
                  Texto plano (.txt)
                </MenubarItem>
              )}
            </MenubarSubContent>
          </MenubarSub>
          <MenubarItem onClick={() => window.print()}>
            Imprimir
            <MenubarShortcut>Ctrl+P</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => router.push(rutaCerrar)}>Cerrar</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Edición</MenubarTrigger>
        <MenubarContent container={overlayRef}>
          <MenubarItem
            disabled={!estado.puedeDeshacer}
            onClick={() => editor.chain().focus().undo().run()}
          >
            Deshacer
            <MenubarShortcut>Ctrl+Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem
            disabled={!estado.puedeRehacer}
            onClick={() => editor.chain().focus().redo().run()}
          >
            Rehacer
            <MenubarShortcut>Ctrl+Y</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => cortarSeleccion(editor)}>
            Cortar
            <MenubarShortcut>Ctrl+X</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => copiarSeleccion(editor)}>
            Copiar
            <MenubarShortcut>Ctrl+C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => pegarDesdePortapapeles(editor)}>
            Pegar
            <MenubarShortcut>Ctrl+V</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => editor.commands.selectAll()}>
            Seleccionar todo
            <MenubarShortcut>Ctrl+A</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={onAbrirBuscarReemplazar}>
            Buscar y reemplazar
            <MenubarShortcut>Ctrl+F</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Ver</MenubarTrigger>
        <MenubarContent container={overlayRef}>
          <MenubarCheckboxItem
            checked={esquemaVisible}
            onCheckedChange={(checked) => onEsquemaVisibleChange(checked === true)}
          >
            Mostrar esquema
          </MenubarCheckboxItem>
          <MenubarCheckboxItem
            checked={guiaVisible}
            onCheckedChange={(checked) => onGuiaVisibleChange(checked === true)}
          >
            Mostrar guía rápida
          </MenubarCheckboxItem>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>Zoom</MenubarSubTrigger>
            <MenubarSubContent container={overlayRef}>
              <MenubarRadioGroup
                value={String(Math.round(zoom * 100))}
                onValueChange={(valor) => onZoomChange(Number(valor) / 100)}
              >
                {ZOOM_OPCIONES.map((porcentaje) => (
                  <MenubarRadioItem key={porcentaje} value={String(porcentaje)}>
                    {porcentaje}%
                  </MenubarRadioItem>
                ))}
              </MenubarRadioGroup>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarItem onClick={() => overlayRef?.current?.requestFullscreen?.()}>
            Pantalla completa
          </MenubarItem>
          <MenubarSub>
            <MenubarSubTrigger>Tema</MenubarSubTrigger>
            <MenubarSubContent container={overlayRef}>
              <MenubarRadioGroup
                value={tema}
                onValueChange={(valor) => onTemaChange(valor as TemaEditor)}
              >
                <MenubarRadioItem value="oscuro">Oscuro</MenubarRadioItem>
                <MenubarRadioItem value="claro">Claro</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarSubContent>
          </MenubarSub>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Insertar</MenubarTrigger>
        <MenubarContent container={overlayRef}>
          <MenubarItem onClick={() => ejecutarComando("Imagen")}>Imagen</MenubarItem>
          <MenubarItem
            disabled={!estado.puedeInsertarTabla}
            onClick={() => ejecutarComando("Tabla")}
          >
            Tabla
          </MenubarItem>
          <MenubarItem onClick={insertarEnlace}>Enlace</MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={() => ejecutarComando("Cita")}>Cita</MenubarItem>
          <MenubarItem onClick={() => ejecutarComando("Lista con viñetas")}>
            Lista con viñetas
          </MenubarItem>
          <MenubarItem onClick={() => ejecutarComando("Lista numerada")}>
            Lista numerada
          </MenubarItem>
          <MenubarItem onClick={() => ejecutarComando("Tarea")}>Tarea</MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={onAbrirConfigurarPagina}>
            Encabezado y pie de página
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Formato</MenubarTrigger>
        <MenubarContent container={overlayRef}>
          <MenubarSub>
            <MenubarSubTrigger>Estilo de párrafo</MenubarSubTrigger>
            <MenubarSubContent container={overlayRef}>
              <MenubarItem onClick={() => ejecutarComando("Párrafo")}>Párrafo</MenubarItem>
              <MenubarItem onClick={() => ejecutarComando("Encabezado 1")}>
                Encabezado 1
              </MenubarItem>
              <MenubarItem onClick={() => ejecutarComando("Encabezado 2")}>
                Encabezado 2
              </MenubarItem>
              <MenubarItem onClick={() => ejecutarComando("Encabezado 3")}>
                Encabezado 3
              </MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarItem onClick={() => editor.chain().focus().toggleBold().run()}>
            Negrita
            <MenubarShortcut>Ctrl+B</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => editor.chain().focus().toggleItalic().run()}>
            Cursiva
            <MenubarShortcut>Ctrl+I</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => editor.chain().focus().toggleUnderline().run()}>
            Subrayado
            <MenubarShortcut>Ctrl+U</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={() => editor.chain().focus().toggleStrike().run()}>
            Tachado
          </MenubarItem>
          <MenubarItem onClick={() => editor.chain().focus().toggleSubscript().run()}>
            Subíndice
          </MenubarItem>
          <MenubarItem onClick={() => editor.chain().focus().toggleSuperscript().run()}>
            Superíndice
          </MenubarItem>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>Interlineado</MenubarSubTrigger>
            <MenubarSubContent container={overlayRef}>
              {INTERLINEADO_OPCIONES.map((opcion) => (
                <MenubarItem
                  key={opcion.valor}
                  onClick={() => editor.chain().focus().setLineHeight(opcion.valor).run()}
                >
                  {opcion.etiqueta}
                </MenubarItem>
              ))}
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSub>
            <MenubarSubTrigger>Alinear</MenubarSubTrigger>
            <MenubarSubContent container={overlayRef}>
              <MenubarItem onClick={() => editor.chain().focus().setTextAlign("left").run()}>
                Izquierda
              </MenubarItem>
              <MenubarItem onClick={() => editor.chain().focus().setTextAlign("center").run()}>
                Centrar
              </MenubarItem>
              <MenubarItem onClick={() => editor.chain().focus().setTextAlign("right").run()}>
                Derecha
              </MenubarItem>
              <MenubarItem onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
                Justificar
              </MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          >
            Borrar formato
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Herramientas</MenubarTrigger>
        <MenubarContent container={overlayRef}>
          <MenubarItem onClick={onAbrirContarPalabras}>Contar palabras</MenubarItem>
          <MenubarItem onClick={onAbrirBuscarReemplazar}>
            Buscar y reemplazar
            <MenubarShortcut>Ctrl+F</MenubarShortcut>
          </MenubarItem>
          <MenubarCheckboxItem checked={spellcheckActivo} onCheckedChange={alternarOrtografia}>
            Ortografía
          </MenubarCheckboxItem>
          {mostrarRepararFormato && (
            <>
              <MenubarSeparator />
              <MenubarItem onClick={repararFormato}>Reparar formato</MenubarItem>
            </>
          )}
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
