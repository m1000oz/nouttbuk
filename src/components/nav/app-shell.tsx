"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { NAV_ITEMS, type NavItem } from "@/components/nav/nav-items";
import { NuevoApunteButton } from "@/components/nav/fab-nuevo-apunte";
import { ProToolsSidebar } from "@/components/nav/pro-tools-sidebar";
import { ProToolsProvider, useProTools } from "@/lib/context/pro-tools-context";
import { AuthModal, type AuthModalMode } from "@/components/auth/auth-modal";
import { AuthGateProvider } from "@/components/nav/auth-gate";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { TimerIcon } from "@phosphor-icons/react";
import { NouttbukLogo } from "@/components/brand";

function GlobalPomodoroWidget({ className }: { className?: string }) {
  const { pomodoroIsRunning, pomodoroTime, pomodoroTheme, pomodoroMode, setActiveTool, pomodoroSettings } = useProTools();
  
  // No mostrar nada si no está corriendo y está en el tiempo por defecto
  const isDefaultTime = pomodoroTime === (
    pomodoroMode === "work" ? pomodoroSettings.workDuration * 60 
    : pomodoroMode === "break" ? pomodoroSettings.breakDuration * 60 
    : pomodoroSettings.longBreakDuration * 60
  );
  if (!pomodoroIsRunning && isDefaultTime) return null;

  const m = Math.floor(pomodoroTime / 60).toString().padStart(2, "0");
  const s = (pomodoroTime % 60).toString().padStart(2, "0");

  const themeColors: Record<string, string> = {
    silent: "text-slate-500 border-slate-500/30 bg-slate-500/10",
    rain: "text-blue-500 border-blue-500/30 bg-blue-500/10",
    lofi: "text-fuchsia-500 border-fuchsia-500/30 bg-fuchsia-500/10",
    cafe: "text-orange-500 border-orange-500/30 bg-orange-500/10",
    cat: "text-rose-400 border-rose-400/30 bg-rose-400/10",
    synthwave: "text-pink-500 border-pink-500/30 bg-pink-500/10",
    classical: "text-amber-500 border-amber-500/30 bg-amber-500/10"
  };

  return (
    <button 
      onClick={() => setActiveTool("pomodoro")}
      className={cn(
        "px-4 py-3 rounded-xl border flex items-center gap-4 transition-all hover:opacity-80 backdrop-blur-md cursor-pointer", 
        themeColors[pomodoroTheme],
        className
      )}
    >
      <div className="flex items-center gap-2">
        <TimerIcon className={cn("size-4", pomodoroIsRunning && "animate-pulse")} weight={pomodoroIsRunning ? "fill" : "regular"} />
        <span className="text-[10px] font-bold uppercase tracking-widest">
          {pomodoroMode === "work" ? "Focus" : "Break"}
        </span>
      </div>
      <span className="font-mono font-bold text-sm">{m}:{s}</span>
    </button>
  );
}

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
        "flex flex-1 flex-col items-center gap-1 py-2 text-[0.7rem] font-medium",
        activo ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icono weight={activo ? "fill" : "regular"} className="size-6 shrink-0" aria-hidden />
      <span className="w-full truncate text-center leading-none">{item.label}</span>
    </ShellNavLink>
  );
}


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
    <ProToolsProvider>
      <div className="flex min-h-full flex-1">
        <aside className="hidden sticky top-0 h-screen w-64 shrink-0 flex-col gap-6 border-r border-sidebar-border bg-sidebar px-5 py-8 text-sidebar-foreground md:flex">
          <div className="px-2">
            <NouttbukLogo href="/" variant="compact" size="md" />
          </div>

          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.filter((item) => item.href !== "/perfil").map((item) => {
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
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors",
                    activo
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icono
                    weight={activo ? "fill" : "regular"}
                    className="size-6"
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

          <GlobalPomodoroWidget className="mt-4 w-full" />

          <div className="mt-auto">
            {autenticado ? (
              <div className="flex items-center gap-1 w-full">
                <Link
                  href="/perfil"
                  className="flex flex-1 items-center gap-3 overflow-hidden rounded-xl px-3 py-2 hover:bg-sidebar-accent"
                >
                  <Avatar size="sm">
                    <AvatarImage src={session?.perfil?.avatar_url || undefined} alt={nombreVisible} />
                    <AvatarFallback>
                      {iniciales(session?.perfil?.nombre)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-base font-medium">
                    {nombreVisible ?? "Mi perfil"}
                  </span>
                </Link>
              </div>
            ) : (
              <Button
                type="button"
                size="xl"
                onClick={() => abrirAuth("login")}
                className="w-full"
              >
                Iniciar sesión
              </Button>
            )}
          </div>
        </aside>

        <div className="flex flex-1 flex-col min-w-0">
          <main
            id="main-content"
            tabIndex={-1}
            className="flex flex-1 flex-col pb-20 md:pb-0 focus:outline-none min-w-0"
          >
            <AuthGateProvider abrirLogin={() => abrirAuth("login")}>
              {children}
            </AuthGateProvider>
          </main>
        </div>

        {/* --- Mobile Floating Pomodoro Widget --- */}
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 md:hidden shadow-xl rounded-xl">
          <GlobalPomodoroWidget className="mt-0 shadow-lg px-6" />
        </div>

        <ProToolsSidebar />

        <div className="fixed bottom-20 right-4 z-50 md:hidden">
          <NuevoApunteButton
            variant="fab"
            carpetaId={carpetaIdActual}
          />
        </div>

        <nav
          aria-label="Navegación principal"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card md:hidden"
        >
          <div className="flex h-16 items-center justify-between px-2 pb-1">
            {NAV_ITEMS.map((item) => (
              <MobileNavLink
                key={item.href}
                item={item}
                activo={pathname === item.href}
                bloqueado={item.requiresAuth && !autenticado}
                onRequiereLogin={() => abrirAuth("login")}
              />
            ))}
          </div>
        </nav>

        <AuthModal
          open={authOpen}
          mode={authMode}
          onOpenChange={handleAuthOpenChange}
          onModeChange={setAuthMode}
        />
      </div>
    </ProToolsProvider>
  );
}
