import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import { LandingAuthProvider } from "@/components/landing/landing-auth-context";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingPainPoints } from "@/components/landing/landing-pain-points";
import { LandingAudiences } from "@/components/landing/landing-audiences";
import { LandingBentoFeatures } from "@/components/landing/landing-bento-features";
import { LandingCommunityPreview } from "@/components/landing/landing-community-preview";
import { LandingFAQ } from "@/components/landing/landing-faq";
import { LandingCTA } from "@/components/landing/landing-cta";
import { LandingFooter } from "@/components/landing/landing-footer";

export default async function LandingPage(props: PageProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const searchParams = await props.searchParams;
  const forceLanding = searchParams.landing === "1" || searchParams.preview === "1";

  // Si el usuario ya inició sesión y no solicitó ver la landing explícitamente,
  // lo enviamos a su espacio de trabajo diario (/inicio).
  if (user && !forceLanding) {
    redirect("/inicio");
  }

  const usuarioAutenticado = Boolean(user);

  return (
    <LandingAuthProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-indigo-500/20 selection:text-indigo-600 dark:selection:text-indigo-400">
        <LandingNavbar usuarioAutenticado={usuarioAutenticado} />
        <main className="flex-1">
          <LandingHero usuarioAutenticado={usuarioAutenticado} />
          <LandingPainPoints />
          <LandingAudiences />
          <LandingBentoFeatures />
          <LandingCommunityPreview />
          <LandingFAQ />
          <LandingCTA usuarioAutenticado={usuarioAutenticado} />
        </main>
        <LandingFooter />
      </div>
    </LandingAuthProvider>
  );
}
