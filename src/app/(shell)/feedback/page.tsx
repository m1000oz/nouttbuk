import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { FeedbackBoard } from "@/components/feedback/feedback-board";
import type { FeedbackIdea } from "@/components/feedback/feedback-lista";

export default async function FeedbackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?login=1");
  }

  const { data: ideas } = await supabase
    .from("feedback")
    .select("id, texto, estado, created_at, autor:profiles(nombre, usuario, avatar_url)")
    .order("created_at", { ascending: false });

  const filas = ideas ?? [];
  const ids = filas.map((fila) => fila.id);

  const { data: votos } =
    ids.length > 0
      ? await supabase
          .from("feedback_votos")
          .select("feedback_id, perfil_id")
          .in("feedback_id", ids)
      : { data: [] };

  const votosPorIdea = new Map<string, { count: number; propio: boolean }>();
  for (const voto of votos ?? []) {
    const actual = votosPorIdea.get(voto.feedback_id) ?? {
      count: 0,
      propio: false,
    };
    actual.count += 1;
    if (voto.perfil_id === user.id) actual.propio = true;
    votosPorIdea.set(voto.feedback_id, actual);
  }

  const ideasIniciales: FeedbackIdea[] = filas.map((fila) => ({
    id: fila.id,
    texto: fila.texto,
    estado: fila.estado,
    createdAt: fila.created_at,
    autor: {
      nombre: fila.autor?.nombre ?? "Alguien",
      usuario: fila.autor?.usuario ?? "",
      avatarUrl: fila.autor?.avatar_url ?? null,
    },
    votos: votosPorIdea.get(fila.id)?.count ?? 0,
    yaVote: votosPorIdea.get(fila.id)?.propio ?? false,
  }));

  return <FeedbackBoard usuarioId={user.id} ideas={ideasIniciales} />;
}
