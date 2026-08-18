import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ApunteEditor } from "@/components/apuntes/apunte-editor";

export default async function NuevoApuntePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?login=1");
  }

  const { data: carpetas } = await supabase
    .from("carpetas")
    .select("id, nombre, color")
    .eq("propietario_id", user.id)
    .order("nombre", { ascending: true });

  return <ApunteEditor carpetas={carpetas ?? []} />;
}
