"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLandingAuth } from "@/components/landing/landing-auth-context";
import { LandingPreviewMockup } from "@/components/landing/landing-preview-mockup";

type LandingHeroProps = {
  usuarioAutenticado?: boolean;
};

export function LandingHero({ usuarioAutenticado = false }: LandingHeroProps) {
  const { abrirAuth } = useLandingAuth();

  return (
    <section className="pt-10 pb-20 sm:pt-16 sm:pb-28">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-12 text-center">
        {/* Main Headline (Widescreen scale, authoritative weight, no gradient text) */}
        <h1 className="mx-auto max-w-4xl text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.08]">
          Un cuaderno digital pensado para la universidad.
        </h1>

        {/* Subtitle (Clear, focused, human) */}
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-xl text-muted-foreground leading-relaxed">
          Tus apuntes organizados por curso, redacción en vivo con tu grupo de estudio y una comunidad académica sin costo.
        </p>

        {/* Dual Primary Call-to-Actions (No arrows in buttons, no container overflow) */}
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          {usuarioAutenticado ? (
            <Button
              size="xl"
              nativeButton={false}
              render={<Link href="/inicio" />}
              className="w-full sm:w-auto max-w-full font-medium px-8 text-center whitespace-normal sm:whitespace-nowrap"
            >
              Ir a mi espacio
            </Button>
          ) : (
            <Button
              size="xl"
              type="button"
              onClick={() => abrirAuth("signup")}
              className="w-full sm:w-auto max-w-full font-medium px-8 bg-primary hover:bg-primary/90 text-primary-foreground text-center whitespace-normal sm:whitespace-nowrap shadow-sm"
            >
              Crear cuenta gratis
            </Button>
          )}

          <Button
            size="xl"
            variant="outline"
            nativeButton={false}
            render={<Link href="/comunidad" />}
            className="w-full sm:w-auto max-w-full font-medium px-8 text-center whitespace-normal sm:whitespace-nowrap"
          >
            Explorar comunidad
          </Button>
        </div>

        {/* Quiet assurance bar (No middle dots) */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-muted-foreground">
          <span>Con tu correo PUCP</span>
          <span className="hidden sm:inline text-border/80">/</span>
          <span>Apuntes privados por defecto</span>
          <span className="hidden sm:inline text-border/80">/</span>
          <span>En computadora y celular</span>
        </div>

        {/* Embedded Full Widescreen Product Showcase */}
        <div className="mt-14 sm:mt-20 w-full">
          <LandingPreviewMockup />
        </div>
      </div>
    </section>
  );
}
