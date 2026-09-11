"use client";

import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import { LinkIcon, XIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { fechaRelativa } from "@/lib/fecha/relativa";
import { crearExtensionesEsquema } from "@/lib/tiptap/extensiones-documento";
import { Paginacion } from "@/lib/tiptap/pagination-extension";
import { HojasEditor } from "@/components/apuntes/hojas-editor";
import { useAuthGate } from "@/components/nav/auth-gate";
import type { Json } from "@/lib/types/database.types";
import type { PermisoColaborador } from "@/lib/types/enums";

// A nivel de módulo, no dentro del componente: mismo motivo que en
// detalle-publicacion.tsx y editor-estatico.tsx (StarterKit.configure() +
// Gapcursor + registro global de ProseMirror revientan si se recalcula en
// cada render).
const EXTENSIONES = [...crearExtensionesEsquema({ enlaceClicable: true }), Paginacion];

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

type ApunteCompartidoViewProps = {
  apunte: {
    titulo: string;
    contenido: Json;
    createdAt: string;
    cursoNombre: string | null;
    enlacePermiso: PermisoColaborador;
    autor: Autor;
  };
};

// Vista pública de solo lectura para un apunte accedido por enlace de
// compartir (sin login), independiente de su visibilidad real: mismo patrón
// de overlay de pantalla completa que DetallePublicacion/ApunteEditor, sin
// reacciones/guardar/comentarios (requieren una fila en publicaciones y
// sesión, no aplica a un enlace privado). En su lugar, un banner reutiliza
// useAuthGate().abrirLogin() (el mismo mecanismo que ya usan reaccionar/
// guardar/comentar en Comunidad para pedir sesión desde una página pública),
// ya que esta ruta vive dentro de (shell) y hereda AppShell + su sidebar con
// "Iniciar sesión" para visitantes sin sesión: no hace falta un header
// público aparte.
export function ApunteCompartidoView({ apunte }: ApunteCompartidoViewProps) {
  const { abrirLogin } = useAuthGate();

  const editor = useEditor({
    extensions: EXTENSIONES,
    content: apunte.contenido as object,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-content",
      },
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <Badge variant="secondary">
          <LinkIcon aria-hidden />
          Apunte compartido por enlace
        </Badge>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Cerrar"
          nativeButton={false}
          render={<Link href="/" />}
        >
          <XIcon aria-hidden />
        </Button>
      </header>

      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[794px] flex-col gap-3 px-6 pt-8">
          <div className="flex items-center gap-2.5">
            <Avatar>
              {apunte.autor.avatarUrl && (
                <AvatarImage src={apunte.autor.avatarUrl} alt="" />
              )}
              <AvatarFallback>{iniciales(apunte.autor.nombre)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {apunte.autor.nombre}
              </span>
              <span className="text-xs text-muted-foreground">
                {fechaRelativa(apunte.createdAt)}
              </span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground">
            {apunte.titulo}
          </h1>

          {apunte.cursoNombre && (
            <Badge variant="secondary" className="w-fit">
              {apunte.cursoNombre}
            </Badge>
          )}
        </div>

        <div className="lienzo-editor mt-4 flex flex-1 items-start justify-center px-4 py-10 sm:px-8">
          <HojasEditor editor={editor}>
            <EditorContent editor={editor} />
          </HojasEditor>
        </div>

        <div className="mx-auto flex w-full max-w-[794px] flex-col items-center gap-2 border-t border-border px-6 py-8 text-center">
          <p className="text-sm font-medium text-foreground">
            Estás viendo un apunte compartido en Nouttbuk.
          </p>
          <p className="text-sm text-muted-foreground">
            {apunte.enlacePermiso === "edit"
              ? "Inicia sesión para poder editar este apunte."
              : "Crea tu cuenta para escribir y organizar tus propios apuntes."}
          </p>
          <Button type="button" className="mt-2" onClick={abrirLogin}>
            Únete a Nouttbuk
          </Button>
        </div>
      </div>
    </div>
  );
}
