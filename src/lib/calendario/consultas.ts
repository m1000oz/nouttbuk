import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database.types";

// Días de la semana académica: 0 = lunes ... 6 = domingo (no ISO, no
// Date.getDay() de JS, ver la migración 20260904140544_calendario.sql).
export const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

export function consultaBloquesDe(
  supabase: SupabaseClient<Database>,
  perfilIds: string[],
) {
  return supabase
    .from("bloques_horario")
    .select("id, perfil_id, titulo, dia_semana, hora_inicio, hora_fin, color")
    .in("perfil_id", perfilIds)
    .order("dia_semana", { ascending: true })
    .order("hora_inicio", { ascending: true });
}

export type BloqueHorario = NonNullable<
  Awaited<ReturnType<typeof consultaBloquesDe>>["data"]
>[number];

// Quién comparte SU calendario CONMIGO (colaborador_id = yo): candidatos
// para agregar a la vista de cruce de horarios.
export function consultaCalendariosCompartidosConmigo(
  supabase: SupabaseClient<Database>,
  perfilId: string,
) {
  return supabase
    .from("calendario_colaboradores")
    .select(
      "propietario_id, propietario:profiles!calendario_colaboradores_propietario_id_fkey(id, nombre, usuario, avatar_url)",
    )
    .eq("colaborador_id", perfilId)
    .order("created_at", { ascending: true });
}

// Con quién comparto YO mi calendario (propietario_id = yo): para el sheet
// de "Compartir mi calendario", mismo listado que compartir-sheet.tsx usa
// para colaboradores de un apunte.
export function consultaConQuienComparto(
  supabase: SupabaseClient<Database>,
  perfilId: string,
) {
  return supabase
    .from("calendario_colaboradores")
    .select(
      "colaborador_id, colaborador:profiles!calendario_colaboradores_colaborador_id_fkey(id, nombre, usuario, avatar_url)",
    )
    .eq("propietario_id", perfilId)
    .order("created_at", { ascending: true });
}

export type CalendarioCompartidoConmigoRow = NonNullable<
  Awaited<ReturnType<typeof consultaCalendariosCompartidosConmigo>>["data"]
>[number];

export type ConQuienComparoRow = NonNullable<
  Awaited<ReturnType<typeof consultaConQuienComparto>>["data"]
>[number];
