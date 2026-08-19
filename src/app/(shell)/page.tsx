import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr";

import { createClient } from "@/lib/supabase/server";
import {
  TAMANIO_PAGINA,
  consultaFeedComunidad,
  mapearPublicacionFeed,
  type ConteosPublicacion,
} from "@/lib/comunidad/consultas";
import { HeroComunidad } from "@/components/comunidad/hero-comunidad";
import { FeedComunidad } from "@/components/comunidad/feed-comunidad";

export default async function ComunidadPage() {
  const supabase = await createClient();
  const { data: filas } = await consultaFeedComunidad(
    supabase,
    0,
    TAMANIO_PAGINA - 1,
  );
  const publicaciones = filas ?? [];

  let conteosPorId = new Map<string, ConteosPublicacion>();
  if (publicaciones.length > 0) {
    const { data: conteos } = await supabase.rpc("get_publicacion_counts", {
      publicacion_ids: publicaciones.map((fila) => fila.id),
    });
    conteosPorId = new Map(
      (conteos ?? []).map((fila) => [
        fila.publicacion_id,
        {
          reacciones: fila.reacciones,
          guardados: fila.guardados,
          comentarios: fila.comentarios,
        },
      ]),
    );
  }

  if (publicaciones.length === 0) {
    return (
      <div className="flex flex-1 flex-col">
        <HeroComunidad />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl border border-dashed border-border bg-muted text-community">
            <UsersThreeIcon className="size-7" aria-hidden />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Todavía no hay apuntes en la comunidad
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Cuando alguien publique un apunte como comunidad, aparece aquí,
            visible para cualquier persona, sin necesidad de iniciar sesión.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <HeroComunidad />
      <div className="px-6 pb-8">
        <FeedComunidad
          publicacionesIniciales={publicaciones.map((fila) =>
            mapearPublicacionFeed(fila, conteosPorId),
          )}
          hayMasIniciales={publicaciones.length === TAMANIO_PAGINA}
        />
      </div>
    </div>
  );
}
