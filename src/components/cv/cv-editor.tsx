"use client";

import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Editor } from "@tiptap/react";
import {
  LightbulbIcon,
  MinusIcon,
  PlusIcon,
  PrinterIcon,
  SidebarSimpleIcon,
  XIcon,
} from "@phosphor-icons/react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { EditorEstatico } from "@/components/apuntes/editor-estatico";
import { HojasEditor } from "@/components/apuntes/hojas-editor";
import { EditorEsquema } from "@/components/apuntes/editor-esquema";
import { EditorGuia } from "@/components/apuntes/editor-guia";
import { AmbienteAtelier } from "@/components/apuntes/ambiente-atelier";
import { EditorContadorPalabras } from "@/components/apuntes/editor-toolbar";
import { EditorMenuBar } from "@/components/apuntes/editor-menu-bar";
import { EditorBarraPersistente } from "@/components/apuntes/editor-barra-persistente";
import { DialogoBuscarReemplazar } from "@/components/apuntes/dialogo-buscar-reemplazar";
import { DialogoContarPalabras } from "@/components/apuntes/dialogo-contar-palabras";
import { DialogoConfigurarPagina } from "@/components/apuntes/dialogo-configurar-pagina";
import { EVENTO_INSERTAR_IMAGEN } from "@/components/apuntes/menu-comandos";
import { useSubirImagenApunte } from "@/lib/tiptap/usar-subir-imagen-apunte";
import {
  actualizarEncabezadoPie,
  actualizarGeometria,
  ENCABEZADO_PIE_POR_DEFECTO,
  GEOMETRIA_POR_DEFECTO,
  type ConfiguracionEncabezadoPie,
  type GeometriaPagina,
} from "@/lib/tiptap/configuracion-pagina";
import {
  actualizarTemaEditor,
  TEMA_EDITOR_POR_DEFECTO,
  type TemaEditor,
} from "@/lib/tiptap/tema-editor";
import type { Json } from "@/lib/types/database.types";

const ZOOM_MIN = 0.6;
const ZOOM_MAX = 1.5;
const ZOOM_PASO = 0.1;

type CvEditorProps = {
  contenido: Json;
};

