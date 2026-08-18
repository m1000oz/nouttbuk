import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SignOutButton } from "@/components/auth/sign-out-button";

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

  const { data: perfil } = await supabase
    .from("profiles")
    .select("nombre, usuario, carrera, universidad")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-4 px-6 py-16 text-center">
      <Avatar size="lg">
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
      {perfil?.carrera && (
        <p className="text-sm text-foreground">{perfil.carrera}</p>
      )}
      {perfil?.universidad && (
        <p className="text-sm text-muted-foreground">{perfil.universidad}</p>
      )}
      <p className="max-w-sm text-sm text-muted-foreground">
        El resumen de tus contribuciones va a aparecer aquí. Próximamente.
      </p>
      <SignOutButton className="mt-4" />
    </div>
  );
}
