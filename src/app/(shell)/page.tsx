import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr";

import { createClient } from "@/lib/supabase/server";
import {
  TAMANIO_PAGINA,
  consultaFeedComunidad,
  consultaFeedAmigos,
  mapearPublicacionFeed,
  type ConteosPublicacion,
} from "@/lib/comunidad/consultas";
import { consultaCursos } from "@/lib/cursos/consultas";
import { HeroComunidad } from "@/components/comunidad/hero-comunidad";
import { FeedComunidad } from "@/components/comunidad/feed-comunidad";
import { FeedAmigos } from "@/components/comunidad/feed-amigos";
import { FiltrosComunidad } from "@/components/comunidad/filtros-comunidad";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function ComunidadPage(props: PageProps<"/">) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const searchParams = await props.searchParams;
  const carreraParam = Array.isArray(searchParams.carrera)
    ? searchParams.carrera[0]
    : searchParams.carrera;
  const cursoParam = Array.isArray(searchParams.curso)
    ? searchParams.curso[0]
    : searchParams.curso;
  const filtros = { carreraId: carreraParam, cursoId: cursoParam };

  const [{ data: filas }, { data: carreras }, cursos] = await Promise.all([
    consultaFeedComunidad(supabase, 0, TAMANIO_PAGINA - 1, filtros),
    supabase.from("carreras").select("id, nombre").order("nombre"),
    consultaCursos(supabase),
  ]);
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

  let publicacionesAmigos: any[] = [];
  let conteosAmigos = new Map<string, ConteosPublicacion>();
  if (user) {
    const { data } = await consultaFeedAmigos(supabase, user.id, 0, TAMANIO_PAGINA - 1);
    const filasAmigos = data ?? [];
    if (filasAmigos.length > 0) {
      const { data: conteos } = await supabase.rpc("get_publicacion_counts", {
        publicacion_ids: filasAmigos.map((fila: any) => fila.id),
      });
      conteosAmigos = new Map(
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
    publicacionesAmigos = filasAmigos;
  }

  const hayFiltroActivo = Boolean(filtros.carreraId || filtros.cursoId);

  const feedGlobalVacio = publicaciones.length === 0;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <HeroComunidad />
      <FiltrosComunidad carreras={carreras ?? []} cursos={cursos} />
      
      <div className="px-6 pb-8">
        {user ? (
          <Tabs defaultValue="amigos" className="w-full flex flex-col items-center">
            <TabsList className="mb-6 flex w-fit bg-muted/50 rounded-2xl p-1">
              <TabsTrigger value="amigos" className="rounded-xl px-6 font-medium">Mis Amigos</TabsTrigger>
              <TabsTrigger value="explorar" className="rounded-xl px-6 font-medium">Explorar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="amigos" className="w-full mt-0 focus-visible:outline-none">
              <FeedAmigos
                perfilId={user.id}
                publicacionesIniciales={publicacionesAmigos.map((fila) =>
                  mapearPublicacionFeed(fila, conteosAmigos),
                )}
                hayMasIniciales={publicacionesAmigos.length === TAMANIO_PAGINA}
              />
            </TabsContent>
            
            <TabsContent value="explorar" className="w-full mt-0 focus-visible:outline-none">
              {feedGlobalVacio ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
                  <div className="flex size-16 items-center justify-center rounded-2xl border border-dashed border-border bg-muted text-community">
                    <UsersThreeIcon className="size-7" aria-hidden />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {hayFiltroActivo
                      ? "Ningún apunte coincide con este filtro"
                      : "Todavía no hay apuntes en la comunidad"}
                  </h2>
                </div>
              ) : (
                <FeedComunidad
                  key={`${filtros.carreraId ?? ""}-${filtros.cursoId ?? ""}`}
                  publicacionesIniciales={publicaciones.map((fila) =>
                    mapearPublicacionFeed(fila, conteosPorId),
                  )}
                  hayMasIniciales={publicaciones.length === TAMANIO_PAGINA}
                  carreraId={filtros.carreraId}
                  cursoId={filtros.cursoId}
                />
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <>
            {feedGlobalVacio ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl border border-dashed border-border bg-muted text-community">
                  <UsersThreeIcon className="size-7" aria-hidden />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  {hayFiltroActivo
                    ? "Ningún apunte coincide con este filtro"
                    : "Todavía no hay apuntes en la comunidad"}
                </h2>
              </div>
            ) : (
              <FeedComunidad
                key={`${filtros.carreraId ?? ""}-${filtros.cursoId ?? ""}`}
                publicacionesIniciales={publicaciones.map((fila) =>
                  mapearPublicacionFeed(fila, conteosPorId),
                )}
                hayMasIniciales={publicaciones.length === TAMANIO_PAGINA}
                carreraId={filtros.carreraId}
                cursoId={filtros.cursoId}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
