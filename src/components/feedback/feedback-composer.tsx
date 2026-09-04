"use client";

import { type FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import type { FeedbackIdea } from "@/components/feedback/feedback-lista";

type FeedbackComposerProps = {
  usuarioId: string;
  onIdeaCreada: (idea: FeedbackIdea) => void;
};

// Mismo patrón que ComentarioForm (src/components/comunidad/
// comentario-form.tsx): inserta y hace .select().single() en la misma
// llamada para que el prepend optimista tenga los datos reales del autor
// sin un segundo viaje.
export function FeedbackComposer({
  usuarioId,
  onIdeaCreada,
}: FeedbackComposerProps) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const valor = texto.trim();
    if (!valor || enviando) return;

    setEnviando(true);
    setError(null);

    const supabase = createClient();
    const { data, error: dbError } = await supabase
      .from("feedback")
      .insert({ autor_id: usuarioId, texto: valor })
      .select("id, texto, estado, created_at, autor:profiles(nombre, usuario, avatar_url)")
      .single();

    setEnviando(false);

    if (dbError || !data) {
      setError("No se pudo enviar la idea. Intenta de nuevo.");
      return;
    }

    onIdeaCreada({
      id: data.id,
      texto: data.texto,
      estado: data.estado,
      createdAt: data.created_at,
      autor: {
        nombre: data.autor?.nombre ?? "Tú",
        usuario: data.autor?.usuario ?? "",
        avatarUrl: data.autor?.avatar_url ?? null,
      },
      votos: 0,
      yaVote: false,
    });
    setTexto("");
    toast.add({ title: "Idea enviada. ¡Gracias!", type: "success" });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Textarea
        value={texto}
        onChange={(event) => setTexto(event.target.value)}
        placeholder="¿Qué te gustaría ver en Nouttbuk?"
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
        disabled={!texto.trim()}
      >
        Enviar idea
      </Button>
    </form>
  );
}
