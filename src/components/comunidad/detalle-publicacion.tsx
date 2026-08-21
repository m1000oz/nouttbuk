"use client";

import { useState } from "react";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import TiptapLink from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { ChatCircleIcon, ShareNetworkIcon, XIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fechaRelativa } from "@/lib/fecha/relativa";
import { FontSize } from "@/lib/tiptap/font-size-extension";
import { ReaccionBoton } from "@/components/comunidad/reaccion-boton";
import { GuardarBoton } from "@/components/comunidad/guardar-boton";
import { ComentarioForm } from "@/components/comunidad/comentario-form";
import {
  ComentariosLista,
  type ComentarioData,
} from "@/components/comunidad/comentarios-lista";
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
  const [comentariosLocal, setComentariosLocal] =
    useState<ComentarioData[]>(comentarios);
  // Para anon, `comentarios` llega vacío por RLS aunque haya comentarios
  // reales (ver contrato de la página), así que el contador visible parte
  // del agregado de `conteos` (visible sin sesión) y no de la lista local.
  const [totalComentarios, setTotalComentarios] = useState(
    conteos.comentarios,
  );

  function handleComentarioCreado(comentario: ComentarioData) {
    setComentariosLocal((actual) => [...actual, comentario]);
    setTotalComentarios((actual) => actual + 1);
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      FontSize,
      Color,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      TiptapLink.configure({ openOnClick: true, autolink: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
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

      {/* Un único contenedor con scroll para metadata + hoja + comentarios,
          igual que ApunteEditor: se desplazan juntos y el lienzo se extiende
          naturalmente hasta donde termine el contenido. */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[794px] flex-col gap-3 px-6 pt-8">
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
        </div>

        {/* Mismo tratamiento visual "hoja" que el editor, para que leer una
            publicación se sienta consistente con escribirla. La altura
            mínima es más modesta que en el editor (no hace falta espacio
            para seguir escribiendo). */}
        <div className="lienzo-editor mt-4 flex flex-1 justify-center px-4 py-10 sm:px-8">
          <div className="hoja-editor min-h-[300px] w-full max-w-[794px] rounded-sm px-6 py-10 sm:min-h-[500px] sm:px-14 sm:py-14">
            <EditorContent editor={editor} />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[794px] flex-col gap-4 px-6 py-8">
          <div className="flex items-center gap-2 border-t border-border pt-4">
            <ReaccionBoton
              publicacionId={publicacion.id}
              usuarioId={usuarioId}
              activo={yaReacciono}
              count={conteos.reacciones}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              aria-label="Ir a los comentarios"
            >
              <ChatCircleIcon aria-hidden />
              {totalComentarios}
            </Button>
            <GuardarBoton
              publicacionId={publicacion.id}
              usuarioId={usuarioId}
              activo={yaGuarde}
              count={conteos.guardados}
            />
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

            <ComentarioForm
              publicacionId={publicacion.id}
              usuarioId={usuarioId}
              onComentarioCreado={handleComentarioCreado}
            />

            <ComentariosLista
              usuarioId={usuarioId}
              comentarios={comentariosLocal}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
