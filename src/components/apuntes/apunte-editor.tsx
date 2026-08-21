"use client";

import { type KeyboardEvent, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Editor } from "@tiptap/react";
import {
  FolderIcon,
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
import { CompartirSheet } from "@/components/apuntes/compartir-sheet";
import { EditorEstatico } from "@/components/apuntes/editor-estatico";
import { EditorColaborativo } from "@/components/apuntes/editor-colaborativo";
import {
  EditorToolbar,
  EditorContadorPalabras,
} from "@/components/apuntes/editor-toolbar";
import { resolverColorCarpeta } from "@/lib/carpetas/colores";
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
};

const ETIQUETAS_ROTAS = /[,\n]/;

const VISIBILIDAD_LABEL: Record<ApunteVisibilidad, string> = {
  private: "Privado",
  group: "Grupo",
  community: "Comunidad",
};

// Overlay de pantalla completa (position: fixed), no una ruta con su propio
// layout: cubre visualmente el nav lateral del shell sin duplicar el árbol
// de rutas, tal como pide design.md para Editor ("overlay de pantalla
// completa con salida explícita, nunca solo tocar afuera").
export function ApunteEditor({
  carpetas,
  cursos,
  apunte,
  permisoActual = "owner",
  autorNombre,
  colaboradoresIniciales = [],
}: ApunteEditorProps) {
  const router = useRouter();
  const esEdicion = Boolean(apunte);
  const esOwner = permisoActual === "owner";
  const soloLectura = permisoActual === "read";
  const carpetaActual = carpetas.find((carpeta) => carpeta.id === apunte?.carpetaId);
  const cursoActual = cursos.find((curso) => curso.id === apunte?.cursoId);
  const [titulo, setTitulo] = useState(apunte?.titulo ?? "");
  const [carpetaId, setCarpetaId] = useState<string | null>(
    apunte?.carpetaId ?? null,
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
        return;
      }
    }

    router.push("/apuntes");
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
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

        <div className="flex items-center gap-2">
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
                    `${curso.nombre} · ${curso.carreraNombre}`,
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
                    {curso.nombre} · {curso.carreraNombre}
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

          {!soloLectura && (
            <Button type="button" onClick={handleGuardar} loading={guardando}>
              Guardar
            </Button>
          )}
        </div>
      </header>

      {!soloLectura && <EditorToolbar editor={editorInstancia} />}

      {/* Un único contenedor con scroll para metadata + hoja: así se
          desplazan juntos y el lienzo de fondo se extiende naturalmente
          hasta donde termine el contenido, sin dos barras de scroll. */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[794px] flex-col gap-3 px-6 pt-8">
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          {!esOwner && (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              <UsersThreeIcon className="size-4" aria-hidden />
              Compartido por {autorNombre ?? "otra persona"} ·{" "}
              {soloLectura ? "Solo lectura" : "Puedes editar"}
            </div>
          )}

          <input
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            placeholder="Título del apunte"
            readOnly={soloLectura}
            className="w-full border-none bg-transparent text-2xl font-bold text-foreground outline-none placeholder:text-muted-foreground"
          />

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

        {/* El lienzo (fondo con tinte índigo) y la hoja (siempre blanca,
            forma A4) le dan al editor la sensación de "hoja de papel" en vez
            de una cartulina infinita del mismo color que el resto de la app. */}
        <div className="lienzo-editor mt-6 flex flex-1 justify-center px-4 py-10 sm:px-8">
          <div className="hoja-editor min-h-[600px] w-full max-w-[794px] rounded-sm px-6 py-10 sm:min-h-[900px] sm:px-14 sm:py-14 lg:min-h-[1123px] lg:px-20 lg:py-16">
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
          </div>
        </div>
      </div>

      {!soloLectura && <EditorContadorPalabras editor={editorInstancia} />}
    </div>
  );
}
