"use client";

import { type KeyboardEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { StarIcon, UsersThreeIcon, XIcon } from "@phosphor-icons/react";

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
import { resolverColorCarpeta } from "@/lib/carpetas/colores";
import type { ApunteVisibilidad, Json } from "@/lib/types/database.types";

type Carpeta = { id: string; nombre: string; color: string };

type ApunteEditorProps = {
  carpetas: Carpeta[];
  apunte?: {
    id: string;
    titulo: string;
    contenido: Json;
    carpetaId: string | null;
    visibilidad: ApunteVisibilidad;
    etiquetas: string[];
    favorito: boolean;
  };
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
export function ApunteEditor({ carpetas, apunte }: ApunteEditorProps) {
  const router = useRouter();
  const esEdicion = Boolean(apunte);
  const [titulo, setTitulo] = useState(apunte?.titulo ?? "");
  const [carpetaId, setCarpetaId] = useState<string | null>(
    apunte?.carpetaId ?? null,
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

  const editor = useEditor({
    extensions: [StarterKit],
    content: apunte?.contenido as object | undefined,
    // Evita el mismatch de hidratación: ProseMirror necesita el DOM real
    // del navegador, así que el primer render no debe intentar coincidir
    // con nada renderizado en el servidor.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-content focus:outline-none",
      },
    },
  });

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
                  <span
                    className="size-2 rounded-full"
                    style={{
                      backgroundColor: resolverColorCarpeta(carpeta.color),
                    }}
                    aria-hidden
                  />
                  {carpeta.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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

          <Button type="button" onClick={handleGuardar} loading={guardando}>
            Guardar
          </Button>
        </div>
      </header>

      {error && (
        <p
          role="alert"
          className="mx-auto mt-3 w-full max-w-2xl rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 overflow-y-auto px-6 py-8">
        <input
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          placeholder="Título del apunte"
          className="w-full border-none bg-transparent text-2xl font-bold text-foreground outline-none placeholder:text-muted-foreground"
        />

        <div className="flex flex-wrap items-center gap-1.5">
          {etiquetas.map((etiqueta) => (
            <Badge key={etiqueta} variant="secondary">
              {etiqueta}
              <button
                type="button"
                onClick={() => quitarEtiqueta(etiqueta)}
                aria-label={`Quitar etiqueta ${etiqueta}`}
                className="ml-0.5"
              >
                <XIcon className="size-3" aria-hidden />
              </button>
            </Badge>
          ))}
          <input
            value={etiquetaInput}
            onChange={(event) =>
              setEtiquetaInput(event.target.value.replace(ETIQUETAS_ROTAS, ""))
            }
            onKeyDown={handleEtiquetaKeyDown}
            onBlur={agregarEtiqueta}
            placeholder={
              etiquetas.length === 0 ? "Agregar etiqueta y Enter" : ""
            }
            className="min-w-24 flex-1 border-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        {visibilidad === "group" && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/50 px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UsersThreeIcon className="size-4" aria-hidden />
              La coedición en vivo y la invitación a colaboradores llegan
              pronto.
            </div>
            <Button type="button" variant="outline" size="sm" disabled>
              Invitar colaborador
            </Button>
          </div>
        )}

        <EditorContent editor={editor} className="flex-1" />
      </div>
    </div>
  );
}
