"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

type AuthGateValue = {
  abrirLogin: () => void;
};

const AuthGateContext = createContext<AuthGateValue | null>(null);

export function AuthGateProvider({
  abrirLogin,
  children,
}: {
  abrirLogin: () => void;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ abrirLogin }), [abrirLogin]);
  return (
    <AuthGateContext.Provider value={value}>
      {children}
    </AuthGateContext.Provider>
  );
}

export function useAuthGate(): AuthGateValue {
  const context = useContext(AuthGateContext);
  if (!context) {
    throw new Error("useAuthGate debe usarse dentro de AuthGateProvider");
  }
  return context;
}
