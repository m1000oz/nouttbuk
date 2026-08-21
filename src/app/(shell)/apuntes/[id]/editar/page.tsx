import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ApunteEditor } from "@/components/apuntes/apunte-editor";
import { consultaColaboradores } from "@/lib/colaboradores/consultas";
import { consultaCursos } from "@/lib/cursos/consultas";

export default async function EditarApuntePage(
  props: PageProps<"/apuntes/[id]/editar">,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?login=1");
  }

  const { id } = await props.params;

  const [{ data: apunte }, { data: carpetas }, cursos] = await Promise.all([
    supabase
      .from("apuntes")
      .select(
        "id, titulo, contenido, carpeta_id, curso_id, visibilidad, etiquetas, favorito, autor_id, autor:profiles!apuntes_autor_id_fkey(nombre)",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("carpetas")
      .select("id, nombre, color")
      .eq("propietario_id", user.id)
      .order("nombre", { ascending: true }),
    consultaCursos(supabase),
  ]);

  if (!apunte) {
    notFound();
  }

  const esOwner = apunte.autor_id === user.id;

  // Si no es el autor, el único otro camino de acceso es ser colaborador
  // invitado (RLS ya lo permite vía private.can_edit_apunte/
  // can_read_group_apunte, esta consulta solo determina qué UI mostrar).
  const { data: colaboracion } = esOwner
    ? { data: null }
    : await supabase
        .from("colaboradores")
        .select("permiso")
        .eq("apunte_id", id)
        .eq("perfil_id", user.id)
        .maybeSingle();

  if (!esOwner && !colaboracion) {
    notFound();
  }

  const { data: colaboradores } = esOwner
    ? await consultaColaboradores(supabase, id)
    : { data: [] };

  return (
    <ApunteEditor
      carpetas={carpetas ?? []}
      cursos={cursos}
      apunte={{
        id: apunte.id,
        titulo: apunte.titulo,
        contenido: apunte.contenido,
        carpetaId: apunte.carpeta_id,
        cursoId: apunte.curso_id,
        visibilidad: apunte.visibilidad,
        etiquetas: apunte.etiquetas,
        favorito: apunte.favorito,
      }}
      permisoActual={esOwner ? "owner" : (colaboracion?.permiso ?? "read")}
      autorNombre={apunte.autor?.nombre}
      colaboradoresIniciales={colaboradores ?? []}
    />
  );
}