// Hermano más liviano de ApunteEditor (src/components/apuntes/apunte-editor.tsx),
// no un envoltorio suyo: reutiliza las mismas piezas de edición (esquema,
// paginación, menú, barra de formato, diálogos, ambiente atelier) pero sin
// nada de lo que un CV no tiene, carpeta/curso/visibilidad/etiquetas,
// compartir/colaboradores, ni el modo colaborativo (un CV es de una sola
// persona). Reutiliza literalmente la clase `.apunte-editor-overlay` (no
// una propia): el tema atelier completo (decenas de custom properties y
// reglas oscuro/claro en globals.css) está escopado a ese nombre exacto de
// clase, no a un concepto genérico de "editor" — darle una clase distinta
// dejaría a CvEditor sin nada de ese theming en vez de aislarlo de algo.
// Las reglas de impresión (@media print) ya están escopadas a
// `.apunte-editor-overlay .pila-hojas` etc., así que se aplican igual acá
// sin duplicar nada nuevo en globals.css.
export function CvEditor({ contenido }: CvEditorProps) {
  const [editorInstancia, setEditorInstancia] = useState<Editor | null>(null);
  const handleEditorListo = useCallback((instancia: Editor | null) => {
    setEditorInstancia(instancia);
  }, []);

  const [guardando, setGuardando] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [esquemaVisible, setEsquemaVisible] = useState(false);
  const [paginas, setPaginas] = useState(1);

  const overlayRef = useRef<HTMLDivElement>(null);
  const tituloInputRef = useRef<HTMLInputElement>(null);

  // A diferencia de ApunteEditor, la configuración de página de un CV no se
  // persiste en localStorage (un solo documento por persona, sin necesidad
  // de recordar esto entre sesiones): arranca siempre en A4 por defecto.
  // Igual hay que empujarla al puente de configuracion-pagina.ts (estado a
  // nivel de módulo, compartido con cualquier ApunteEditor abierto antes en
  // esta misma pestaña, ver el comentario del "puente" ahí), o un CV
  // heredaría la última geometría que haya dejado un apunte editado antes.
  const [geometria, setGeometria] = useState<GeometriaPagina>(GEOMETRIA_POR_DEFECTO);
  const [encabezadoPie, setEncabezadoPie] = useState<ConfiguracionEncabezadoPie>(
    ENCABEZADO_PIE_POR_DEFECTO,
  );
  useEffect(() => {
    actualizarGeometria(geometria);
    actualizarEncabezadoPie(encabezadoPie);
  }, [geometria, encabezadoPie]);

  const [configurarPaginaAbierto, setConfigurarPaginaAbierto] = useState(false);

  const [temaAtelier, setTemaAtelier] = useState<TemaEditor>(TEMA_EDITOR_POR_DEFECTO);
  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem("nouttbuk:tema-editor");
      if (guardado === "oscuro" || guardado === "claro") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTemaAtelier(guardado);
      }
    } catch {
      // localStorage puede fallar: se queda con "oscuro" por defecto.
    }
  }, []);
  useEffect(() => {
    actualizarTemaEditor(temaAtelier);
  }, [temaAtelier]);
  function cambiarTemaAtelier(tema: TemaEditor) {
    setTemaAtelier(tema);
    try {
      window.localStorage.setItem("nouttbuk:tema-editor", tema);
    } catch {
      // Si no se puede persistir, la preferencia solo dura esta sesión.
    }
  }

  const [buscarReemplazarAbierto, setBuscarReemplazarAbierto] = useState(false);
  const [contarPalabrasAbierto, setContarPalabrasAbierto] = useState(false);

  useEffect(() => {
    function manejarAtajoGlobal(event: globalThis.KeyboardEvent) {
      const modificador = event.metaKey || event.ctrlKey;
      if (modificador && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setBuscarReemplazarAbierto(true);
      }
    }
    const contenedor = overlayRef.current;
    contenedor?.addEventListener("keydown", manejarAtajoGlobal);
    return () => contenedor?.removeEventListener("keydown", manejarAtajoGlobal);
  }, []);

  const [guiaVisible, setGuiaVisible] = useState(true);
  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem("nouttbuk:guia-editor-visible");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (guardado !== null) setGuiaVisible(guardado === "true");
    } catch {
      // localStorage puede fallar (ventana privada, storage bloqueado): se
      // queda con el valor por defecto, no es crítico.
    }
  }, []);
  function cambiarGuiaVisible(visible: boolean) {
    setGuiaVisible(visible);
    try {
      window.localStorage.setItem("nouttbuk:guia-editor-visible", String(visible));
    } catch {
      // Ídem: si no se puede persistir, la preferencia solo dura esta sesión.
    }
  }

  const inputImagenRef = useRef<HTMLInputElement>(null);
  const { subirArchivo } = useSubirImagenApunte(editorInstancia);

  useEffect(() => {
    function abrirSelector() {
      inputImagenRef.current?.click();
    }
    window.addEventListener(EVENTO_INSERTAR_IMAGEN, abrirSelector);
    return () => window.removeEventListener(EVENTO_INSERTAR_IMAGEN, abrirSelector);
  }, []);

  async function handleFileImagen(event: ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0];
    event.target.value = "";
    if (archivo) await subirArchivo(archivo);
  }

  async function handleGuardar() {
    const editor = editorInstancia;
    if (!editor) return;
    setGuardando(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setGuardando(false);
      toast.add({ title: "Tu sesión expiró. Vuelve a iniciar sesión.", type: "error" });
      return;
    }

    // Siempre es un update: la fila ya existe para cuando este componente
    // se monta (creada en src/app/(shell)/cv/editar/page.tsx si todavía no
    // existía), un CV nunca se "inserta" desde el propio editor.
    const { error: dbError } = await supabase
      .from("cv")
      .update({ contenido: editor.getJSON() })
      .eq("autor_id", user.id);

    setGuardando(false);
    if (dbError) {
      toast.add({ title: "No se pudo guardar tu CV.", type: "error" });
      return;
    }

    toast.add({ title: "CV guardado.", type: "success" });
    // A diferencia de un apunte, no hay una lista a la que volver: un CV se
    // sigue editando en el lugar, coherente con "abrilo, editalo,
    // descargalo".
  }

  return (
    <div
      ref={overlayRef}
      data-tema={temaAtelier}
      className="apunte-editor-overlay fixed inset-0 z-[60] flex flex-col bg-background"
    >
      <header className="print:hidden flex flex-col border-b border-border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
          <div className="flex flex-1 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Cerrar editor"
              nativeButton={false}
              render={<Link href="/cv" />}
            >
              <XIcon aria-hidden />
            </Button>

            <span className="min-w-[150px] max-w-[400px] flex-1 truncate px-2 py-1 text-lg font-semibold text-foreground">
              Tu CV
            </span>
          </div>

          <Button type="button" size="sm" className="ml-2 h-8 px-4" onClick={handleGuardar} loading={guardando}>
            Guardar
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-2 py-1">
          <EditorMenuBar
            editor={editorInstancia}
            overlayRef={overlayRef}
            soloLectura={false}
            titulo="CV"
            tituloInputRef={tituloInputRef}
            onGuardar={handleGuardar}
            esquemaVisible={esquemaVisible}
            onEsquemaVisibleChange={setEsquemaVisible}
            guiaVisible={guiaVisible}
            onGuiaVisibleChange={cambiarGuiaVisible}
            zoom={zoom}
            onZoomChange={setZoom}
            onAbrirConfigurarPagina={() => setConfigurarPaginaAbierto(true)}
            onAbrirBuscarReemplazar={() => setBuscarReemplazarAbierto(true)}
            onAbrirContarPalabras={() => setContarPalabrasAbierto(true)}
            tema={temaAtelier}
            onTemaChange={cambiarTemaAtelier}
            mostrarNuevoApunte={false}
            mostrarRenombrar={false}
            formatosDescarga={["pdf"]}
            mostrarRepararFormato={false}
            rutaCerrar="/cv"
          />

          <div className="hidden md:flex items-center gap-1.5 pr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              aria-pressed={esquemaVisible}
              onClick={() => setEsquemaVisible((actual) => !actual)}
            >
              <SidebarSimpleIcon className="mr-1.5 size-3.5" aria-hidden />
              Esquema
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              aria-pressed={guiaVisible}
              onClick={() => cambiarGuiaVisible(!guiaVisible)}
            >
              <LightbulbIcon weight={guiaVisible ? "fill" : "regular"} className="mr-1.5 size-3.5" aria-hidden />
              Guía
            </Button>

            <span className="mx-1 h-4 w-px bg-border" aria-hidden />

            <div className="flex items-center gap-0.5 rounded-md border border-border/50 bg-muted/10 px-1 py-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-6"
                aria-label="Reducir zoom"
                onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_PASO).toFixed(2)))}
              >
                <MinusIcon className="size-3" aria-hidden />
              </Button>
              <span className="w-9 text-center text-[11px] tabular-nums text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-6"
                aria-label="Aumentar zoom"
                onClick={() => setZoom((z) => Math.max(ZOOM_MAX, +(z + ZOOM_PASO).toFixed(2)))}
              >
                <PlusIcon className="size-3" aria-hidden />
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="ml-1 size-7"
              aria-label="Imprimir"
              onClick={() => window.print()}
            >
              <PrinterIcon className="size-3.5 text-muted-foreground" aria-hidden />
            </Button>
          </div>
        </div>
      </header>

      <div className="print:hidden flex justify-center border-b border-border bg-muted/20 px-2 py-1.5 backdrop-blur-md">
        <EditorBarraPersistente editor={editorInstancia} overlayRef={overlayRef} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {esquemaVisible && (
          <aside className="print:hidden w-56 shrink-0 overflow-y-auto border-r border-border p-3">
            <EditorEsquema editor={editorInstancia} />
          </aside>
        )}

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="lienzo-editor mt-4 flex flex-1 items-start justify-center px-4 pt-10 pb-32 sm:px-8 sm:pb-48">
            <AmbienteAtelier />
            <div
              className="zoom-lienzo"
              style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
            >
              <HojasEditor
                editor={editorInstancia}
                geometria={geometria}
                encabezadoPie={encabezadoPie}
                onPaginasChange={setPaginas}
              >
                <EditorEstatico
                  contenido={contenido}
                  editable
                  onEditorListo={handleEditorListo}
                />
              </HojasEditor>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={inputImagenRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileImagen}
      />

      {guiaVisible && <EditorGuia onCerrar={() => cambiarGuiaVisible(false)} />}

      <div className="print:hidden">
        <EditorContadorPalabras editor={editorInstancia} />
      </div>

      <DialogoConfigurarPagina
        open={configurarPaginaAbierto}
        onOpenChange={setConfigurarPaginaAbierto}
        overlayRef={overlayRef}
        geometria={geometria}
        onGeometriaChange={setGeometria}
        encabezadoPie={encabezadoPie}
        onEncabezadoPieChange={setEncabezadoPie}
      />
      <DialogoBuscarReemplazar
        editor={editorInstancia}
        open={buscarReemplazarAbierto}
        onOpenChange={setBuscarReemplazarAbierto}
        overlayRef={overlayRef}
      />
      <DialogoContarPalabras
        editor={editorInstancia}
        paginas={paginas}
        open={contarPalabrasAbierto}
        onOpenChange={setContarPalabrasAbierto}
        overlayRef={overlayRef}
      />
    </div>
  );
}
