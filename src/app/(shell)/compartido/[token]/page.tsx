import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ApunteCompartidoView } from "@/components/apuntes/apunte-compartido-view";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Sin redirect de auth, mismo contrato que /comunidad/[id]: esta ruta debe
// funcionar también para anon, es justamente el punto del enlace público.
// A diferencia de /comunidad/[id] (filtrado por RLS vía visibilidad), acá el
// único filtro es conocer el enlace_token, resuelto vía la RPC
// obtener_apunte_compartido (security definer, ver su migración) para un
// visitante anónimo.
//
// Un visitante CON sesión, en cambio, no se queda en esta vista de solo
// lectura: unirse_por_enlace (security definer, ver su migración) lo une
// como colaborador real (permiso Lector o Editor según el enlace, sube
// visibilidad de 'private' a 'group' si hace falta) y se lo redirige al
// editor real, donde ya entra con el acceso que le corresponde (soloLectura
// se calcula ahí mismo a partir de permisoActual). Esto incluye al propio
// dueño abriendo su propio enlace: unirse_por_enlace es un no-op para él,
// pero igual lo manda al editor en vez de mostrarle la vista pública de su
// propia nota.
export default async function CompartidoPage(
  props: PageProps<"/compartido/[token]">,
) {
  const { token } = await props.params;

  if (!UUID_REGEX.test(token)) {
    notFound();
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: union } = await supabase.rpc("unirse_por_enlace", {
      p_token: token,
    });
    const apunteId = union?.[0]?.apunte_id_resultado;

    if (!apunteId) {
      notFound();
    }

    redirect(`/apuntes/${apunteId}/editar`);
  }

  const { data } = await supabase.rpc("obtener_apunte_compartido", {
    p_token: token,
  });
  const apunte = data?.[0];

  if (!apunte) {
    notFound();
  }

  return (
    <ApunteCompartidoView
      apunte={{
        titulo: apunte.titulo,
        contenido: apunte.contenido,
        createdAt: apunte.created_at,
        cursoNombre: apunte.curso_nombre,
        enlacePermiso: apunte.enlace_permiso,
        autor: {
          nombre: apunte.autor_nombre,
          usuario: apunte.autor_usuario,
          avatarUrl: apunte.autor_avatar_url,
        },
      }}
    />
  );
}
