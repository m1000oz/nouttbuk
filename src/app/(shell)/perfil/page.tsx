import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { NotePencilIcon } from "@phosphor-icons/react/dist/ssr";

import { createClient } from "@/lib/supabase/server";
import { esPerfilIncompleto } from "@/lib/perfil/usuario-autogenerado";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { SeccionVacia } from "@/components/shared/seccion-vacia";
import { NuevoApunteButton } from "@/components/nav/fab-nuevo-apunte";
import { PublicacionCard } from "@/components/comunidad/publicacion-card";
import { PerfilStats } from "@/components/perfil/perfil-stats";
import { EditarPerfilSheet } from "@/components/perfil/editar-perfil-sheet";
import { FeedbackBoton } from "@/components/perfil/feedback-boton";
import { CvBoton } from "@/components/perfil/cv-boton";
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
          "nombre, usuario, carrera_id, carrera:carreras(nombre), universidad, avatar_url, usuario_actualizado_en, carrera_actualizada_en",
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

  const perfilIncompleto = esPerfilIncompleto(
    { nombre: perfil?.nombre, usuario: perfil?.usuario },
    user.email,
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 md:px-6 py-6 md:py-10">
      {perfilIncompleto && (
        <p className="rounded-lg border border-dashed border-border bg-muted/50 px-3 py-2 text-center text-sm text-muted-foreground">
          Te registraste con Google. Revisa tu nombre, tu usuario y tu
          carrera en &quot;Editar perfil&quot;.
        </p>
      )}

      <div className="relative w-full h-32 md:h-48 rounded-t-2xl md:rounded-2xl bg-muted shadow-xs overflow-hidden">
        <Image
          src="/pandatomic_banner_v2.jpg"
          alt="Banner de perfil"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/5 mix-blend-overlay pointer-events-none" aria-hidden />
      </div>

      <div className="relative -mt-20 md:-mt-24 flex flex-col gap-4 px-2 md:px-4">
        <div className="flex items-end justify-between">
          <Avatar size="3xl" className="border-4 border-background bg-background shadow-xs ring-1 ring-border/50">
            {perfil?.avatar_url && <AvatarImage src={perfil.avatar_url} alt="" />}
            <AvatarFallback>{iniciales(perfil?.nombre)}</AvatarFallback>
          </Avatar>
          
          {perfil && (
            <div className="mb-2">
              <EditarPerfilSheet
                perfilId={user.id}
                perfil={{
                  nombre: perfil.nombre,
                  usuario: perfil.usuario,
                  carreraId: perfil.carrera_id,
                  avatarUrl: perfil.avatar_url,
                  usuarioActualizadoEn: perfil.usuario_actualizado_en,
                  carreraActualizadaEn: perfil.carrera_actualizada_en,
                }}
                carreras={carreras ?? []}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {perfil?.nombre ?? "Tu perfil"}
          </h1>
          {perfil?.usuario && (
            <p className="text-lg font-medium text-muted-foreground">@{perfil.usuario}</p>
          )}
        </div>

        {(perfil?.carrera?.nombre || perfil?.universidad) && (
          <div className="flex flex-col gap-0.5 pt-2">
            {perfil?.carrera?.nombre && (
              <p className="text-base font-medium text-foreground">{perfil.carrera.nombre}</p>
            )}
            {perfil?.universidad && (
              <p className="text-base text-muted-foreground">{perfil.universidad}</p>
            )}
          </div>
        )}
      </div>

      <PerfilStats
        apuntes={stats?.apuntes ?? 0}
        aportes={stats?.aportes ?? 0}
        contactos={stats?.contactos ?? 0}
      />

      <div className="flex flex-col gap-3 mt-4">
        <CvBoton />
        <FeedbackBoton />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Apuntes públicos
        </h2>
        {tarjetas.length === 0 ? (
          <SeccionVacia
            icon={NotePencilIcon}
            titulo="Todavía no tienes apuntes públicos"
            descripcion="Publica un apunte con visibilidad Comunidad para que aparezca aquí."
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

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Link href="/terminos" className="underline hover:text-foreground">
          Términos de uso
        </Link>
        <span className="h-3 w-px bg-border" aria-hidden />
        <Link href="/privacidad" className="underline hover:text-foreground">
          Política de privacidad
        </Link>
        <span className="h-3 w-px bg-border" aria-hidden />
        <Link href="/creditos" className="underline hover:text-foreground">
          Créditos
        </Link>
      </div>
    </div>
  );
}
