import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database.types";
import { esPerfilIncompleto } from "@/lib/perfil/usuario-autogenerado";

export async function tienePerfilIncompleto(
  supabase: SupabaseClient<Database>,
  userId: string,
  email: string | null | undefined,
): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("nombre, usuario")
    .eq("id", userId)
    .single();
  return esPerfilIncompleto({ nombre: data?.nombre, usuario: data?.usuario }, email);
}
