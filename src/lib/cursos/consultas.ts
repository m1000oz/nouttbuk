import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database.types";

export type CursoConCarrera = {
  id: string;
  nombre: string;
  carreraNombre: string;
};

// Catálogo de cursos (solo existen para un subconjunto de carreras, ver la
// migración 20260823090000), usado por el selector de curso del editor y por
// el filtro de Comunidad. `carreraId` acota el catálogo a una sola carrera
// (el editor lo usa así: un apunte solo debe poder etiquetarse con un curso
// de la propia carrera del autor); se omite para el filtro de Comunidad, que
// sí necesita ver el catálogo completo. Se ordena por carrera y luego por
// curso para que un <Select> agrupado visualmente tenga sentido sin lógica
// adicional en el cliente.
export async function consultaCursos(
  supabase: SupabaseClient<Database>,
  carreraId?: string | null,
): Promise<CursoConCarrera[]> {
  let consulta = supabase
    .from("cursos")
    .select("id, nombre, carrera:carreras(nombre)")
    .order("nombre", { referencedTable: "carreras" })
    .order("nombre");

  if (carreraId) {
    consulta = consulta.eq("carrera_id", carreraId);
  }

  const { data } = await consulta;

  return (data ?? []).map((fila) => ({
    id: fila.id,
    nombre: fila.nombre,
    carreraNombre: fila.carrera?.nombre ?? "",
  }));
}
