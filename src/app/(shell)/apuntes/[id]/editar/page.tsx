import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ApunteEditor } from "@/components/apuntes/apunte-editor";

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

  const [{ data: apunte }, { data: carpetas }] = await Promise.all([
    supabase
      .from("apuntes")
      .select(
        "id, titulo, contenido, carpeta_id, visibilidad, etiquetas, favorito, autor_id",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("carpetas")
      .select("id, nombre, color")
      .eq("propietario_id", user.id)
      .order("nombre", { ascending: true }),
  ]);

  // No existe, o no es del propio usuario: todavía no hay flujo de
  // colaboración (todo.md ítem 7) que habilite editar apuntes ajenos.
  if (!apunte || apunte.autor_id !== user.id) {
    notFound();
  }

  return (
    <ApunteEditor
      carpetas={carpetas ?? []}
      apunte={{
        id: apunte.id,
        titulo: apunte.titulo,
        contenido: apunte.contenido,
        carpetaId: apunte.carpeta_id,
        visibilidad: apunte.visibilidad,
        etiquetas: apunte.etiquetas,
        favorito: apunte.favorito,
      }}
    />
  );
}
