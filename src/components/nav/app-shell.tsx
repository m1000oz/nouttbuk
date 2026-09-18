"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { NAV_ITEMS, type NavItem } from "@/components/nav/nav-items";
import { NuevoApunteButton } from "@/components/nav/fab-nuevo-apunte";
import { ProToolsSidebar } from "@/components/nav/pro-tools-sidebar";
import {
  ProToolsProvider,
  useProTools,
  type PomodoroTheme,
} from "@/lib/context/pro-tools-context";
import { AuthModal, type AuthModalMode } from "@/components/auth/auth-modal";
import { AuthGateProvider } from "@/components/nav/auth-gate";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  TimerIcon,
  WaveformIcon,
  FolderIcon,
  CheckCircleIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { NouttbukLogo } from "@/components/brand";
import { resolverColorCarpeta } from "@/lib/carpetas/colores";

const POMODORO_THEMES: { id: PomodoroTheme; label: string; activeClass: string }[] = [
  {
    id: "rain",
    label: "Lluvia",
    activeClass: "bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold",
  },
  {
    id: "cafe",
    label: "Café",
    activeClass: "bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold",
  },
  {
    id: "lofi",
    label: "Lo-Fi",
    activeClass: "bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 font-bold",
  },
];

function GlobalPomodoroWidget({
  className,
  variant = "sidebar",
}: {
  className?: string;
  variant?: "sidebar" | "compact";
}) {
  const {
    pomodoroIsRunning,
    pomodoroTime,
    pomodoroTheme,
    pomodoroMode,
    setActiveTool,
    pomodoroSettings,
    togglePomodoro,
    setPomodoroTheme,
  } = useProTools();

  const isDefaultTime =
    pomodoroTime ===
    (pomodoroMode === "work"
      ? pomodoroSettings.workDuration * 60
      : pomodoroMode === "break"
        ? pomodoroSettings.breakDuration * 60
        : pomodoroSettings.longBreakDuration * 60);

  const m = Math.floor(pomodoroTime / 60).toString().padStart(2, "0");
  const s = (pomodoroTime % 60).toString().padStart(2, "0");

  if (variant === "compact") {
    if (!pomodoroIsRunning && isDefaultTime) return null;
    return (
      <button
        type="button"
        onClick={() => setActiveTool("pomodoro")}
        className={cn(
          "flex items-center gap-2.5 px-4 py-2 rounded-full border border-border/80 bg-card/95 backdrop-blur-md shadow-lg text-xs font-semibold cursor-pointer hover:bg-card transition-all",
          pomodoroIsRunning && "border-primary/40",
          className,
        )}
      >
        <TimerIcon
          weight={pomodoroIsRunning ? "fill" : "regular"}
          className={cn("size-4 text-primary", pomodoroIsRunning && "animate-pulse")}
        />
        <span className="font-mono font-bold text-sm text-foreground">
          {m}:{s}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
          {pomodoroMode === "work" ? "Focus" : "Descanso"}
        </span>
      </button>
    );
  }

  const modoLabel =
    pomodoroMode === "work"
      ? "Concentración"
      : pomodoroMode === "break"
        ? "Descanso"
        : "Descanso largo";

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-card p-3 space-y-2.5 shadow-xs transition-all",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setActiveTool("pomodoro")}
          className="flex items-center gap-2 text-left group cursor-pointer"
          title="Abrir panel completo de Pomodoro"
        >
          <TimerIcon
            weight="fill"
            className={cn(
              "size-4 text-indigo-500 transition-transform group-hover:scale-110",
              pomodoroIsRunning && "animate-pulse",
            )}
          />
          <span className="text-[11px] font-bold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
            {modoLabel}
          </span>
        </button>
        <button
          type="button"
          onClick={togglePomodoro}
          className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        >
          <WaveformIcon
            className={cn(
              "size-3.5",
              pomodoroIsRunning ? "text-indigo-500 animate-pulse" : "opacity-40",
            )}
          />
          <span>{pomodoroIsRunning ? "Pausar" : isDefaultTime ? "Iniciar" : "Reanudar"}</span>
        </button>
      </div>

      <div className="flex items-baseline justify-between pt-0.5">
        <button
          type="button"
          onClick={() => setActiveTool("pomodoro")}
          className="font-mono text-2xl font-bold tracking-tight text-foreground hover:text-primary transition-colors cursor-pointer"
          title="Ver o configurar temporizador"
        >
          {m}:{s}
        </button>
        <div className="flex items-center gap-1 text-[10px]">
          {POMODORO_THEMES.map((t) => {
            const isSelected = pomodoroTheme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setPomodoroTheme(isSelected ? "silent" : t.id)}
                className={cn(
                  "rounded-md px-1.5 py-0.5 font-medium transition-all cursor-pointer",
                  isSelected
                    ? t.activeClass
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                title={
                  isSelected
                    ? `Silenciar sonido (${t.label})`
                    : `Activar sonido de ambiente: ${t.label}`
                }
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export type ShellSession = {
  id: string;
  perfil: {
    nombre: string;
    usuario: string;
    avatar_url: string | null;
    universidad?: string | null;
    carrera?: string | null;
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

function DesktopSidebar({
  session,
  autenticado,
  nombreVisible,
  carpetaIdActual,
  abrirAuth,
}: {
  session: ShellSession;
  autenticado: boolean;
  nombreVisible: string | undefined;
  carpetaIdActual: string | null;
  abrirAuth: (mode: AuthModalMode) => void;
}) {
  const pathname = usePathname();
  const { carpetas } = useProTools();

  const uniText = session?.perfil?.universidad
    ? `${session.perfil.universidad} Pregrado`
    : "PUCP Pregrado";

  return (
    <aside className="hidden sticky top-0 h-screen w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground md:flex">
      {/* Brand Logo */}
      <div className="flex items-center justify-between px-1 pb-4">
        <NouttbukLogo href={autenticado ? "/inicio" : "/"} variant="compact" size="md" />
      </div>

      {/* Main Scrollable Body */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1 min-h-0">
        {/* User Profile Capsule */}
        {autenticado ? (
          <Link
            href="/perfil"
            className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-xs hover:border-border hover:shadow-sm transition-all group"
          >
            <Avatar size="sm" className="size-10 ring-1 ring-border/40 shrink-0">
              {session?.perfil?.avatar_url && (
                <AvatarImage src={session.perfil.avatar_url} alt={nombreVisible ?? ""} />
              )}
              <AvatarFallback className="bg-indigo-600 font-bold text-white text-xs shadow-xs">
                {iniciales(session?.perfil?.nombre)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                {session?.perfil?.nombre ?? session?.perfil?.usuario ?? "Mi perfil"}
              </span>
              <span className="truncate text-[11px] text-muted-foreground">
                @{session?.perfil?.usuario ?? "usuario"}
                {session?.perfil?.carrera
                  ? ` / ${session.perfil.carrera}`
                  : session?.perfil?.universidad
                    ? ` / ${session.perfil.universidad}`
                    : ""}
              </span>
            </div>
          </Link>
        ) : (
          <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-semibold">
                <UserIcon className="size-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-xs font-semibold text-foreground">Invitado</span>
                <span className="truncate text-[11px] text-muted-foreground">Acceso libre</span>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => abrirAuth("login")}
              className="w-full text-xs font-semibold"
            >
              Iniciar sesión
            </Button>
          </div>
        )}

        {/* + Nuevo Apunte CTA Button */}
        <NuevoApunteButton
          variant="sidebar"
          className="w-full justify-center gap-2 rounded-xl text-xs font-bold shadow-xs py-2.5 h-10"
          carpetaId={carpetaIdActual}
        />

        {/* Global Pomodoro & Ambient Sounds */}
        <GlobalPomodoroWidget variant="sidebar" className="w-full" />

        {/* Main Navigation Items */}
        <div className="space-y-1 text-xs font-medium">
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
                  "flex items-center justify-between rounded-xl px-3 py-2 transition-all cursor-pointer",
                  activo
                    ? "bg-card text-foreground font-bold shadow-xs border border-border/70"
                    : "text-muted-foreground hover:bg-card/60 hover:text-foreground border border-transparent",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icono
                    weight={activo ? "fill" : "regular"}
                    className={cn("size-4 shrink-0", activo && "text-primary")}
                    aria-hidden
                  />
                  <span>{item.label}</span>
                </div>

                {item.href === "/comunidad" && (
                  <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-600 dark:text-teal-400">
                    Feed
                  </span>
                )}

                {item.href === "/apuntes" && carpetas.length > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {carpetas.length}
                  </span>
                )}
              </ShellNavLink>
            );
          })}
        </div>

        {/* Cursos del ciclo con carpetas de color */}
        <div className="pt-2">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Cursos del ciclo
          </div>
          <div className="space-y-1 text-xs font-medium">
            {carpetas.length > 0 ? (
              carpetas.map((carpeta) => {
                const isCursoActivo =
                  pathname === "/apuntes" && carpetaIdActual === carpeta.id;
                const colorHex = resolverColorCarpeta(carpeta.color);

                return (
                  <Link
                    key={carpeta.id}
                    href={`/apuntes?carpeta=${carpeta.id}`}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-1.5 transition-all",
                      isCursoActivo
                        ? "bg-card text-foreground font-bold shadow-xs border border-border/80"
                        : "text-muted-foreground hover:bg-card/50 hover:text-foreground border border-transparent",
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FolderIcon
                        weight="fill"
                        className="size-3.5 shrink-0"
                        style={{ color: colorHex }}
                        aria-hidden
                      />
                      <span className="truncate">{carpeta.nombre}</span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="px-3 py-1.5 text-xs text-muted-foreground/70 italic">
                {autenticado
                  ? "Sin cursos creadas"
                  : "Inicia sesión para ver tus cursos"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Campus verification status footer */}
      <div className="pt-3 mt-auto border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
        <span className="truncate font-medium">{uniText}</span>
        {autenticado ? (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
            <CheckCircleIcon weight="fill" className="size-3.5" /> Verificado
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground shrink-0">
            Para estudiantes
          </span>
        )}
      </div>
    </aside>
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
        <DesktopSidebar
          session={session}
          autenticado={autenticado}
          nombreVisible={nombreVisible}
          carpetaIdActual={carpetaIdActual}
          abrirAuth={abrirAuth}
        />

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
          <GlobalPomodoroWidget variant="compact" className="mt-0 shadow-lg px-4" />
        </div>

        <AuthGateProvider abrirLogin={() => abrirAuth("login")}>
          <ProToolsSidebar />
        </AuthGateProvider>

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
