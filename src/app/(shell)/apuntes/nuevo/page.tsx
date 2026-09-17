import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { tienePerfilIncompleto } from "@/lib/perfil/perfil-incompleto";
import { ApunteEditor } from "@/components/apuntes/apunte-editor";
import { consultaCursos } from "@/lib/cursos/consultas";

export default async function NuevoApuntePage(
  props: PageProps<"/apuntes/nuevo">,
) {
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

  const { data: perfil } = await supabase
    .from("profiles")
    .select("carrera_id")
    .eq("id", user.id)
    .single();

  const [{ data: carpetas }, cursos] = await Promise.all([
    supabase
      .from("carpetas")
      .select("id, nombre, color")
      .eq("propietario_id", user.id)
      .order("nombre", { ascending: true }),
    consultaCursos(supabase, perfil?.carrera_id),
  ]);

  // Solo se respeta ?carpeta= si corresponde a una carpeta real del usuario
  // (evita que un link manipulado seleccione una carpeta ajena en el
  // <Select>, que solo lista las propias).
  const carpetaIdInicial =
    carpetaIdParam &&
    (carpetas ?? []).some((carpeta) => carpeta.id === carpetaIdParam)
      ? carpetaIdParam
      : null;

  return (
    <ApunteEditor
      carpetas={carpetas ?? []}
      cursos={cursos}
      carpetaIdInicial={carpetaIdInicial}
    />
  );
}
