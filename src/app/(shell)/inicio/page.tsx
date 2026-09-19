import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FolderSimpleIcon,
  NotePencilIcon,
} from "@phosphor-icons/react/dist/ssr";

import { createClient } from "@/lib/supabase/server";
import { tienePerfilIncompleto } from "@/lib/perfil/perfil-incompleto";
import { SeccionVacia } from "@/components/shared/seccion-vacia";
import { CursoRecienteCard } from "@/components/inicio/curso-reciente-card";
import { HorarioHoy } from "@/components/inicio/horario-hoy";
import {
  AccesosRapidos,
  AccionVerApuntes,
  AccionNuevoApunte,
} from "@/components/inicio/inicio-acciones";
import { ApunteTarjeta } from "@/components/apuntes/apunte-tarjeta";
import { PublicacionCard } from "@/components/comunidad/publicacion-card";
import {
  consultaFeedComunidad,
  mapearPublicacionFeed,
  type ConteosPublicacion,
} from "@/lib/comunidad/consultas";
import { consultaBloquesDe } from "@/lib/calendario/consultas";
import { obtenerDiaSemanaActual } from "@/lib/calendario/dia-semana-actual";
import { saludoPorHora } from "@/lib/fecha/saludo";

const SELECT_APUNTE =
  "id, titulo, extracto, carpeta_id, favorito, visibilidad, updated_at";

export default async function InicioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?login=1");
  }

  if (await tienePerfilIncompleto(supabase, user.id, user.email)) {
    redirect("/completar-perfil");
  }

  const [
    { data: perfil },
    { data: carpetas },
    { data: apuntes },
    { data: favoritosData },
    { data: bloquesData },
    { data: publicacionesData },
  ] = await Promise.all([
    supabase.from("profiles").select("nombre").eq("id", user.id).single(),
    // Sin .limit: a diferencia de la versión anterior, el mapa carpeta→color
    // necesita cubrir el 100% de las carpetas del usuario (lo usan
    // ApunteTarjeta/ApunteOpcionesMenu), no solo las 4 más recientes que se
    // muestran en "Cursos recientes".
    supabase
      .from("carpetas")
      .select("id, nombre, color, icono")
      .eq("propietario_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("apuntes")
      .select(SELECT_APUNTE)
      .eq("autor_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(9),
    supabase
      .from("apuntes")
      .select(SELECT_APUNTE)
      .eq("autor_id", user.id)
      .eq("favorito", true)
      .order("updated_at", { ascending: false })
      .limit(6),
    consultaBloquesDe(supabase, [user.id]),
    consultaFeedComunidad(supabase, 0, 2),
  ]);

  const primerNombre = perfil?.nombre?.split(" ")[0] ?? "";
  const cursos = carpetas ?? [];
  const cursosRecientes = cursos.slice(0, 4);
  const notas = apuntes ?? [];
  const [destacada, ...restoNotas] = notas;
  const favoritos = favoritosData ?? [];

  const diaHoy = obtenerDiaSemanaActual();
  const bloquesHoy = (bloquesData ?? []).filter(
    (bloque) => bloque.dia_semana === diaHoy,
  );

  const publicaciones = publicacionesData ?? [];
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
  const publicacionesFeed = publicaciones.map((fila) =>
    mapearPublicacionFeed(fila, conteosPorId),
  );

  const carpetaPorId: Record<string, { nombre: string; color: string }> =
    Object.fromEntries(
      cursos.map((curso) => [
        curso.id,
        { nombre: curso.nombre, color: curso.color },
      ]),
    );

  const sinNada = cursos.length === 0 && notas.length === 0;

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-foreground">
          {saludoPorHora()}, {primerNombre}
        </h1>
        <AccesosRapidos />
      </div>

      {sinNada ? (
        <SeccionVacia
          icon={NotePencilIcon}
          titulo="Todavía no tienes nada por aquí"
          descripcion="Crea tu primer curso y tu primer apunte para empezar a organizar tus notas."
          accion={<AccionVerApuntes />}
        />
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Cursos recientes
            </h2>
            {cursosRecientes.length === 0 ? (
              <SeccionVacia
                icon={FolderSimpleIcon}
                titulo="Todavía no tienes cursos"
                descripcion="Cuando crees una carpeta para organizar tus apuntes, aparece aquí."
                accion={<AccionVerApuntes />}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {cursosRecientes.map((curso, index) => (
                  <CursoRecienteCard
                    key={curso.id}
                    id={curso.id}
                    nombre={curso.nombre}
                    color={curso.color}
                    icono={curso.icono}
                    index={index}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Últimos apuntes
            </h2>
            {notas.length === 0 ? (
              <SeccionVacia
                icon={NotePencilIcon}
                titulo="Todavía no tienes apuntes"
                descripcion="Cuando crees tu primer apunte, aparece aquí."
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {destacada && (
                  <div className="col-span-2">
                    <ApunteTarjeta
                      id={destacada.id}
                      titulo={destacada.titulo}
                      extracto={destacada.extracto}
                      updatedAt={destacada.updated_at}
                      carpetaId={destacada.carpeta_id}
                      carpeta={
                        destacada.carpeta_id
                          ? (carpetaPorId[destacada.carpeta_id] ?? null)
                          : null
                      }
                      favorito={destacada.favorito}
                      visibilidad={destacada.visibilidad}
                      carpetas={cursos}
                      index={0}
                      destacado
                    />
                  </div>
                )}
                {restoNotas.map((apunte, index) => (
                  <ApunteTarjeta
                    key={apunte.id}
                    id={apunte.id}
                    titulo={apunte.titulo}
                    extracto={apunte.extracto}
                    updatedAt={apunte.updated_at}
                    carpetaId={apunte.carpeta_id}
                    carpeta={
                      apunte.carpeta_id
                        ? (carpetaPorId[apunte.carpeta_id] ?? null)
                        : null
                    }
                    favorito={apunte.favorito}
                    visibilidad={apunte.visibilidad}
                    carpetas={cursos}
                    index={index + 1}
                  />
                ))}
              </div>
            )}
          </section>

          {favoritos.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Favoritos
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {favoritos.map((apunte, index) => (
                  <ApunteTarjeta
                    key={apunte.id}
                    id={apunte.id}
                    titulo={apunte.titulo}
                    extracto={apunte.extracto}
                    updatedAt={apunte.updated_at}
                    carpetaId={apunte.carpeta_id}
                    carpeta={
                      apunte.carpeta_id
                        ? (carpetaPorId[apunte.carpeta_id] ?? null)
                        : null
                    }
                    favorito={apunte.favorito}
                    visibilidad={apunte.visibilidad}
                    carpetas={cursos}
                    index={index}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Hoy en tu horario
        </h2>
        <HorarioHoy bloques={bloquesHoy} />
      </section>

      {publicacionesFeed.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Comunidad
            </h2>
            <Link
              href="/comunidad"
              className="text-sm font-medium text-primary hover:underline"
            >
              Ver toda la comunidad
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {publicacionesFeed.map((publicacion, index) => (
              <PublicacionCard key={publicacion.id} {...publicacion} index={index} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
