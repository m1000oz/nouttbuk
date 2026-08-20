import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database.types";

export function consultaColaboradores(
  supabase: SupabaseClient<Database>,
  apunteId: string,
) {
  return supabase
    .from("colaboradores")
    .select(
      `
      apunte_id,
      perfil_id,
      permiso,
      perfil:profiles!colaboradores_perfil_id_fkey(id, nombre, usuario, avatar_url)
    `,
    )
    .eq("apunte_id", apunteId)
    .order("created_at", { ascending: true });
}

export type ColaboradorRow = NonNullable<
  Awaited<ReturnType<typeof consultaColaboradores>>["data"]
>[number];

export function buscarPerfilPorUsuario(
  supabase: SupabaseClient<Database>,
  usuario: string,
) {
  return supabase
    .from("profiles")
    .select("id, nombre, usuario, avatar_url")
    .eq("usuario", usuario)
    .maybeSingle();
}
