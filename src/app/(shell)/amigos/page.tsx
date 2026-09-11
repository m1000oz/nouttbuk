import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AmigosView } from "@/components/amigos/amigos-view";
import { SugerenciasCarrusel } from "@/components/amigos/sugerencias-carrusel";

export default async function AmigosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?login=1");
  }

  const [{ data: amigos }, { data: solicitudes }] = await Promise.all([
    supabase.rpc("obtener_amigos", { perfil_id: user.id }),
    supabase.rpc("obtener_solicitudes_pendientes", { perfil_id: user.id }),
  ]);

  return (
    <div className="flex-1 flex flex-col items-center p-4 md:p-6 lg:p-8 overflow-hidden">
      <div className="w-full max-w-3xl flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Amigos
          </h1>
          <p className="text-muted-foreground mt-2">
            Encuentra amigos para compartir horarios, metas y apuntes.
          </p>
        </div>

        <SugerenciasCarrusel myId={user.id} />

        <AmigosView
          myId={user.id}
          amigosIniciales={(amigos as any[])?.map((a) => ({
            id: a.id,
            nombre: a.nombre,
            usuario: a.usuario,
            avatar_url: a.avatar_url,
          })) ?? []}
          solicitudesIniciales={(solicitudes as any[])?.map((s) => ({
            id: s.id,
            nombre: s.nombre,
            usuario: s.usuario,
            avatar_url: s.avatar_url,
          })) ?? []}
        />
      </div>
    </div>
  );
}
