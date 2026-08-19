"use client";

import { type FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuthGate } from "@/components/nav/auth-gate";
import type { ComentarioData } from "@/components/comunidad/comentarios-lista";

type ComentarioFormProps = {
  publicacionId: string;
  usuarioId: string | null;
  onComentarioCreado: (comentario: ComentarioData) => void;
};

export function ComentarioForm({
  publicacionId,
  usuarioId,
  onComentarioCreado,
}: ComentarioFormProps) {
  const { abrirLogin } = useAuthGate();
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!usuarioId) {
      abrirLogin();
      return;
    }

    const valor = texto.trim();
    if (!valor || enviando) return;

    setEnviando(true);
    setError(null);

    const supabase = createClient();
    const { data, error: dbError } = await supabase
      .from("comentarios")
      .insert({ publicacion_id: publicacionId, autor_id: usuarioId, texto: valor })
      .select("id, texto, created_at, autor:profiles(id, nombre, usuario, avatar_url)")
      .single();

    setEnviando(false);

    if (dbError || !data) {
      setError("No se pudo publicar el comentario. Intenta de nuevo.");
      return;
    }

    onComentarioCreado({
      id: data.id,
      texto: data.texto,
      createdAt: data.created_at,
      autor: {
        nombre: data.autor?.nombre ?? "Tú",
        usuario: data.autor?.usuario ?? "",
        avatarUrl: data.autor?.avatar_url ?? null,
      },
    });
    setTexto("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Textarea
        value={texto}
        onChange={(event) => setTexto(event.target.value)}
        placeholder={
          usuarioId ? "Escribe un comentario" : "Inicia sesión para comentar"
        }
        rows={2}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button
        type="submit"
        size="sm"
        className="self-end"
        loading={enviando}
        disabled={Boolean(usuarioId) && !texto.trim()}
      >
        Comentar
      </Button>
    </form>
  );
}
