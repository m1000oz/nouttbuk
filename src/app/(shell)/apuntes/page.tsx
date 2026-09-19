import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, FolderIcon, FolderSimpleIcon } from "@phosphor-icons/react/dist/ssr";

import { createClient } from "@/lib/supabase/server";
import { tienePerfilIncompleto } from "@/lib/perfil/perfil-incompleto";
import { SeccionVacia } from "@/components/shared/seccion-vacia";
import { CursoRecienteCard } from "@/components/inicio/curso-reciente-card";
import { CarpetaSheet } from "@/components/apuntes/carpeta-sheet";
import { ApuntesExplorer } from "@/components/apuntes/apuntes-explorer";
import { resolverColorCarpeta } from "@/lib/carpetas/colores";

const SELECT_APUNTE =
  "id, titulo, extracto, carpeta_id, favorito, visibilidad, updated_at, enlace_token, enlace_permiso";
const SELECT_APUNTE_COMPARTIDO = `${SELECT_APUNTE}, autor:profiles!apuntes_autor_id_fkey(nombre)`;

export default async function MisApuntesPage(props: PageProps<"/apuntes">) {
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

  const searchParams = await props.searchParams;
  const carpetaIdParam = Array.isArray(searchParams.carpeta)
    ? searchParams.carpeta[0]
    : searchParams.carpeta;

  const [{ data: carpetas }, { data: apuntes }, { data: colaboraciones }] =
    await Promise.all([
      supabase
        .from("carpetas")
        .select("id, nombre, color, icono")
        .eq("propietario_id", user.id)
        .order("nombre", { ascending: true }),
      supabase
        .from("apuntes")
        .select(SELECT_APUNTE)
        .eq("autor_id", user.id)
        .order("updated_at", { ascending: false }),
      supabase.from("colaboradores").select("apunte_id").eq("perfil_id", user.id),
    ]);

  const cursos = carpetas ?? [];
  const notas = apuntes ?? [];

  const apunteIdsCompartidos = (colaboraciones ?? []).map((c) => c.apunte_id);
  const { data: apuntesCompartidos } =
    apunteIdsCompartidos.length > 0
      ? await supabase
          .from("apuntes")
          .select(SELECT_APUNTE_COMPARTIDO)
          .in("id", apunteIdsCompartidos)
      : { data: [] };
  const compartidos = apuntesCompartidos ?? [];

  // Si el id no corresponde a ninguna carpeta del usuario (por ejemplo, un
  // link viejo a una carpeta ya borrada), se ignora el filtro en vez de
  // mostrar un error, y la página se comporta como si no tuviera ?carpeta=.
  const carpetaActiva = carpetaIdParam
    ? cursos.find((curso) => curso.id === carpetaIdParam)
    : undefined;

  const notasVisibles = carpetaActiva
    ? notas.filter((apunte) => apunte.carpeta_id === carpetaActiva.id)
    : notas;

  // A diferencia de Inicio (que solo trae las 4 carpetas más recientes),
  // esta página ya carga todas las carpetas del usuario, así que el mapa
  // cubre el 100% de los apuntes con carpeta, sin la limitación parcial de
  // la versión de Inicio. Objeto plano (no Map) porque cruza el límite
  // Server → Client Component como prop de ApuntesExplorer.
  const nombreCarpetaPorId: Record<string, { nombre: string; color: string }> =
    Object.fromEntries(
      cursos.map((curso) => [
        curso.id,
        { nombre: curso.nombre, color: curso.color },
      ]),
    );

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:gap-8 md:px-6 md:py-8 min-w-0">
      <div className="flex items-center justify-between gap-4">
        {carpetaActiva ? (
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/apuntes"
              aria-label="Volver a Mis apuntes"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ArrowLeftIcon className="size-5" aria-hidden />
            </Link>
            <FolderIcon
              weight="fill"
              className="size-6 shrink-0"
              style={{ color: resolverColorCarpeta(carpetaActiva.color) }}
              aria-hidden
            />
            <h1 className="truncate text-2xl font-bold text-foreground">
              {carpetaActiva.nombre}
            </h1>
          </div>
        ) : (
          <h1 className="text-2xl font-bold text-foreground">Mis apuntes</h1>
        )}
        {/* key fuerza un remount al cambiar entre "nueva" y "editar
            carpeta X": sin esto, una navegación cliente entre ?carpeta=
            distintos reutiliza la misma instancia y el useState interno
            del sheet se queda con el nombre/color de la primera carga. */}
        <CarpetaSheet
          key={carpetaActiva?.id ?? "nueva"}
          carpeta={carpetaActiva}
        />
      </div>

      {!carpetaActiva && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Carpetas
          </h2>
          {cursos.length === 0 ? (
            <SeccionVacia
              icon={FolderSimpleIcon}
              titulo="Todavía no tienes carpetas"
              descripcion="Crea una carpeta para organizar tus apuntes por curso."
              accion={<CarpetaSheet />}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {cursos.map((curso, index) => (
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
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {carpetaActiva ? "Apuntes en esta carpeta" : "Apuntes"}
        </h2>
        <ApuntesExplorer
          notas={notasVisibles.map((apunte) => ({
            id: apunte.id,
            titulo: apunte.titulo,
            extracto: apunte.extracto,
            updatedAt: apunte.updated_at,
            carpetaId: apunte.carpeta_id,
            favorito: apunte.favorito,
            visibilidad: apunte.visibilidad,
            enlaceToken: apunte.enlace_token,
            enlacePermiso: apunte.enlace_permiso,
          }))}
          compartidos={compartidos.map((apunte) => ({
            id: apunte.id,
            titulo: apunte.titulo,
            extracto: apunte.extracto,
            updatedAt: apunte.updated_at,
            carpetaId: apunte.carpeta_id,
            favorito: apunte.favorito,
            visibilidad: apunte.visibilidad,
            propietario: apunte.autor?.nombre,
          }))}
          carpetaPorId={nombreCarpetaPorId}
          carpetas={cursos}
          carpetaActivaId={carpetaActiva?.id}
        />
      </section>
    </div>
  );
}
