"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { RecuperarForm } from "@/components/auth/recuperar-form";

// Logo oficial de Google en cuatro colores (uso permitido dentro de un botón
// "Continuar/Iniciar sesión con Google", parte de las brand guidelines de
// Google para este caso exacto), inline en vez de una dependencia nueva solo
// por un ícono que Phosphor no trae (es un set genérico, sin logos de marca).
function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.9-2.26 5.36-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.87.92 7.52 2.56 10.78z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.9l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export type AuthModalMode = "login" | "signup" | "recuperar";

type AuthModalProps = {
  open: boolean;
  mode: AuthModalMode;
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: AuthModalMode) => void;
};

const TITULOS: Record<AuthModalMode, string> = {
  login: "Inicia sesión",
  signup: "Crea tu cuenta",
  recuperar: "Recupera tu contraseña",
};

const DESCRIPCIONES: Record<AuthModalMode, string> = {
  login: "Entra con tu correo institucional para acceder a tus apuntes.",
  signup: "Solo se admiten cuentas con correo @pucp.edu.pe.",
  recuperar: "Te enviaremos un enlace para restablecer tu contraseña.",
};

export function AuthModal({
  open,
  mode,
  onOpenChange,
  onModeChange,
}: AuthModalProps) {
  const router = useRouter();

  function handleAuthSuccess() {
    onOpenChange(false);
    // El layout del shell lee la sesión en un Server Component, así que
    // sin este refresh el nav se queda con el estado desautenticado hasta
    // la próxima navegación server-side.
    router.refresh();
  }

  // A diferencia de login/signup con correo, este flujo sale del modal
  // (redirige a Google y vuelve por /auth/callback), así que no hay
  // onSuccess que llamar acá: handleAuthSuccess corre después, cuando
  // AppShell detecta la sesión nueva tras el redirect de vuelta.
  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // hd acota el selector de cuentas de Google a las del Workspace
        // institucional (pucp.edu.pe) para que no aparezcan cuentas
        // personales como opción; la validación real e infranqueable sigue
        // siendo el trigger de dominio en auth.users (20260817204401), esto
        // es solo para no hacerle elegir la cuenta equivocada por accidente.
        queryParams: { hd: "pucp.edu.pe", prompt: "select_account" },
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{TITULOS[mode]}</DialogTitle>
          <DialogDescription>{DESCRIPCIONES[mode]}</DialogDescription>
        </DialogHeader>

        {mode !== "recuperar" && (
          <>
            <Button type="button" variant="outline" onClick={handleGoogle}>
              <GoogleLogo />
              {mode === "login"
                ? "Continuar con Google"
                : "Crear cuenta con Google"}
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" aria-hidden />
              o con tu correo
              <span className="h-px flex-1 bg-border" aria-hidden />
            </div>
          </>
        )}

        {mode === "login" && (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onIrARecuperar={() => onModeChange("recuperar")}
          />
        )}
        {mode === "signup" && (
          <SignupForm
            onSuccess={handleAuthSuccess}
            onIrALogin={() => onModeChange("login")}
          />
        )}
        {mode === "recuperar" && (
          <RecuperarForm onVolver={() => onModeChange("login")} />
        )}

        {mode !== "recuperar" && (
          <button
            type="button"
            onClick={() => onModeChange(mode === "login" ? "signup" : "login")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === "login"
              ? "¿No tienes cuenta? Crea una"
              : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Al continuar aceptas nuestros{" "}
          <Link
            href="/terminos"
            onClick={() => onOpenChange(false)}
            className="underline hover:text-foreground"
          >
            Términos de uso
          </Link>{" "}
          y nuestra{" "}
          <Link
            href="/privacidad"
            onClick={() => onOpenChange(false)}
            className="underline hover:text-foreground"
          >
            Política de privacidad
          </Link>
          .
        </p>
      </DialogContent>
    </Dialog>
  );
}
