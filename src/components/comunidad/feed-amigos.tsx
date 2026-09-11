"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  TAMANIO_PAGINA,
  consultaFeedAmigos,
  mapearPublicacionFeed,
  type ConteosPublicacion,
  type PublicacionCardData,
} from "@/lib/comunidad/consultas";
import { Button } from "@/components/ui/button";
import { PublicacionCard } from "@/components/comunidad/publicacion-card";

type FeedAmigosProps = {
  publicacionesIniciales: PublicacionCardData[];
  hayMasIniciales: boolean;
  perfilId: string;
};

export function FeedAmigos({
  publicacionesIniciales,
  hayMasIniciales,
  perfilId,
}: FeedAmigosProps) {
  const [publicaciones, setPublicaciones] = useState(publicacionesIniciales);
  const [hayMas, setHayMas] = useState(hayMasIniciales);
  const [cargando, setCargando] = useState(false);

  async function cargarMas() {
    setCargando(true);
    const supabase = createClient();
    const from = publicaciones.length;
    const to = from + TAMANIO_PAGINA - 1;

    const { data } = await consultaFeedAmigos(supabase, perfilId, from, to);
    const filas = data ?? [];

    let conteosPorId = new Map<string, ConteosPublicacion>();
    if (filas.length > 0) {
      const { data: conteos } = await supabase.rpc("get_publicacion_counts", {
        publicacion_ids: filas.map((fila) => fila.id),
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

    setPublicaciones((actual) => [
      ...actual,
      ...filas.map((fila) => mapearPublicacionFeed(fila, conteosPorId)),
    ]);
    setHayMas(filas.length === TAMANIO_PAGINA);
    setCargando(false);
  }

  if (publicaciones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-2xl bg-muted/30">
        <p className="text-muted-foreground text-sm max-w-sm">
          Aún no hay publicaciones de tus amigos. ¡Invita a más personas a conectar contigo para ver su actividad aquí!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {publicaciones.map((publicacion, index) => (
          <PublicacionCard key={publicacion.id} {...publicacion} index={index} />
        ))}
      </div>

      {hayMas && (
        <Button
          type="button"
          variant="outline"
          onClick={cargarMas}
          loading={cargando}
          className="mx-auto"
        >
          Cargar más
        </Button>
      )}
    </div>
  );
}
