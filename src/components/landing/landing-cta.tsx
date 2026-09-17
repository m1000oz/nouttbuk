"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLandingAuth } from "@/components/landing/landing-auth-context";

type LandingCTAProps = {
  usuarioAutenticado?: boolean;
};

export function LandingCTA({ usuarioAutenticado = false }: LandingCTAProps) {
  const { abrirAuth } = useLandingAuth();

  return (
    <section className="py-24 sm:py-32 border-t border-border/70 bg-radial from-muted/30 to-transparent">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-12">
        <div className="rounded-3xl border border-border/80 bg-card p-10 sm:p-16 lg:p-20 text-center shadow-md relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl"
            aria-hidden
          />

          {/* Main heading (Widescreen scale) */}
          <h2 className="relative mx-auto max-w-3xl text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
            Llega a tus exámenes con tus materias en orden.
          </h2>

          <p className="relative mx-auto mt-6 max-w-2xl text-base sm:text-xl text-muted-foreground leading-relaxed">
            Crea tus carpetas de cursos, invita a tu equipo a redactar juntos y ten tus notas listas para estudiar en cualquier momento.
          </p>

          {/* Buttons (No arrows in buttons, no container overflow) */}
          <div className="relative mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {usuarioAutenticado ? (
              <Button
                size="xl"
                nativeButton={false}
                render={<Link href="/inicio" />}
                className="w-full sm:w-auto max-w-full font-medium px-8 text-center whitespace-normal sm:whitespace-nowrap"
              >
                Abrir mi Nouttbuk
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

          <p className="relative mt-6 text-xs sm:text-sm text-muted-foreground">
            Acceso gratuito con tu correo universitario PUCP
          </p>
        </div>
      </div>
    </section>
  );
}
