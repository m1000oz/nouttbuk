import { Suspense, type ReactNode } from "react";
import Link from "next/link";

import { NouttbukLogo } from "@/components/brand";
import { LandingAuthProvider } from "@/components/landing/landing-auth-context";
import { LandingFooter } from "@/components/landing/landing-footer";

// Layout propio para páginas públicas de consulta (Términos, Privacidad,
// Créditos), deliberadamente fuera de (shell): esas páginas no necesitan
// sesión ni la barra de navegación de la app, y envolverlas en AppShell
// mostraba a un visitante anónimo el shell completo (sidebar, Pomodoro,
// estado "Invitado") solo por llegar desde un link del footer público.
// Reutiliza el mismo footer de la landing para que el visitante pueda
// seguir navegando sin quedar en un callejón sin salida.
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <LandingAuthProvider>
        <div className="flex min-h-screen flex-col bg-background text-foreground">
          <header className="border-b border-border/70">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 sm:px-10 lg:px-12">
              <NouttbukLogo href="/" variant="compact" size="sm" />
              <Link
                href="/"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Volver al inicio
              </Link>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <LandingFooter />
        </div>
      </LandingAuthProvider>
    </Suspense>
  );
}
