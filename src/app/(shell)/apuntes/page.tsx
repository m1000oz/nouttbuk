import { redirect } from "next/navigation";
import { NotebookIcon } from "@phosphor-icons/react/dist/ssr";

import { createClient } from "@/lib/supabase/server";

export default async function MisApuntesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?login=1");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl border border-dashed border-border bg-muted text-primary">
        <NotebookIcon className="size-7" aria-hidden />
      </div>
      <h1 className="text-2xl font-bold text-foreground">
        Tu biblioteca de apuntes está en construcción
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Aquí vas a poder buscar y organizar tus apuntes por carpeta.
        Próximamente.
      </p>
    </div>
  );
}
