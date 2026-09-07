"use client";

import {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Editor } from "@tiptap/react";
import {
  FolderIcon,
  LightbulbIcon,
  MinusIcon,
  PlusIcon,
  PrinterIcon,
  SidebarSimpleIcon,
  StarIcon,
  UsersThreeIcon,
  XIcon,
} from "@phosphor-icons/react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { CompartirSheet } from "@/components/apuntes/compartir-sheet";
import { EditorEstatico } from "@/components/apuntes/editor-estatico";
import { EditorColaborativo } from "@/components/apuntes/editor-colaborativo";
import { HojasEditor } from "@/components/apuntes/hojas-editor";
import { EditorEsquema } from "@/components/apuntes/editor-esquema";
import { EditorGuia } from "@/components/apuntes/editor-guia";
import { AmbienteAtelier } from "@/components/apuntes/ambiente-atelier";
import { EditorContadorPalabras } from "@/components/apuntes/editor-toolbar";
import { EditorMenuBar } from "@/components/apuntes/editor-menu-bar";
import { EditorBarraPersistente } from "@/components/apuntes/editor-barra-persistente";
import { DialogoConfigurarPagina } from "@/components/apuntes/dialogo-configurar-pagina";
import { DialogoBuscarReemplazar } from "@/components/apuntes/dialogo-buscar-reemplazar";
import { DialogoContarPalabras } from "@/components/apuntes/dialogo-contar-palabras";
import { EVENTO_INSERTAR_IMAGEN } from "@/components/apuntes/menu-comandos";
import { useSubirImagenApunte } from "@/lib/tiptap/usar-subir-imagen-apunte";
import { resolverColorCarpeta } from "@/lib/carpetas/colores";
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
import type { ColaboradorRow } from "@/lib/colaboradores/consultas";
import type { CursoConCarrera } from "@/lib/cursos/consultas";
import type { Json } from "@/lib/types/database.types";
import type { ApunteVisibilidad, PermisoColaborador } from "@/lib/types/enums";

type Carpeta = { id: string; nombre: string; color: string };

type PermisoApunte = "owner" | PermisoColaborador;

type ApunteEditorProps = {
  carpetas: Carpeta[];
  cursos: CursoConCarrera[];
  apunte?: {
    id: string;
    titulo: string;
    contenido: Json;
    carpetaId: string | null;
    cursoId: string | null;
    visibilidad: ApunteVisibilidad;
    etiquetas: string[];
    favorito: boolean;
  };
  permisoActual?: PermisoApunte;
  autorNombre?: string;
  colaboradoresIniciales?: ColaboradorRow[];
  carpetaIdInicial?: string | null;
};

const ETIQUETAS_ROTAS = /[,\n]/;
const ZOOM_MIN = 0.6;
const ZOOM_MAX = 1.5;
const ZOOM_PASO = 0.1;

const VISIBILIDAD_LABEL: Record<ApunteVisibilidad, string> = {
  private: "Privado",
  group: "Grupo",
  community: "Comunidad",
};

