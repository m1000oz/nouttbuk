"use client";

import { useState } from "react";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  BookmarkSimpleIcon,
  ChatCircleIcon,
  HeartIcon,
  ShareNetworkIcon,
  XIcon,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fechaRelativa } from "@/lib/fecha/relativa";
import type { Json } from "@/lib/types/database.types";
import type { ConteosPublicacion } from "@/lib/comunidad/consultas";

function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type Autor = { nombre: string; usuario: string; avatarUrl: string | null };

export type ComentarioData = {
  id: string;
  texto: string;
  createdAt: string;
  autor: Autor;
};

type DetallePublicacionProps = {
  publicacion: {
    id: string;
    titulo: string;
    contenido: Json;
    createdAt: string;
    autor: Autor;
  };
  conteos: ConteosPublicacion;
  usuarioId: string | null;
  yaReacciono: boolean;
  yaGuarde: boolean;
  comentarios: ComentarioData[];
};

// Mismo patrón de overlay de pantalla completa que ApunteEditor: cubre el
// nav lateral sin una segunda ramificación del árbol de rutas del shell.
export function DetallePublicacion({
  publicacion,
  conteos,
  usuarioId,
  yaReacciono,
  yaGuarde,
  comentarios,
}: DetallePublicacionProps) {
  const [copiado, setCopiado] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: publicacion.contenido as object,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-content",
      },
    },
  });

  async function compartir() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: publicacion.titulo, url });
      } catch {
        // El usuario canceló el diálogo nativo de compartir: no es un error.
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Cerrar publicación"
          nativeButton={false}
          render={<Link href="/" />}
        >
          <XIcon aria-hidden />
        </Button>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 overflow-y-auto px-6 py-8">
        <div className="flex items-center gap-2.5">
          <Avatar>
            {publicacion.autor.avatarUrl && (
              <AvatarImage src={publicacion.autor.avatarUrl} alt="" />
            )}
            <AvatarFallback>{iniciales(publicacion.autor.nombre)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {publicacion.autor.nombre}
            </span>
            <span className="text-xs text-muted-foreground">
              {fechaRelativa(publicacion.createdAt)}
            </span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground">
          {publicacion.titulo}
        </h1>

        <EditorContent editor={editor} />

        <div className="flex items-center gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            aria-label={
              yaReacciono ? "Quitar reacción" : "Reaccionar a esta publicación"
            }
            aria-pressed={yaReacciono}
          >
            <HeartIcon weight={yaReacciono ? "fill" : "regular"} aria-hidden />
            {conteos.reacciones}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            aria-label="Ir a los comentarios"
          >
            <ChatCircleIcon aria-hidden />
            {conteos.comentarios}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            aria-label={yaGuarde ? "Quitar de guardados" : "Guardar publicación"}
            aria-pressed={yaGuarde}
          >
            <BookmarkSimpleIcon
              weight={yaGuarde ? "fill" : "regular"}
              aria-hidden
            />
            {conteos.guardados}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={compartir}
            aria-label="Compartir publicación"
            className="ml-auto"
          >
            <ShareNetworkIcon aria-hidden />
            {copiado ? "Enlace copiado" : "Compartir"}
          </Button>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Comentarios
          </h2>

          {usuarioId === null ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
              Inicia sesión para ver los comentarios.
            </p>
          ) : comentarios.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
              Todavía no hay comentarios en esta publicación.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {comentarios.map((comentario) => (
                <li key={comentario.id} className="flex items-start gap-2.5">
                  <Avatar size="sm">
                    {comentario.autor.avatarUrl && (
                      <AvatarImage src={comentario.autor.avatarUrl} alt="" />
                    )}
                    <AvatarFallback>
                      {iniciales(comentario.autor.nombre)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {comentario.autor.nombre}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {fechaRelativa(comentario.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{comentario.texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
