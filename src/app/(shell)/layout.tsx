import type { ReactNode } from "react";

import { createClient } from "@/lib/supabase/server";
import { AppShell, type ShellSession } from "@/components/nav/app-shell";

export default async function ShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let session: ShellSession = null;
  if (user) {
    const { data: perfil } = await supabase
      .from("profiles")
      .select("nombre, usuario, avatar_url, universidad, carrera:carreras(nombre)")
      .eq("id", user.id)
      .single();

    const carreraNombre = perfil?.carrera
      ? (Array.isArray(perfil.carrera)
          ? (perfil.carrera[0] as { nombre: string })?.nombre
          : (perfil.carrera as { nombre: string }).nombre)
      : null;

    session = {
      id: user.id,
      perfil: perfil
        ? {
            nombre: perfil.nombre,
            usuario: perfil.usuario,
            avatar_url: perfil.avatar_url,
            universidad: perfil.universidad ?? "PUCP",
            carrera: carreraNombre,
          }
        : null,
    };
  }

  return <AppShell session={session}>{children}</AppShell>;
}
