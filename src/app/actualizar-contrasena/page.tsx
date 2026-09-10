import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ActualizarContrasenaForm } from "@/components/auth/actualizar-contrasena-form";

export const metadata = {
  title: "Actualiza tu contraseña, Nouttbuk",
};

export default async function ActualizarContrasenaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sin sesión no hay nada que actualizar: el enlace de recuperación ya
  // expiró, ya se usó, o alguien llegó acá directo sin pasar por
  // /auth/callback?next=/actualizar-contrasena.
  if (!user) {
    redirect("/?login=1");
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-10">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Actualiza tu contraseña
        </h1>
        <p className="text-sm text-muted-foreground">
          Elige una contraseña nueva para tu cuenta.
        </p>
      </div>
      <ActualizarContrasenaForm />
    </div>
  );
}
