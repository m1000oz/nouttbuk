import { redirect } from "next/navigation";
import { NotePencilIcon } from "@phosphor-icons/react/dist/ssr";

import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { SeccionVacia } from "@/components/shared/seccion-vacia";
import { NuevoApunteButton } from "@/components/nav/fab-nuevo-apunte";
import { PublicacionCard } from "@/components/comunidad/publicacion-card";
import { PerfilStats } from "@/components/perfil/perfil-stats";
import { EditarPerfilSheet } from "@/components/perfil/editar-perfil-sheet";
import { FeedbackBoton } from "@/components/perfil/feedback-boton";
import {
  consultaPublicacionesDeUsuario,
  mapearPublicacionFeed,
  type ConteosPublicacion,
} from "@/lib/comunidad/consultas";

function iniciales(nombre: string | null | undefined): string {
  if (!nombre) return "?";
  return nombre
    .trim()
    .split(/\s+/)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?login=1");
  }

  const [{ data: perfil }, { data: stats }, { data: publicaciones }, { data: carreras }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "nombre, usuario, carrera_id, carrera:carreras(nombre), universidad, avatar_url, usuario_actualizado_en",
        )
        .eq("id", user.id)
        .single(),
      supabase.rpc("get_perfil_stats").single(),
      consultaPublicacionesDeUsuario(supabase, user.id),
      supabase.from("carreras").select("id, nombre").order("nombre"),
    ]);

  const filas = publicaciones ?? [];
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

  const tarjetas = filas.map((fila) => mapearPublicacionFeed(fila, conteosPorId));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <Avatar size="lg">
          {perfil?.avatar_url && <AvatarImage src={perfil.avatar_url} alt="" />}
          <AvatarFallback>{iniciales(perfil?.nombre)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {perfil?.nombre ?? "Tu perfil"}
          </h1>
          {perfil?.usuario && (
            <p className="text-sm text-muted-foreground">@{perfil.usuario}</p>
          )}
        </div>
        {perfil?.carrera?.nombre && (
          <p className="text-sm text-foreground">{perfil.carrera.nombre}</p>
        )}
        {perfil?.universidad && (
          <p className="text-sm text-muted-foreground">{perfil.universidad}</p>
        )}
        {perfil && (
          <EditarPerfilSheet
            perfilId={user.id}
            perfil={{
              nombre: perfil.nombre,
              usuario: perfil.usuario,
              carreraId: perfil.carrera_id,
              avatarUrl: perfil.avatar_url,
              usuarioActualizadoEn: perfil.usuario_actualizado_en,
            }}
            carreras={carreras ?? []}
          />
        )}
      </div>

      <PerfilStats
        apuntes={stats?.apuntes ?? 0}
        aportes={stats?.aportes ?? 0}
        contactos={stats?.contactos ?? 0}
      />

      <FeedbackBoton />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Apuntes públicos
        </h2>
        {tarjetas.length === 0 ? (
          <SeccionVacia
            icon={NotePencilIcon}
            titulo="Todavía no tienes apuntes públicos"
            descripcion="Publica un apunte con visibilidad Comunidad para que aparezca aquí."
            accion={<NuevoApunteButton variant="sidebar" />}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {tarjetas.map((tarjeta, index) => (
              <PublicacionCard key={tarjeta.id} {...tarjeta} index={index} />
            ))}
          </div>
        )}
      </section>

      <SignOutButton className="self-center" />
    </div>
  );
}
