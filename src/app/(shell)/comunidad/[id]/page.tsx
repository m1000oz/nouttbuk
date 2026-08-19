import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { DetallePublicacion } from "@/components/comunidad/detalle-publicacion";

// Sin redirect de auth: a diferencia de /apuntes/[id]/editar, esta ruta debe
// funcionar también para anon (mismo contrato que (shell)/page.tsx).
export default async function DetallePublicacionPage(
  props: PageProps<"/comunidad/[id]">,
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: publicacion } = await supabase
    .from("publicaciones")
    .select(
      `
      id,
      created_at,
      apunte:apuntes!inner(
        id,
        titulo,
        contenido,
        created_at,
        autor:profiles!apuntes_autor_id_fkey(id, nombre, usuario, avatar_url)
      )
    `,
    )
    .eq("id", id)
    .single();

  // RLS ya filtra: anon solo la ve si el apunte sigue community, un
  // autenticado sin permiso tampoco la ve.
  if (!publicacion) {
    notFound();
  }

  const { data: conteos } = await supabase.rpc("get_publicacion_counts", {
    publicacion_ids: [id],
  });
  const fila = conteos?.[0];

  let yaReacciono = false;
  let yaGuarde = false;
  let comentarios: {
    id: string;
    texto: string;
    createdAt: string;
    autor: { nombre: string; usuario: string; avatarUrl: string | null };
  }[] = [];

  if (user) {
    const [{ data: reaccion }, { data: guardado }, { data: filasComentarios }] =
      await Promise.all([
        supabase
          .from("reacciones")
          .select("id")
          .eq("publicacion_id", id)
          .eq("perfil_id", user.id)
          .maybeSingle(),
        supabase
          .from("guardados")
          .select("id")
          .eq("publicacion_id", id)
          .eq("perfil_id", user.id)
          .maybeSingle(),
        supabase
          .from("comentarios")
          .select(
            "id, texto, created_at, autor:profiles(id, nombre, usuario, avatar_url)",
          )
          .eq("publicacion_id", id)
          .order("created_at", { ascending: true }),
      ]);

    yaReacciono = Boolean(reaccion);
    yaGuarde = Boolean(guardado);
    comentarios = (filasComentarios ?? []).map((fila) => ({
      id: fila.id,
      texto: fila.texto,
      createdAt: fila.created_at,
      autor: {
        nombre: fila.autor?.nombre ?? "Alguien de la comunidad",
        usuario: fila.autor?.usuario ?? "",
        avatarUrl: fila.autor?.avatar_url ?? null,
      },
    }));
  }

  return (
    <DetallePublicacion
      publicacion={{
        id: publicacion.id,
        titulo: publicacion.apunte.titulo,
        contenido: publicacion.apunte.contenido,
        createdAt: publicacion.apunte.created_at,
        autor: {
          nombre: publicacion.apunte.autor?.nombre ?? "Alguien de la comunidad",
          usuario: publicacion.apunte.autor?.usuario ?? "",
          avatarUrl: publicacion.apunte.autor?.avatar_url ?? null,
        },
      }}
      conteos={{
        reacciones: fila?.reacciones ?? 0,
        guardados: fila?.guardados ?? 0,
        comentarios: fila?.comentarios ?? 0,
      }}
      usuarioId={user?.id ?? null}
      yaReacciono={yaReacciono}
      yaGuarde={yaGuarde}
      comentarios={comentarios}
    />
  );
}