// Overlay de pantalla completa (position: fixed), no una ruta con su propio
// layout: cubre visualmente el nav lateral del shell sin duplicar el árbol
// de rutas. La clase apunte-editor-overlay además es el mundo visual propio
// del editor (atelier oscuro y cálido, ver globals.css): reemplaza los
// tokens de tema de toda la app para todo lo que no haga portal fuera de
// este árbol (Select/Sheet sí escapan y se quedan en el tema ambiente de la
// app: es el trade-off aceptado por ser acciones secundarias, no la
// superficie principal).
export function ApunteEditor({
  carpetas,
  cursos,
  apunte,
  permisoActual = "owner",
  autorNombre,
  colaboradoresIniciales = [],
  carpetaIdInicial = null,
}: ApunteEditorProps) {
  const router = useRouter();
  const esEdicion = Boolean(apunte);
  const esOwner = permisoActual === "owner";
  const soloLectura = permisoActual === "read";
  const carpetaActual = carpetas.find((carpeta) => carpeta.id === apunte?.carpetaId);
  const cursoActual = cursos.find((curso) => curso.id === apunte?.cursoId);
  const [titulo, setTitulo] = useState(apunte?.titulo ?? "");
  const [carpetaId, setCarpetaId] = useState<string | null>(
    apunte?.carpetaId ?? carpetaIdInicial,
  );
  const [cursoId, setCursoId] = useState<string | null>(
    apunte?.cursoId ?? null,
  );
  const [visibilidad, setVisibilidad] = useState<ApunteVisibilidad>(
    apunte?.visibilidad ?? "private",
  );
  const [etiquetas, setEtiquetas] = useState<string[]>(
    apunte?.etiquetas ?? [],
  );
  const [etiquetaInput, setEtiquetaInput] = useState("");
  const [favorito, setFavorito] = useState(apunte?.favorito ?? false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // El editor real vive en EditorEstatico o EditorColaborativo (cada uno con
  // su propio useEditor(), no se pueden llamar hooks condicionalmente pero
  // sí montar un componente u otro). Va en estado (no un ref) porque
  // EditorToolbar/EditorContadorPalabras, montados acá en el padre, necesitan
  // re-renderizar cuando la instancia cambia (por ejemplo al pasar de
  // EditorEstatico a EditorColaborativo).
  const [editorInstancia, setEditorInstancia] = useState<Editor | null>(null);
  const handleEditorListo = useCallback((instancia: Editor | null) => {
    setEditorInstancia(instancia);
  }, []);

  // Zoom es puramente visual (CSS transform sobre la pila de hojas), no toca
  // ProseMirror ni Yjs. El esquema arranca colapsado: no tiene sentido volver
  // a ocupar espacio con un panel que nadie pidió ver todavía.
  const [zoom, setZoom] = useState(1);
  const [esquemaVisible, setEsquemaVisible] = useState(false);

  // Overlay raíz: los menús/diálogos nuevos (menú superior, configurar
  // página, buscar y reemplazar, contar palabras) anclan su portal acá vía
  // el prop `container`, en vez de escapar a document.body como Select/Sheet
  // (ver el gotcha de portales en CLAUDE.md) — así heredan gratis los tokens
  // de color del atelier redefinidos en .apunte-editor-overlay.
  const overlayRef = useRef<HTMLDivElement>(null);
  const tituloInputRef = useRef<HTMLInputElement>(null);

  // Tamaño/márgenes/orientación y encabezado-pie son preferencias por
  // apunte, no datos que ameriten una columna nueva en Supabase: viven en
  // localStorage, mismo patrón que guiaVisible más abajo. La clave incluye
  // el id del apunte (o "nuevo" para un apunte todavía sin crear) para que
  // dos apuntes no compartan la misma configuración de página.
  const claveGeometria = `nouttbuk:pagina:${apunte?.id ?? "nuevo"}`;
  const [geometria, setGeometria] = useState<GeometriaPagina>(GEOMETRIA_POR_DEFECTO);
  const [encabezadoPie, setEncabezadoPie] = useState<ConfiguracionEncabezadoPie>(
    ENCABEZADO_PIE_POR_DEFECTO,
  );
  const [paginas, setPaginas] = useState(1);

  // Tema oscuro/claro del atelier: a diferencia de geometría/encabezado-pie,
  // es una preferencia de esta persona en este navegador, no del apunte
  // (mismo criterio que guiaVisible), así que la clave de localStorage no
  // incluye el id del apunte.
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
  // Se sincroniza en un efecto (no dentro del setter) para cubrir tanto el
  // cambio explícito del usuario como la hidratación inicial desde
  // localStorage con un solo mecanismo.
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

  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(claveGeometria);
      if (guardado) {
        const datos = JSON.parse(guardado) as {
          geometria?: GeometriaPagina;
          encabezadoPie?: ConfiguracionEncabezadoPie;
        };
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (datos.geometria) setGeometria(datos.geometria);
        if (datos.encabezadoPie) setEncabezadoPie(datos.encabezadoPie);
      }
    } catch {
      // localStorage puede fallar o traer JSON corrupto: se queda con el
      // preset A4 por defecto, no es crítico.
    }
    // Solo al montar (o si cambia de qué apunte se trata): no queremos
    // releer localStorage en cada tecleo.
  }, [claveGeometria]);

  useEffect(() => {
    actualizarGeometria(geometria);
    actualizarEncabezadoPie(encabezadoPie);
    try {
      window.localStorage.setItem(
        claveGeometria,
        JSON.stringify({ geometria, encabezadoPie }),
      );
    } catch {
      // Si no se puede persistir, la configuración solo dura esta sesión.
    }
  }, [geometria, encabezadoPie, claveGeometria]);

  const [configurarPaginaAbierto, setConfigurarPaginaAbierto] = useState(false);
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

  // La guía sí arranca visible por defecto (para enseñar los comandos desde
  // el primer uso), pero recuerda si el usuario la cerró: es una preferencia
  // de este navegador, no un dato del apunte, así que vive en localStorage,
  // no en Supabase.
  const [guiaVisible, setGuiaVisible] = useState(true);
  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem("nouttbuk:guia-editor-visible");
      // El valor real vive en localStorage, no en algo que React pueda leer
      // durante el render (y menos en el servidor, donde `window` no
      // existe): un efecto que hidrata el estado inicial desde ahí es el
      // caso legítimo que esta regla generalmente evita, no una excepción a
      // ella.
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

  // Input de imagen persistente (no depende de que haya una selección
  // activa): tanto el botón de la barra flotante como el comando "/Imagen"
  // (que vive dentro de la configuración de una extensión de Tiptap, fuera
  // del árbol de props de este componente) lo disparan, el segundo vía un
  // evento del navegador en vez de una prop hilada a través de
  // EditorEstatico/EditorColaborativo.
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

  // Se acota a la visibilidad ya persistida (apunte?.visibilidad), no al
  // Select local: así, cambiar el selector a "Grupo" sin guardar todavía no
  // intenta abrir una sala (el endpoint de auth solo la concede si la
  // columna en Postgres ya dice 'group', y Guardar siempre navega fuera del
  // editor, así que el flujo real es guardar primero y recién ahí coeditar).
  const modoColaborativo = Boolean(
    esEdicion &&
      apunte &&
      apunte.visibilidad === "group" &&
      permisoActual !== "read",
  );

  function agregarEtiqueta() {
    const valor = etiquetaInput.trim();
    if (!valor || etiquetas.includes(valor)) {
      setEtiquetaInput("");
      return;
    }
    setEtiquetas((actual) => [...actual, valor]);
    setEtiquetaInput("");
  }

  function handleEtiquetaKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      agregarEtiqueta();
      return;
    }
    if (event.key === "Backspace" && !etiquetaInput && etiquetas.length > 0) {
      setEtiquetas((actual) => actual.slice(0, -1));
    }
  }

  function quitarEtiqueta(valor: string) {
    setEtiquetas((actual) => actual.filter((etiqueta) => etiqueta !== valor));
  }

  async function handleGuardar() {
    const editor = editorInstancia;
    if (!editor) return;
    setError(null);
    setGuardando(true);

    // Si el usuario dejó texto sin confirmar con Enter en el campo de
    // etiquetas, igual se guarda al presionar Guardar.
    const etiquetaPendiente = etiquetaInput.trim();
    const etiquetasFinales =
      etiquetaPendiente && !etiquetas.includes(etiquetaPendiente)
        ? [...etiquetas, etiquetaPendiente]
        : etiquetas;

    const supabase = createClient();
    const campos = {
      titulo: titulo.trim() || "Sin título",
      contenido: editor.getJSON(),
      carpeta_id: carpetaId,
      curso_id: cursoId,
      visibilidad,
      etiquetas: etiquetasFinales,
      favorito,
    };

    if (esEdicion && apunte) {
      const { error: dbError } = await supabase
        .from("apuntes")
        .update(campos)
        .eq("id", apunte.id);

      setGuardando(false);
      if (dbError) {
        setError("No se pudo guardar los cambios. Intenta de nuevo.");
        toast.add({ title: "No se pudo guardar el apunte.", type: "error" });
        return;
      }
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setGuardando(false);
        setError("Tu sesión expiró. Vuelve a iniciar sesión.");
        return;
      }

      const { error: dbError } = await supabase
        .from("apuntes")
        .insert({ ...campos, autor_id: user.id });

      setGuardando(false);
      if (dbError) {
        setError("No se pudo guardar el apunte. Intenta de nuevo.");
        toast.add({ title: "No se pudo guardar el apunte.", type: "error" });
        return;
      }
    }

    toast.add({
      title: esEdicion ? "Apunte guardado." : "Apunte creado.",
      type: "success",
    });
    router.push("/apuntes");
    router.refresh();
  }

  return (
    <div
      ref={overlayRef}
      data-tema={temaAtelier}
      className="apunte-editor-overlay fixed inset-0 z-50 flex flex-col bg-background"
    >
      <header className="print:hidden flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Cerrar editor"
          nativeButton={false}
          render={<Link href="/apuntes" />}
        >
          <XIcon aria-hidden />
        </Button>

        {/* Título en el header, no como primera línea de la hoja: mismo
            lugar que Google Docs (junto al menú, no dentro del papel). El
            input ya existía, solo cambió dónde vive y su tipografía (DM
            Sans del resto del chrome, no la serif manuscrita reservada
            para el contenido de la hoja). */}
        <input
          ref={tituloInputRef}
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          placeholder="Título del apunte"
          readOnly={soloLectura}
          className="min-w-0 flex-1 truncate border-none bg-transparent text-base font-medium text-foreground outline-none placeholder:text-muted-foreground"
        />

        <div className="flex flex-wrap items-center gap-2">
          {!soloLectura && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={
                favorito ? "Quitar de favoritos" : "Marcar como favorito"
              }
              aria-pressed={favorito}
              onClick={() => setFavorito((actual) => !actual)}
            >
              <StarIcon
                weight={favorito ? "fill" : "regular"}
                className={favorito ? "text-warning" : undefined}
                aria-hidden
              />
            </Button>
          )}

          {esOwner ? (
            <Select
              value={carpetaId ?? "__ninguna__"}
              onValueChange={(valor) =>
                setCarpetaId(valor === "__ninguna__" ? null : valor)
              }
              items={{
                __ninguna__: "Sin carpeta",
                ...Object.fromEntries(
                  carpetas.map((carpeta) => [carpeta.id, carpeta.nombre]),
                ),
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue placeholder="Carpeta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__ninguna__">Sin carpeta</SelectItem>
                {carpetas.map((carpeta) => (
                  <SelectItem key={carpeta.id} value={carpeta.id}>
                    <FolderIcon
                      weight="fill"
                      className="size-3.5"
                      style={{ color: resolverColorCarpeta(carpeta.color) }}
                      aria-hidden
                    />
                    {carpeta.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            carpetaActual && (
              <Badge variant="secondary">{carpetaActual.nombre}</Badge>
            )
          )}

          {esOwner ? (
            <Select
              value={cursoId ?? "__ninguno__"}
              onValueChange={(valor) =>
                setCursoId(valor === "__ninguno__" ? null : valor)
              }
              items={{
                __ninguno__: "Sin curso",
                ...Object.fromEntries(
                  cursos.map((curso) => [
                    curso.id,
                    `${curso.nombre} (${curso.carreraNombre})`,
                  ]),
                ),
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue placeholder="Curso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__ninguno__">Sin curso</SelectItem>
                {cursos.map((curso) => (
                  <SelectItem key={curso.id} value={curso.id}>
                    <span className="flex flex-col py-0.5">
                      <span>{curso.nombre}</span>
                      <span className="text-xs text-muted-foreground">
                        {curso.carreraNombre}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            cursoActual && (
              <Badge variant="secondary">{cursoActual.nombre}</Badge>
            )
          )}

          {esOwner ? (
            <Select
              value={visibilidad}
              onValueChange={(valor) =>
                setVisibilidad(valor as ApunteVisibilidad)
              }
              items={VISIBILIDAD_LABEL}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(VISIBILIDAD_LABEL) as ApunteVisibilidad[]).map(
                  (clave) => (
                    <SelectItem key={clave} value={clave}>
                      {VISIBILIDAD_LABEL[clave]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="secondary">{VISIBILIDAD_LABEL[visibilidad]}</Badge>
          )}

          <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Esquema del documento"
            aria-pressed={esquemaVisible}
            onClick={() => setEsquemaVisible((actual) => !actual)}
          >
            <SidebarSimpleIcon aria-hidden />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={guiaVisible ? "Ocultar guía rápida" : "Mostrar guía rápida"}
            aria-pressed={guiaVisible}
            onClick={() => cambiarGuiaVisible(!guiaVisible)}
          >
            <LightbulbIcon weight={guiaVisible ? "fill" : "regular"} aria-hidden />
          </Button>

          <div className="flex items-center gap-0.5 rounded-md border border-border px-1 py-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Reducir zoom"
              onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_PASO).toFixed(2)))}
            >
              <MinusIcon aria-hidden />
            </Button>
            <span className="w-10 text-center text-xs tabular-nums text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Aumentar zoom"
              onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_PASO).toFixed(2)))}
            >
              <PlusIcon aria-hidden />
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Imprimir"
            onClick={() => window.print()}
          >
            <PrinterIcon aria-hidden />
          </Button>

          {!soloLectura && (
            <Button type="button" onClick={handleGuardar} loading={guardando}>
              Guardar
            </Button>
          )}
        </div>
      </header>

      {!soloLectura && (
        <EditorMenuBar
          editor={editorInstancia}
          overlayRef={overlayRef}
          soloLectura={soloLectura}
          titulo={titulo}
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
        />
      )}
      {!soloLectura && (
        <EditorBarraPersistente editor={editorInstancia} overlayRef={overlayRef} />
      )}

      <div className="flex flex-1 overflow-hidden">
        {esquemaVisible && (
          <aside className="print:hidden w-56 shrink-0 overflow-y-auto border-r border-border p-3">
            <EditorEsquema editor={editorInstancia} />
          </aside>
        )}

        {/* Un único contenedor con scroll para metadata + hoja: así se
            desplazan juntos y el lienzo de fondo se extiende naturalmente
            hasta donde termine el contenido, sin dos barras de scroll. */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[794px] flex-col gap-3 px-6 pt-6">
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            {!esOwner && (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <UsersThreeIcon className="size-4 shrink-0" aria-hidden />
                  Compartido por {autorNombre ?? "otra persona"}
                </span>
                <Badge variant="secondary">
                  {soloLectura ? "Solo lectura" : "Puedes editar"}
                </Badge>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-1.5">
              {etiquetas.map((etiqueta) => (
                <Badge key={etiqueta} variant="secondary">
                  {etiqueta}
                  {!soloLectura && (
                    <button
                      type="button"
                      onClick={() => quitarEtiqueta(etiqueta)}
                      aria-label={`Quitar etiqueta ${etiqueta}`}
                      className="ml-0.5"
                    >
                      <XIcon className="size-3" aria-hidden />
                    </button>
                  )}
                </Badge>
              ))}
              {!soloLectura && (
                <input
                  value={etiquetaInput}
                  onChange={(event) =>
                    setEtiquetaInput(
                      event.target.value.replace(ETIQUETAS_ROTAS, ""),
                    )
                  }
                  onKeyDown={handleEtiquetaKeyDown}
                  onBlur={agregarEtiqueta}
                  placeholder={
                    etiquetas.length === 0 ? "Agregar etiqueta y Enter" : ""
                  }
                  className="min-w-24 flex-1 border-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              )}
            </div>

            {visibilidad === "group" && esOwner && (
              <div className="flex items-center justify-end gap-3 rounded-lg border border-dashed border-border bg-muted/50 px-3 py-2">
                {apunte?.id ? (
                  <CompartirSheet
                    apunteId={apunte.id}
                    colaboradores={colaboradoresIniciales}
                  />
                ) : (
                  <Button type="button" variant="outline" size="sm" disabled>
                    Guarda el apunte para invitar colaboradores
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* El lienzo (escritorio de grafito cálido) y la hoja (papel
              propio, siempre cálido) le dan al editor la sensación de
              instrumento de escritura, no de cartulina infinita ni de
              procesador de textos genérico. */}
          <div className="lienzo-editor mt-4 flex flex-1 items-start justify-center px-4 py-10 sm:px-8">
            <AmbienteAtelier />
            <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
              <HojasEditor
                editor={editorInstancia}
                geometria={geometria}
                encabezadoPie={encabezadoPie}
                onPaginasChange={setPaginas}
              >
                {modoColaborativo && apunte ? (
                  <EditorColaborativo
                    apunteId={apunte.id}
                    contenidoInicial={apunte.contenido}
                    onEditorListo={handleEditorListo}
                  />
                ) : (
                  <EditorEstatico
                    contenido={apunte?.contenido}
                    editable={!soloLectura}
                    onEditorListo={handleEditorListo}
                  />
                )}
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

      {!soloLectura && guiaVisible && (
        <EditorGuia onCerrar={() => cambiarGuiaVisible(false)} />
      )}

      {!soloLectura && (
        <div className="print:hidden">
          <EditorContadorPalabras editor={editorInstancia} />
        </div>
      )}

      {!soloLectura && (
        <>
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
        </>
      )}
    </div>
  );
}
