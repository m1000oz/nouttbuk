"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AuthModal, type AuthModalMode } from "@/components/auth/auth-modal";

type LandingAuthContextValue = {
  abrirAuth: (mode?: AuthModalMode) => void;
};

const LandingAuthContext = createContext<LandingAuthContextValue | null>(null);

export function useLandingAuth() {
  const context = useContext(LandingAuthContext);
  if (!context) {
    throw new Error("useLandingAuth debe usarse dentro de LandingAuthProvider");
  }
  return context;
}

export function LandingAuthProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthModalMode>("login");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const login = searchParams.get("login");
    const signup = searchParams.get("signup");
    if (login === "1") {
      setMode("login");
      setOpen(true);
    } else if (signup === "1") {
      setMode("signup");
      setOpen(true);
    }
  }, [searchParams]);

  function abrirAuth(targetMode: AuthModalMode = "login") {
    setMode(targetMode);
    setOpen(true);
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen && (searchParams.get("login") || searchParams.get("signup"))) {
      router.replace(pathname);
    }
  }

  return (
    <LandingAuthContext.Provider value={{ abrirAuth }}>
      {children}
      <AuthModal
        open={open}
        mode={mode}
        onOpenChange={handleOpenChange}
        onModeChange={setMode}
      />
    </LandingAuthContext.Provider>
  );
}
