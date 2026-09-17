import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { tienePerfilIncompleto } from "@/lib/perfil/perfil-incompleto";
import { CvEditor } from "@/components/cv/cv-editor";
import { PLANTILLA_CV_INICIAL } from "@/lib/cv/plantilla-cv";

export const metadata = {
  title: "Tu CV, Nouttbuk",
};

export default async function CvEditarPage() {
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

  const { data: cv } = await supabase
    .from("cv")
    .select("contenido")
    .eq("autor_id", user.id)
    .maybeSingle();

  // Primera vez que esta persona abre su CV: se crea la fila acá mismo, con
  // la plantilla semilla, antes de renderizar el editor. Así CvEditor
  // siempre recibe contenido real (sin parpadeo ni una carrera cliente-
  // servidor tratando de crearla desde el propio editor al montar).
  let contenido = cv?.contenido ?? PLANTILLA_CV_INICIAL;
  if (!cv) {
    const { data: creado } = await supabase
      .from("cv")
      .insert({ autor_id: user.id, contenido: PLANTILLA_CV_INICIAL })
      .select("contenido")
      .single();
    contenido = creado?.contenido ?? PLANTILLA_CV_INICIAL;
  }

  return <CvEditor contenido={contenido} />;
}
