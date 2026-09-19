import { Liveblocks } from "@liveblocks/node";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { colorParaUsuario } from "@/lib/liveblocks/color-usuario";
import { asegurarSalaSembrada } from "@/lib/liveblocks/sembrar-sala";
import type { Json } from "@/lib/types/database.types";

const PREFIJO_SALA = "apunte-";

// La sala de un apunte solo se otorga a su dueño o a un colaborador con
// permiso "edit" en un apunte de visibilidad "group", repitiendo en el
// servidor la misma comprobación que ya hace apuntes/[id]/editar/page.tsx
// para decidir qué UI mostrar (allá) y aquí para decidir si se emite la
// sesión (la fuente de verdad real de acceso a datos sigue siendo RLS).
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { room } = (await request.json()) as { room?: string };

  if (!room || !room.startsWith(PREFIJO_SALA)) {
    return NextResponse.json({ error: "Sala inválida" }, { status: 400 });
  }

  const apunteId = room.slice(PREFIJO_SALA.length);

  const { data: apunte } = await supabase
    .from("apuntes")
    .select("autor_id, visibilidad")
    .eq("id", apunteId)
    .single();

  if (!apunte || apunte.visibilidad !== "group") {
    return NextResponse.json({ error: "No permitido" }, { status: 403 });
  }

  let permitido = apunte.autor_id === user.id;
  if (!permitido) {
    const { data: colaboracion } = await supabase
      .from("colaboradores")
      .select("permiso")
      .eq("apunte_id", apunteId)
      .eq("perfil_id", user.id)
      .maybeSingle();
    permitido = colaboracion?.permiso === "edit";
  }

  if (!permitido) {
    return NextResponse.json({ error: "No permitido" }, { status: 403 });
  }

  const { data: perfil } = await supabase
    .from("profiles")
    .select("nombre, avatar_url")
    .eq("id", user.id)
    .single();

  // Se construye por petición, no en el ámbito del módulo: el constructor de
  // Liveblocks valida la clave al instante, y en el ámbito del módulo eso se
  // evalúa durante "next build" (al recolectar los datos de cada ruta), donde
  // el secreto no tiene por qué existir todavía.
  const liveblocks = new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY!,
  });

  // La sala se siembra aquí, en el servidor y antes de emitir el token, para
  // que ningún cliente tenga que decidir (y pueda competir) sobre quién
  // importa el contenido de Postgres. Si falla, se rechaza la conexión en vez
  // de dejar entrar a alguien a una sala vacía que luego se guardaría encima
  // del contenido real.
  try {
    await asegurarSalaSembrada(liveblocks, room, async () => {
      const { data } = await supabase
        .from("apuntes")
        .select("contenido, titulo")
        .eq("id", apunteId)
        .single();
      return {
        contenido: (data?.contenido as Json | undefined) ?? null,
        titulo: data?.titulo ?? "",
      };
    });
  } catch (error) {
    console.error("[liveblocks-auth] no se pudo preparar la sala", room, error);
    return NextResponse.json({ error: "No se pudo preparar la sala" }, { status: 503 });
  }

  const session = liveblocks.prepareSession(user.id, {
    userInfo: {
      name: perfil?.nombre ?? "Estudiante",
      avatar: perfil?.avatar_url ?? undefined,
      color: colorParaUsuario(user.id),
    },
  });
  session.allow(room, ["room:write"]);

  const { status, body } = await session.authorize();
  return new Response(body, { status });
}
