import type { ReactNode } from "react";

import { createClient } from "@/lib/supabase/server";
import { AppShell, type ShellSession } from "@/components/nav/app-shell";

export default async function ShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let session: ShellSession = null;
  if (user) {
    const { data: perfil } = await supabase
      .from("profiles")
      .select("nombre, usuario, avatar_url")
      .eq("id", user.id)
      .single();
    session = { id: user.id, perfil };
  }

  return <AppShell session={session}>{children}</AppShell>;
}
