import { redirect } from "next/navigation";
import {
  FolderSimpleIcon,
  NotePencilIcon,
} from "@phosphor-icons/react/dist/ssr";

import { createClient } from "@/lib/supabase/server";
import { SeccionVacia } from "@/components/shared/seccion-vacia";
import { MateriaRecienteCard } from "@/components/inicio/materia-reciente-card";
import { ApunteRecienteCard } from "@/components/inicio/apunte-reciente-card";
import {
  AccesosRapidos,
  AccionVerApuntes,
  AccionNuevoApunte,
} from "@/components/inicio/inicio-acciones";

export default async function InicioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?login=1");
  }

  const [{ data: perfil }, { data: carpetas }, { data: apuntes }] =
    await Promise.all([
      supabase.from("profiles").select("nombre").eq("id", user.id).single(),
      supabase
        .from("carpetas")
        .select("id, nombre, color, icono")
        .eq("propietario_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(4),
      supabase
        .from("apuntes")
        .select("id, titulo, carpeta_id, favorito, visibilidad, updated_at")
        .eq("autor_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(5),
    ]);

  const primerNombre = perfil?.nombre?.split(" ")[0] ?? "";
  const materias = carpetas ?? [];
  const notas = apuntes ?? [];

  // Solo cubre carpetas que también sean "recientes"; es una limitación
  // honesta, no vale la pena una segunda query sin límite solo para esto.
  const nombreCarpetaPorId = new Map(
    materias.map((materia) => [materia.id, { nombre: materia.nombre }]),
  );

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-foreground">
          Hola, {primerNombre}
        </h1>
        <AccesosRapidos />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Materias recientes
        </h2>
        {materias.length === 0 ? (
          <SeccionVacia
            icon={FolderSimpleIcon}
            titulo="Todavía no tienes materias"
            descripcion="Cuando crees una carpeta para organizar tus apuntes, aparece aquí."
            accion={<AccionVerApuntes />}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {materias.map((materia, index) => (
              <MateriaRecienteCard
                key={materia.id}
                id={materia.id}
                nombre={materia.nombre}
                color={materia.color}
                icono={materia.icono}
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
            accion={<AccionNuevoApunte />}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {notas.map((apunte, index) => (
              <ApunteRecienteCard
                key={apunte.id}
                id={apunte.id}
                titulo={apunte.titulo}
                updatedAt={apunte.updated_at}
                carpeta={
                  apunte.carpeta_id
                    ? (nombreCarpetaPorId.get(apunte.carpeta_id) ?? null)
                    : null
                }
                index={index}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
