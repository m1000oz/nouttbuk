"use client";

import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { RecuperarForm } from "@/components/auth/recuperar-form";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{TITULOS[mode]}</DialogTitle>
          <DialogDescription>{DESCRIPCIONES[mode]}</DialogDescription>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
}
