import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database.types";

export type CursoConCarrera = {
  id: string;
  nombre: string;
  carreraNombre: string;
};

// Catálogo completo de cursos (solo existen para un subconjunto de carreras,
// ver la migración 20260823090000), usado por el selector de curso del
// editor y por el filtro de Comunidad. Se ordena por carrera y luego por
// curso para que un <Select> agrupado visualmente tenga sentido sin lógica
// adicional en el cliente.
export async function consultaCursos(
  supabase: SupabaseClient<Database>,
): Promise<CursoConCarrera[]> {
  const { data } = await supabase
    .from("cursos")
    .select("id, nombre, carrera:carreras(nombre)")
    .order("nombre", { referencedTable: "carreras" })
    .order("nombre");

  return (data ?? []).map((fila) => ({
    id: fila.id,
    nombre: fila.nombre,
    carreraNombre: fila.carrera?.nombre ?? "",
  }));
}
