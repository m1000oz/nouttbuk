import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  esNombreAutogenerado,
  esPerfilIncompleto,
  esUsuarioAutogenerado,
} from "@/lib/perfil/usuario-autogenerado";
import { CompletarPerfilForm } from "@/components/perfil/completar-perfil-form";

export const metadata = {
  title: "Completa tu perfil, Nouttbuk",
};

export default async function CompletarPerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?login=1");
  }

  const [{ data: perfil }, { data: carreras }] = await Promise.all([
    supabase.from("profiles").select("nombre, usuario").eq("id", user.id).single(),
    supabase.from("carreras").select("id, nombre").order("nombre"),
  ]);

  // Un signup por correo/contraseña ya completa nombre/usuario en el
  // formulario de registro, así que solo un signup vía Google puede caer
  // acá; si el perfil ya está completo (o alguien vuelve a visitar esta
  // ruta después de arreglarlo), no hay nada que forzar. `esPerfilIncompleto`
  // cubre dos casos, no solo uno: el usuario sigue con el patrón
  // autogenerado, o el nombre sigue siendo literalmente la parte local del
  // correo (caso real encontrado en producción: alguien cambió su usuario
  // por el flujo viejo de "Editar perfil" pero nunca tocó el nombre).
  if (!esPerfilIncompleto({ nombre: perfil?.nombre, usuario: perfil?.usuario }, user.email)) {
    redirect("/perfil");
  }

  // Si el usuario ya es válido (el caso "solo falta el nombre"), se
  // precarga tal cual: la persona no debería tener que elegir uno nuevo solo
  // porque su nombre quedó sin arreglar. El nombre, en cambio, NUNCA se
  // precarga con el valor autogenerado: si se dejara ahí, alguien podría
  // apretar "Guardar" sin darse cuenta de que no cambió nada, y volvería a
  // caer en esta misma pantalla en su siguiente visita, pareciendo un loop.
  const usuarioYaValido = !esUsuarioAutogenerado(perfil?.usuario);
  const nombreYaValido = !esNombreAutogenerado(perfil?.nombre, user.email);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-10">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Completa tu perfil
        </h1>
        <p className="text-sm text-muted-foreground">
          Te registraste con Google, así que confirma tu nombre y tu usuario
          antes de continuar.
        </p>
      </div>
      <CompletarPerfilForm
        perfilId={user.id}
        nombreInicial={nombreYaValido ? (perfil?.nombre ?? "") : ""}
        usuarioInicial={usuarioYaValido ? (perfil?.usuario ?? "") : ""}
        carreras={carreras ?? []}
      />
    </div>
  );
}
