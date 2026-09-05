"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { NAV_ITEMS, type NavItem } from "@/components/nav/nav-items";
import { NuevoApunteButton } from "@/components/nav/fab-nuevo-apunte";
import { AuthModal, type AuthModalMode } from "@/components/auth/auth-modal";
import { AuthGateProvider } from "@/components/nav/auth-gate";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type ShellSession = {
  id: string;
  perfil: {
    nombre: string;
    usuario: string;
    avatar_url: string | null;
  } | null;
} | null;

type AppShellProps = {
  session: ShellSession;
  children: ReactNode;
};

function iniciales(nombre: string | null | undefined): string {
  if (!nombre) return "?";
  return nombre
    .trim()
    .split(/\s+/)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ShellNavLink({
  item,
  activo,
  bloqueado,
  onRequiereLogin,
  className,
  children,
}: {
  item: NavItem;
  activo: boolean;
  bloqueado: boolean;
  onRequiereLogin: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={bloqueado ? "/?login=1" : item.href}
      aria-current={activo ? "page" : undefined}
      onClick={(event) => {
        if (bloqueado) {
          event.preventDefault();
          onRequiereLogin();
        }
      }}
      className={className}
    >
      {children}
    </Link>
  );
}

// La barra móvil deja un hueco central para el FAB, así que los ítems se
// reparten en dos mitades a su alrededor en vez de listarse en una sola
// fila, repartido con Math.ceil/floor en vez de un slice(0,2)/slice(2,4)
// fijo, para no romper el layout cada vez que NAV_ITEMS gane o pierda un
// ítem.
function MobileNavLink({
  item,
  activo,
  bloqueado,
  onRequiereLogin,
}: {
  item: NavItem;
  activo: boolean;
  bloqueado: boolean;
  onRequiereLogin: () => void;
}) {
  const Icono = item.icon;
  return (
    <ShellNavLink
      item={item}
      activo={activo}
      bloqueado={bloqueado}
      onRequiereLogin={onRequiereLogin}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 py-1 text-[0.65rem] font-medium",
        activo ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icono weight={activo ? "fill" : "regular"} className="size-5" aria-hidden />
      {item.label}
    </ShellNavLink>
  );
}

const MITAD_NAV = Math.ceil(NAV_ITEMS.length / 2);
const navItemsIzquierda = NAV_ITEMS.slice(0, MITAD_NAV);
const navItemsDerecha = NAV_ITEMS.slice(MITAD_NAV);

export function AppShell({ session, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Solo tiene sentido preseleccionar una carpeta cuando el botón "Nuevo
  // apunte" se dispara desde dentro de Mis apuntes con ?carpeta=X activo
  // (detalle de carpeta); en cualquier otra pantalla se ignora.
  const carpetaIdActual =
    pathname === "/apuntes" ? searchParams.get("carpeta") : null;

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthModalMode>("login");

  useEffect(() => {
    // Lee `window.location` (estado externo al render de React), por eso
    // vive en un efecto y no se deriva durante el render: hacerlo en el
    // render causaría un mismatch de hidratación, ya que el servidor nunca
    // ve el query string del navegador.
    //
    // Depende de `pathname` (no de un montaje único) porque una navegación
    // cliente que termina en un redirect server-side (p. ej. /inicio sin
    // sesión → /?login=1) reutiliza esta misma instancia del shell en vez
    // de remontarla.
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con el query string del navegador tras un redirect server-side, no hay evento de React que lo dispare.
      setAuthMode("login");
      setAuthOpen(true);
    }
    // Vuelta de /auth/callback tras un intento de "Continuar con Google" que
    // no terminó en sesión (dominio no institucional rechazado por el
    // trigger, código inválido, etc.), se avisa por toast en vez de un
    // error inline porque el modal de login, en este punto, ya está
    // cerrado/no montado con ese estado de error.
    const authError = params.get("auth_error");
    if (authError) {
      toast.add({ title: authError, type: "error" });
      router.replace(pathname);
    }
  }, [pathname, router]);

  function abrirAuth(mode: AuthModalMode) {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  function handleAuthOpenChange(open: boolean) {
    setAuthOpen(open);
    if (!open && window.location.search.includes("login=1")) {
      router.replace(pathname);
    }
  }

  const autenticado = Boolean(session);
  const nombreVisible = session?.perfil?.nombre ?? session?.perfil?.usuario;

  return (
    <div className="flex min-h-full flex-1">
      <aside className="hidden w-60 shrink-0 flex-col gap-6 border-r border-sidebar-border bg-sidebar px-4 py-6 text-sidebar-foreground md:flex">
        <Link
          href="/"
          className="px-2 text-lg font-bold text-sidebar-primary"
        >
          Nouttbuk
        </Link>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const activo = pathname === item.href;
            const bloqueado = item.requiresAuth && !autenticado;
            const Icono = item.icon;
            return (
              <ShellNavLink
                key={item.href}
                item={item}
                activo={activo}
                bloqueado={bloqueado}
                onRequiereLogin={() => abrirAuth("login")}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  activo
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icono
                  weight={activo ? "fill" : "regular"}
                  className="size-5"
                  aria-hidden
                />
                {item.label}
              </ShellNavLink>
            );
          })}
        </nav>

        <NuevoApunteButton
          variant="sidebar"
          className="mt-2"
          carpetaId={carpetaIdActual}
        />

        <div className="mt-auto">
          {autenticado ? (
            <Link
              href="/perfil"
              className="flex items-center gap-2.5 overflow-hidden rounded-lg px-1.5 py-1.5 hover:bg-sidebar-accent"
            >
              <Avatar size="sm">
                <AvatarFallback>
                  {iniciales(session?.perfil?.nombre)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-sm font-medium">
                {nombreVisible ?? "Mi perfil"}
              </span>
            </Link>
          ) : (
            <Button
              type="button"
              onClick={() => abrirAuth("login")}
              className="w-full"
            >
              Iniciar sesión
            </Button>
          )}
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <main
          id="main-content"
          tabIndex={-1}
          className="flex flex-1 flex-col pb-20 md:pb-0 focus:outline-none"
        >
          <AuthGateProvider abrirLogin={() => abrirAuth("login")}>
            {children}
          </AuthGateProvider>
        </main>
      </div>

      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card md:hidden"
      >
        <div className="relative flex h-16 items-center justify-around px-2">
          {navItemsIzquierda.map((item) => (
            <MobileNavLink
              key={item.href}
              item={item}
              activo={pathname === item.href}
              bloqueado={item.requiresAuth && !autenticado}
              onRequiereLogin={() => abrirAuth("login")}
            />
          ))}

          <div className="w-14 shrink-0" aria-hidden />

          {navItemsDerecha.map((item) => (
            <MobileNavLink
              key={item.href}
              item={item}
              activo={pathname === item.href}
              bloqueado={item.requiresAuth && !autenticado}
              onRequiereLogin={() => abrirAuth("login")}
            />
          ))}

          <NuevoApunteButton
            variant="fab"
            className="absolute left-1/2 -top-5 -translate-x-1/2"
            carpetaId={carpetaIdActual}
          />
        </div>
      </nav>

      <AuthModal
        open={authOpen}
        mode={authMode}
        onOpenChange={handleAuthOpenChange}
        onModeChange={setAuthMode}
      />
    </div>
  );
}
