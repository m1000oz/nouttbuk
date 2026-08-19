import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database.types";
import { extraerTextoPlano } from "@/lib/tiptap/extraer-texto-plano";

export const TAMANIO_PAGINA = 12;

// Compartida entre el render inicial (Server Component) y "Cargar más"
// (Client Component) para que ambas páginas del feed tengan exactamente la
// misma forma de consulta.
export function consultaFeedComunidad(
  supabase: SupabaseClient<Database>,
  from: number,
  to: number,
) {
  return supabase
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
    .order("created_at", { ascending: false })
    .range(from, to);
}

// Las publicaciones community de un usuario, para la sección "Apuntes
// públicos" de Perfil. Misma forma que consultaFeedComunidad (comparten
// PublicacionFeedRow y mapearPublicacionFeed), sin paginación: es un resumen
// dentro de Perfil, no una vista dedicada, un rango generoso alcanza.
export function consultaPublicacionesDeUsuario(
  supabase: SupabaseClient<Database>,
  perfilId: string,
) {
  return supabase
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
    .eq("apunte.autor_id", perfilId)
    .order("created_at", { ascending: false })
    .range(0, 49);
}

export type PublicacionFeedRow = NonNullable<
  Awaited<ReturnType<typeof consultaFeedComunidad>>["data"]
>[number];

export type ConteosPublicacion = {
  reacciones: number;
  guardados: number;
  comentarios: number;
};

export type PublicacionCardData = {
  id: string;
  titulo: string;
  extracto: string;
  createdAt: string;
  autor: { nombre: string; usuario: string; avatarUrl: string | null };
  conteos: ConteosPublicacion;
};

const CONTEOS_VACIOS: ConteosPublicacion = {
  reacciones: 0,
  guardados: 0,
  comentarios: 0,
};

// Combina una fila del feed con sus conteos agregados (traídos aparte vía
// get_publicacion_counts) en la forma plana que consumen las tarjetas.
export function mapearPublicacionFeed(
  fila: PublicacionFeedRow,
  conteosPorId: Map<string, ConteosPublicacion>,
): PublicacionCardData {
  return {
    id: fila.id,
    titulo: fila.apunte.titulo,
    extracto: extraerTextoPlano(fila.apunte.contenido),
    createdAt: fila.apunte.created_at,
    autor: {
      nombre: fila.apunte.autor?.nombre ?? "Alguien de la comunidad",
      usuario: fila.apunte.autor?.usuario ?? "",
      avatarUrl: fila.apunte.autor?.avatar_url ?? null,
    },
    conteos: conteosPorId.get(fila.id) ?? CONTEOS_VACIOS,
  };
}
