"use client";

import { useState, useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import {
  TAMANIO_PAGINA,
  consultaFeedComunidad,
  mapearPublicacionFeed,
  type ConteosPublicacion,
  type PublicacionCardData,
} from "@/lib/comunidad/consultas";
import { Button } from "@/components/ui/button";
import { PublicacionCard } from "@/components/comunidad/publicacion-card";
import { SugerenciasCarrusel } from "@/components/amigos/sugerencias-carrusel";

type FeedComunidadProps = {
  publicacionesIniciales: PublicacionCardData[];
  hayMasIniciales: boolean;
  carreraId?: string;
  cursoId?: string;
};

export function FeedComunidad({
  publicacionesIniciales,
  hayMasIniciales,
  carreraId,
  cursoId,
}: FeedComunidadProps) {
  const [publicaciones, setPublicaciones] = useState(publicacionesIniciales);
  const [hayMas, setHayMas] = useState(hayMasIniciales);
  const [cargando, setCargando] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    async function checkUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setMyId(user.id);
    }
    checkUser();
  }, []);

  async function cargarMas() {
    setCargando(true);
    const supabase = createClient();
    const from = publicaciones.length;
    const to = from + TAMANIO_PAGINA - 1;

    const { data } = await consultaFeedComunidad(supabase, from, to, {
      carreraId,
      cursoId,
    });
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {publicaciones.map((publicacion, index) => (
          <div key={publicacion.id} className="flex flex-col gap-3">
            <PublicacionCard {...publicacion} index={index} />
            {index === 2 && myId && (
              <div className="my-4 -mx-6 md:mx-0">
                <div className="px-6 md:px-0">
                  <SugerenciasCarrusel myId={myId} />
                </div>
              </div>
            )}
          </div>
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
