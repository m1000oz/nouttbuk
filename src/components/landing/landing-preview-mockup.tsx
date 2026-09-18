"use client";

import { useState, useEffect, useRef } from "react";
import {
  PlayIcon,
  PauseIcon,
  ArrowCounterClockwiseIcon,
  CaretRightIcon,
  CaretLeftIcon,
  TimerIcon,
  CloudRainIcon,
  HeadphonesIcon,
  CoffeeIcon,
  HouseIcon,
  NotebookIcon,
  GlobeHemisphereWestIcon,
  CalendarBlankIcon,
  FolderIcon,
  PlusIcon,
  LightbulbIcon,
  LinkSimpleIcon,
  CheckCircleIcon,
  CircleIcon,
  CloudCheckIcon,
  ArrowRightIcon,
  HeartIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type Escena = 0 | 1 | 2;

const ESCENAS: {
  id: Escena;
  titulo: string;
  duracionMs: number;
}[] = [
  { id: 0, titulo: "Inicio", duracionMs: 7000 },
  { id: 1, titulo: "PomoFocus", duracionMs: 7500 },
  { id: 2, titulo: "Carta Atelier", duracionMs: 8500 },
];

type PomodoroThemeId = "rain" | "lofi" | "cafe";

interface PomodoroThemeConfig {
  id: PomodoroThemeId;
  label: string;
  icon: typeof CloudRainIcon;
  bgGradient: string;
  orbBorder: string;
  orbBg: string;
  textColor: string;
  accentBg: string;
  accentText: string;
  pulseColor: string;
}

const POMODORO_THEMES: Record<PomodoroThemeId, PomodoroThemeConfig> = {
  rain: {
    id: "rain",
    label: "Lluvia",
    icon: CloudRainIcon,
    bgGradient: "from-blue-950 via-slate-900 to-indigo-950",
    orbBorder: "border-blue-400/40",
    orbBg: "bg-blue-500/15",
    textColor: "text-blue-100",
    accentBg: "bg-blue-400",
    accentText: "text-blue-950",
    pulseColor: "shadow-blue-500/30",
  },
  lofi: {
    id: "lofi",
    label: "Lo-Fi",
    icon: HeadphonesIcon,
    bgGradient: "from-fuchsia-950 via-purple-950 to-slate-950",
    orbBorder: "border-fuchsia-400/40",
    orbBg: "bg-fuchsia-500/15",
    textColor: "text-fuchsia-100",
    accentBg: "bg-fuchsia-400",
    accentText: "text-fuchsia-950",
    pulseColor: "shadow-fuchsia-500/30",
  },
  cafe: {
    id: "cafe",
    label: "Café",
    icon: CoffeeIcon,
    bgGradient: "from-amber-950 via-stone-900 to-slate-950",
    orbBorder: "border-amber-400/40",
    orbBg: "bg-amber-500/15",
    textColor: "text-amber-100",
    accentBg: "bg-amber-400",
    accentText: "text-amber-950",
    pulseColor: "shadow-amber-500/30",
  },
};

function formatMinSeg(segundos: number): string {
  const m = Math.floor(segundos / 60)
    .toString()
    .padStart(2, "0");
  const s = (segundos % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function LandingPreviewMockup() {
  const [escenaActiva, setEscenaActiva] = useState<Escena>(0);
  const [reproduciendo, setReproduciendo] = useState(true);
  const [progresoEscena, setProgresoEscena] = useState(0);

  // Estados PomoFocus
  const [pomodoroSegundos, setPomodoroSegundos] = useState(1458); // 24:18
  const [pomodoroSonando, setPomodoroSonando] = useState(true);
  const [pomodoroTema, setPomodoroTema] = useState<PomodoroThemeId>("rain");
  const [tareas, setTareas] = useState([
    { id: 1, texto: "Crear mi primer cuaderno anillado en Nouttbuk", hecha: true },
    { id: 2, texto: "Probar audio de lluvia mientras estudio en la biblioteca", hecha: false },
  ]);

  // Estados Atelier
  const [visibilidad, setVisibilidad] = useState<"privado" | "grupo" | "comunidad">("comunidad");
  const [modoProyector, setModoProyector] = useState(false);
  const [hipertextoActivo, setHipertextoActivo] = useState(false);

  const duracionActual = ESCENAS[escenaActiva].duracionMs;
  const intervaloRef = useRef<NodeJS.Timeout | null>(null);

  // Autoplay del video tour
  useEffect(() => {
    if (!reproduciendo) {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
      return;
    }

    const pasoMs = 80;
    const incremento = (pasoMs / duracionActual) * 100;

    intervaloRef.current = setInterval(() => {
      setProgresoEscena((prev) => {
        if (prev + incremento >= 100) {
          setEscenaActiva((actual) => ((actual + 1) % 3) as Escena);
          return 0;
        }
        return prev + incremento;
      });
    }, pasoMs);

    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [reproduciendo, duracionActual, escenaActiva]);

  // Temporizador en vivo
  useEffect(() => {
    if (!pomodoroSonando) return;
    const t = setInterval(() => {
      setPomodoroSegundos((s) => (s > 1 ? s - 1 : 1500));
    }, 1000);
    return () => clearInterval(t);
  }, [pomodoroSonando]);

  function pausarAutoplay() {
    if (reproduciendo) {
      setReproduciendo(false);
    }
  }

  function irAEscena(nueva: Escena) {
    setEscenaActiva(nueva);
    setProgresoEscena(0);
    pausarAutoplay();
  }

  function toggleTarea(id: number) {
    pausarAutoplay();
    setTareas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, hecha: !t.hecha } : t))
    );
  }

  const temaActual = POMODORO_THEMES[pomodoroTema];
  const maxSegundos = 1500;
  const porcentajePomodoro = ((maxSegundos - pomodoroSegundos) / maxSegundos) * 100;

  return (
    <div className="relative mx-auto w-full max-w-6xl rounded-3xl border border-border/70 bg-card p-2 sm:p-4 shadow-xl transition-all">
      {/* ========================================================= */}
      {/* BARRA SUPERIOR: VIDEO TOUR REPRODUCTOR MINIMALISTA        */}
      {/* ========================================================= */}
      <div className="mb-3 flex items-center justify-between rounded-2xl border border-border/60 bg-muted/25 px-3 sm:px-4 py-2">
        <div className="flex items-center gap-3">
          {/* macOS window dots */}
          <div className="hidden sm:flex items-center gap-1.5" aria-hidden>
            <div className="size-2.5 rounded-full bg-red-400/80" />
            <div className="size-2.5 rounded-full bg-amber-400/80" />
            <div className="size-2.5 rounded-full bg-emerald-400/80" />
          </div>

          <div className="flex items-center gap-2 rounded-full border border-border/80 bg-card px-2.5 py-0.5 shadow-xs">
            <span
              className={cn(
                "size-2 rounded-full",
                reproduciendo ? "bg-indigo-500 animate-pulse" : "bg-muted-foreground"
              )}
            />
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">
              {reproduciendo ? "Demo en vivo" : "Pausado"}
            </span>
          </div>
        </div>

        {/* Scene Pills con barra de progreso */}
        <div className="flex items-center gap-1 sm:gap-2">
          {ESCENAS.map((escena) => {
            const estaActiva = escenaActiva === escena.id;
            return (
              <button
                key={escena.id}
                type="button"
                onClick={() => irAEscena(escena.id)}
                className={cn(
                  "relative overflow-hidden rounded-xl px-3 py-1 text-xs font-semibold transition-all cursor-pointer",
                  estaActiva
                    ? "bg-card text-foreground font-bold shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="relative z-10">{escena.titulo}</span>
                {estaActiva && reproduciendo && (
                  <div
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-primary transition-all duration-75"
                    style={{ width: `${progresoEscena}%` }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Play/Pause & Controles de avance */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => irAEscena((escenaActiva === 0 ? 2 : escenaActiva - 1) as Escena)}
            aria-label="Escena anterior"
            className="flex size-7 items-center justify-center rounded-lg border border-border/70 bg-card text-muted-foreground hover:text-foreground cursor-pointer shadow-xs"
          >
            <CaretLeftIcon weight="bold" className="size-3" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (reproduciendo) {
                pausarAutoplay();
              } else {
                setReproduciendo(true);
              }
            }}
            aria-label={reproduciendo ? "Pausar" : "Reproducir"}
            className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-2.5 py-1 text-xs font-bold text-foreground hover:bg-muted/40 cursor-pointer shadow-xs"
          >
            {reproduciendo ? (
              <PauseIcon weight="fill" className="size-3 text-indigo-500" />
            ) : (
              <PlayIcon weight="fill" className="size-3 text-emerald-500" />
            )}
            <span className="hidden sm:inline">
              {reproduciendo ? "Pausar" : "Play"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => irAEscena(((escenaActiva + 1) % 3) as Escena)}
            aria-label="Siguiente escena"
            className="flex size-7 items-center justify-center rounded-lg border border-border/70 bg-card text-muted-foreground hover:text-foreground cursor-pointer shadow-xs"
          >
            <CaretRightIcon weight="bold" className="size-3" />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CUERPO DE LA APP: SIDEBAR + ESPACIO DE TRABAJO DINÁMICO   */}
      {/* ========================================================= */}
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-border/80 bg-background shadow-inner transition-colors duration-300",
          modoProyector && escenaActiva === 2 && "bg-zinc-950/95 border-amber-500/40"
        )}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
          {/* ========================================================= */}
          {/* 1. SIDEBAR IZQUIERDO (Jharol O. / Creador de Nouttbuk)    */}
          {/* ========================================================= */}
          <div className="hidden lg:flex lg:col-span-4 xl:col-span-3 flex-col justify-between border-r border-border/70 bg-muted/20 p-4 select-none">
            <div className="space-y-4">
              {/* Usuario: Jharol O. / ClaudeAI */}
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-xs">
                <div className="flex size-9 items-center justify-center rounded-full bg-indigo-600 font-bold text-white text-xs shadow-xs">
                  JO
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-xs font-bold text-foreground">
                    Jharol O.
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    @jharolo / ClaudeAI / PUCP
                  </span>
                </div>
              </div>

              {/* + Nuevo apunte */}
              <button
                type="button"
                onClick={() => irAEscena(2)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
              >
                <PlusIcon weight="bold" className="size-3.5" />
                <span>Nuevo apunte</span>
              </button>

              {/* Mini Widget PomoFocus en sidebar */}
              <div
                onClick={() => irAEscena(1)}
                className={cn(
                  "rounded-2xl border bg-card p-3 space-y-1.5 shadow-xs transition-all cursor-pointer",
                  escenaActiva === 1
                    ? "border-indigo-500/50 ring-2 ring-indigo-500/20 bg-indigo-500/5"
                    : "border-border/70 hover:border-border"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <TimerIcon
                      weight="fill"
                      className={cn("size-3.5 text-indigo-500", pomodoroSonando && "animate-pulse")}
                    />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                      PomoFocus
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    {temaActual.label}
                  </span>
                </div>

                <div className="font-mono text-xl font-bold tracking-tight text-foreground">
                  {formatMinSeg(pomodoroSegundos)}
                </div>
              </div>

              {/* Navegación principal */}
              <div className="space-y-1 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => irAEscena(0)}
                  className={cn(
                    "w-full flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all cursor-pointer text-left",
                    escenaActiva === 0
                      ? "bg-card text-foreground font-bold border border-border/70 shadow-xs"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <HouseIcon
                    weight={escenaActiva === 0 ? "fill" : "regular"}
                    className={cn("size-4", escenaActiva === 0 && "text-primary")}
                  />
                  <span>Inicio</span>
                </button>

                <button
                  type="button"
                  onClick={() => irAEscena(2)}
                  className={cn(
                    "w-full flex items-center justify-between rounded-xl px-3 py-2 transition-all cursor-pointer text-left",
                    escenaActiva === 2
                      ? "bg-card text-foreground font-bold border border-border/70 shadow-xs"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <NotebookIcon
                      weight={escenaActiva === 2 ? "fill" : "regular"}
                      className={cn("size-4", escenaActiva === 2 && "text-primary")}
                    />
                    <span>Mis apuntes</span>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    1
                  </span>
                </button>

                <div className="flex items-center justify-between rounded-xl px-3 py-2 text-muted-foreground hover:bg-muted/50 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <GlobeHemisphereWestIcon className="size-4" />
                    <span>Comunidad</span>
                  </div>
                  <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-600 dark:text-teal-400">
                    PUCP
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl px-3 py-2 text-muted-foreground hover:bg-muted/50 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <CalendarBlankIcon className="size-4" />
                    <span>Calendario</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">Ciclo 2026</span>
                </div>
              </div>

              {/* Carpetas temáticas de Nouttbuk */}
              <div className="pt-1">
                <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Carpetas
                </div>
                <div className="space-y-1 text-xs font-medium">
                  <div
                    onClick={() => irAEscena(2)}
                    className="flex items-center justify-between rounded-xl bg-folder-coral/10 text-folder-coral font-bold px-3 py-1.5 border border-folder-coral/20 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FolderIcon weight="fill" className="size-3.5 shrink-0" />
                      <span className="truncate">Bienvenida PUCP</span>
                    </div>
                    <span className="text-[10px] font-mono">1</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl px-3 py-1.5 text-muted-foreground hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-center gap-2 truncate">
                      <FolderIcon
                        weight="fill"
                        className="size-3.5 text-folder-violet shrink-0"
                      />
                      <span className="truncate">Comunidad y Guías</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">3</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1">
                Hecho con <HeartIcon weight="fill" className="size-3 text-red-500 inline" /> para PUCP
              </span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircleIcon weight="fill" className="size-3.5" /> Verificado
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. ÁREA CENTRAL DINÁMICA (Bienvenida y Manifiesto)       */}
          {/* ========================================================= */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col justify-between bg-card min-w-0">
            {/* ======================================================= */}
            {/* ESCENA 0: INICIO (Bienvenida cálida para la PUCP)        */}
            {/* ======================================================= */}
            {escenaActiva === 0 && (
              <div className="flex-1 p-5 sm:p-8 flex flex-col justify-between space-y-6">
                {/* Saludo personal */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    Hola, comunidad PUCP 👋
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Un cuaderno digital pensado para estudiar en la universidad
                  </p>
                </div>

                {/* 2 Carpetas de Bienvenida */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2.5">
                    Empieza por aquí
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => irAEscena(2)}
                      className="flex items-center gap-3 p-3.5 rounded-2xl border border-border/70 bg-card hover:border-primary/50 transition-all cursor-pointer shadow-xs"
                    >
                      <FolderIcon
                        weight="fill"
                        className="size-9 shrink-0 text-folder-coral"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-foreground truncate">
                          Bienvenida PUCP
                        </div>
                        <div className="text-[11px] text-muted-foreground">Nota de inicio</div>
                      </div>
                    </div>

                    <div
                      onClick={() => irAEscena(2)}
                      className="flex items-center gap-3 p-3.5 rounded-2xl border border-border/70 bg-card hover:border-primary/50 transition-all cursor-pointer shadow-xs"
                    >
                      <FolderIcon
                        weight="fill"
                        className="size-9 shrink-0 text-folder-violet"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-foreground truncate">
                          Comunidad y Guías
                        </div>
                        <div className="text-[11px] text-muted-foreground">Para 55 carreras</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Apunte Destacado con lomo anillado */}
                <div
                  onClick={() => irAEscena(2)}
                  className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 pl-7 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group shadow-xs"
                >
                  {/* Lomo Anillado Fiel a Nouttbuk */}
                  <div
                    className="pointer-events-none absolute inset-y-0 left-0 w-3.5 border-r border-black/10 shadow-[inset_-1px_0_2px_rgba(0,0,0,0.15)]"
                    style={{ backgroundColor: "var(--color-folder-coral, #F2704F)" }}
                    aria-hidden
                  >
                    <div className="absolute inset-y-0 right-0 flex flex-col justify-evenly py-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="relative flex w-[14px] items-center">
                          <div className="absolute left-[3px] z-10 size-2 rounded-full bg-background shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]" />
                          <div className="absolute left-0 z-20 h-[3px] w-[12px] rounded-full border border-black/20 bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-500 shadow-xs" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-bold text-folder-coral">
                      Bienvenida PUCP
                    </span>
                    <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-600 dark:text-teal-400">
                      Nota fijada
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    Por qué creé Nouttbuk para la PUCP
                  </h3>

                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                    Para no perder apuntes entre grupos de WhatsApp y tener un lugar limpio donde estudiar juntos en los exámenes.
                  </p>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                    <span>Por Jharol O.</span>
                    <span className="flex items-center gap-1 text-primary font-bold">
                      Leer nota en el Atelier
                      <ArrowRightIcon className="size-3" />
                    </span>
                  </div>
                </div>

                {/* Banner sutil para iniciar PomoFocus */}
                <div
                  onClick={() => irAEscena(1)}
                  className="flex items-center justify-between rounded-2xl border border-indigo-500/30 bg-indigo-500/5 px-4 py-3 cursor-pointer hover:bg-indigo-500/10 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <TimerIcon weight="fill" className="size-4 text-indigo-500" />
                    <span className="text-xs font-semibold text-foreground">
                      Sesión de 25 min lista con audio de lluvia
                    </span>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    Iniciar Focus
                    <ArrowRightIcon className="size-3" />
                  </span>
                </div>
              </div>
            )}

            {/* ======================================================= */}
            {/* ESCENA 1: POMOFOCUS (Enfoque y calma para estudiar)     */}
            {/* ======================================================= */}
            {escenaActiva === 1 && (
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Lado izquierdo: Objetivo y bienvenida a la concentración */}
                <div className="flex-1 p-5 sm:p-7 flex flex-col justify-between space-y-4 border-b md:border-b-0 md:border-r border-border/70 bg-card">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Tu primera sesión
                      </span>
                      <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        Campus PUCP
                      </span>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                      <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                        Meta activa
                      </div>
                      <div className="text-sm font-bold text-foreground">
                        Concentración en la biblioteca Central
                      </div>
                    </div>

                    {/* Solo 2 tareas esenciales */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-foreground block">
                        Primeros pasos recomendados
                      </span>

                      <div className="space-y-1.5">
                        {tareas.map((tarea) => (
                          <div
                            key={tarea.id}
                            onClick={() => toggleTarea(tarea.id)}
                            className={cn(
                              "flex items-center gap-2.5 rounded-xl border p-2.5 text-xs transition-all cursor-pointer select-none",
                              tarea.hecha
                                ? "border-emerald-500/30 bg-emerald-500/5 text-muted-foreground"
                                : "border-border/70 bg-card hover:bg-muted/30 text-foreground"
                            )}
                          >
                            <button
                              type="button"
                              className={cn(
                                "shrink-0 transition-colors",
                                tarea.hecha ? "text-emerald-500" : "text-muted-foreground"
                              )}
                            >
                              {tarea.hecha ? (
                                <CheckCircleIcon weight="fill" className="size-4 text-emerald-500" />
                              ) : (
                                <CircleIcon className="size-4" />
                              )}
                            </button>
                            <span
                              className={cn(
                                "flex-1 font-medium leading-tight",
                                tarea.hecha && "line-through opacity-70"
                              )}
                            >
                              {tarea.texto}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => irAEscena(2)}
                    className="text-xs text-primary font-bold hover:underline flex items-center justify-between pt-3 border-t border-border/60"
                  >
                    <span>Leer la carta en el Atelier</span>
                    <ArrowRightIcon className="size-3.5" />
                  </button>
                </div>

                {/* Lado derecho: Orb circular con sonido ambiental */}
                <div
                  className={cn(
                    "flex-1 p-6 flex flex-col items-center justify-between bg-gradient-to-br transition-all duration-700 select-none",
                    temaActual.bgGradient
                  )}
                >
                  <div className="w-full flex items-center justify-between">
                    <span className={cn("text-xs font-bold uppercase tracking-wider", temaActual.textColor)}>
                      {temaActual.label}
                    </span>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/30 border border-white/10", temaActual.textColor)}>
                      Focus activo
                    </span>
                  </div>

                  {/* Orb central */}
                  <div className="relative flex size-44 items-center justify-center my-2">
                    <svg
                      className="absolute inset-0 size-full -rotate-90 pointer-events-none"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="3.5"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeDasharray="283"
                        strokeDashoffset={283 - (283 * porcentajePomodoro) / 100}
                        strokeLinecap="round"
                        className={cn("transition-all duration-1000 ease-linear", temaActual.textColor)}
                      />
                    </svg>

                    <div
                      className={cn(
                        "flex flex-col size-36 items-center justify-center rounded-full border backdrop-blur-md shadow-xl",
                        temaActual.orbBorder,
                        temaActual.orbBg,
                        pomodoroSonando && `shadow-[0_0_40px_-5px] ${temaActual.pulseColor}`
                      )}
                    >
                      <span className="text-3xl font-bold font-mono tracking-tight text-white">
                        {formatMinSeg(pomodoroSegundos)}
                      </span>
                      <span className="text-[10px] text-white/80 font-bold uppercase mt-1">
                        {pomodoroSonando ? "Sonido activo" : "Pausado"}
                      </span>
                    </div>
                  </div>

                  {/* Controles y 3 ambientes de audio */}
                  <div className="w-full flex flex-col items-center gap-3">
                    <div className="flex items-center gap-3 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          pausarAutoplay();
                          setPomodoroSegundos(1500);
                        }}
                        className={cn("p-1.5 rounded-full hover:bg-white/10 cursor-pointer", temaActual.textColor)}
                        title="Reiniciar"
                      >
                        <ArrowCounterClockwiseIcon className="size-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          pausarAutoplay();
                          setPomodoroSonando(!pomodoroSonando);
                        }}
                        className={cn(
                          "flex size-9 items-center justify-center rounded-full cursor-pointer shadow-md transition-transform active:scale-95",
                          temaActual.accentBg,
                          temaActual.accentText
                        )}
                      >
                        {pomodoroSonando ? (
                          <PauseIcon weight="fill" className="size-4" />
                        ) : (
                          <PlayIcon weight="fill" className="size-4 ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* 3 Sonidos básicos */}
                    <div className="grid grid-cols-3 gap-1.5 w-full max-w-[240px]">
                      {(["rain", "lofi", "cafe"] as PomodoroThemeId[]).map((id) => {
                        const conf = POMODORO_THEMES[id];
                        const Icon = conf.icon;
                        const esActivo = pomodoroTema === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              pausarAutoplay();
                              setPomodoroTema(id);
                            }}
                            className={cn(
                              "flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[10px] font-bold text-white transition-all cursor-pointer",
                              esActivo ? "bg-white/20 shadow-xs" : "opacity-50 hover:opacity-100"
                            )}
                          >
                            <Icon weight={esActivo ? "fill" : "regular"} className="size-3.5" />
                            <span>{conf.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================= */}
            {/* ESCENA 2: CARTA ATELIER (Mensaje con amor para la PUCP)  */}
            {/* ======================================================= */}
            {escenaActiva === 2 && (
              <div className="flex-1 flex flex-col justify-between">
                {/* Cabecera Atelier */}
                <div className="border-b border-border/70 bg-card px-4 py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-sm text-foreground truncate">
                      Una carta para mi querida PUCP
                    </span>
                    <CloudCheckIcon weight="fill" className="size-3.5 text-teal-500 shrink-0" />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        pausarAutoplay();
                        setModoProyector(!modoProyector);
                      }}
                      className={cn(
                        "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                        modoProyector
                          ? "border-amber-500/50 bg-amber-500/20 text-amber-700 dark:text-amber-300"
                          : "border-border/70 bg-muted/30 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <LightbulbIcon weight={modoProyector ? "fill" : "regular"} className="size-3.5" />
                      <span className="hidden sm:inline">Modo Proyector</span>
                    </button>

                    <div className="flex items-center rounded-lg bg-muted/40 p-0.5 border border-border/70 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          pausarAutoplay();
                          setVisibilidad("privado");
                        }}
                        className={cn(
                          "px-2 py-0.5 rounded-md font-medium cursor-pointer transition-all",
                          visibilidad === "privado" ? "bg-card text-foreground font-bold shadow-xs" : "text-muted-foreground"
                        )}
                      >
                        Privado
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          pausarAutoplay();
                          setVisibilidad("grupo");
                        }}
                        className={cn(
                          "px-2 py-0.5 rounded-md font-medium cursor-pointer transition-all",
                          visibilidad === "grupo" ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold" : "text-muted-foreground"
                        )}
                      >
                        Grupo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          pausarAutoplay();
                          setVisibilidad("comunidad");
                        }}
                        className={cn(
                          "px-2 py-0.5 rounded-md font-medium cursor-pointer transition-all",
                          visibilidad === "comunidad" ? "bg-teal-500/15 text-teal-600 dark:text-teal-400 font-bold" : "text-muted-foreground"
                        )}
                      >
                        Comunidad
                      </button>
                    </div>
                  </div>
                </div>

                {/* Hoja de cuaderno auténtica con la carta */}
                <div
                  className={cn(
                    "relative flex-1 p-4 sm:p-7 flex justify-center items-center overflow-hidden transition-all duration-300",
                    modoProyector ? "bg-zinc-950/90" : "bg-muted/30 dark:bg-zinc-950/60"
                  )}
                >
                  {modoProyector && (
                    <div
                      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_75%_at_50%_0%,rgba(251,191,36,0.2),transparent_75%)]"
                      aria-hidden
                    />
                  )}

                  <div
                    className={cn(
                      "relative z-10 w-full max-w-2xl rounded-r-2xl rounded-l-md border bg-card flex overflow-hidden shadow-lg",
                      modoProyector && "border-amber-500/50 shadow-amber-500/10"
                    )}
                  >
                    {/* Lomo anillado coral */}
                    <div
                      className="pointer-events-none relative w-4 shrink-0 border-r border-black/15 shadow-[inset_-1px_0_2px_rgba(0,0,0,0.15)]"
                      style={{ backgroundColor: "var(--color-folder-coral, #F2704F)" }}
                      aria-hidden
                    >
                      <div className="absolute inset-y-0 right-0 flex flex-col justify-evenly py-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="relative flex w-[18px] items-center">
                            <div className="absolute left-[6px] z-10 size-2.5 rounded-full bg-background/90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]" />
                            <div className="absolute left-0 z-20 h-[4px] w-[17px] rounded-full border border-black/25 bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-500 shadow-xs" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Superficie de la carta */}
                    <div className="flex-1 p-5 sm:p-7 pl-6 flex flex-col justify-between space-y-3.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/60 pb-2">
                        <span className="font-bold text-folder-coral">Bienvenida PUCP</span>
                        <span>Mensaje del Creador</span>
                      </div>

                      {/* Título en Newsreader Serif */}
                      <div className="space-y-1">
                        <h2
                          className={cn(
                            "text-xl sm:text-2xl font-bold tracking-tight text-foreground font-[family-name:var(--font-manuscrito)]",
                            modoProyector && "text-amber-900 dark:text-amber-100"
                          )}
                        >
                          Por qué creé Nouttbuk para la PUCP
                        </h2>
                      </div>

                      {/* Párrafo del mensaje humano y directo */}
                      <p className="text-xs sm:text-sm leading-relaxed text-foreground/90">
                        Hice Nouttbuk porque estaba cansado de perder apuntes entre grupos de WhatsApp y carpetas desordenadas de Drive. Quería que tuviéramos un cuaderno limpio, organizado por cursos, donde estudiar juntos en los exámenes sea simple y podamos compartir resúmenes en la{" "}
                        <span
                          onMouseEnter={() => setHipertextoActivo(true)}
                          onMouseLeave={() => setHipertextoActivo(false)}
                          onClick={() => setHipertextoActivo(!hipertextoActivo)}
                          className="relative inline-flex items-center gap-1 rounded-md bg-teal-500/15 px-1.5 py-0.5 font-semibold text-teal-700 dark:text-teal-300 border border-teal-500/25 cursor-pointer hover:bg-teal-500/25 transition-colors"
                        >
                          <LinkSimpleIcon className="size-3" />
                          [[Comunidad PUCP]]
                          {hipertextoActivo && (
                            <span className="absolute bottom-full left-0 mb-1.5 z-30 w-56 rounded-xl border border-border bg-popover p-2 text-[11px] text-popover-foreground shadow-lg">
                              Espacio abierto para consultar y compartir apuntes de cursos de la universidad.
                            </span>
                          )}
                        </span>
                        . Espero que te sirva mucho en este ciclo.
                      </p>

                      {/* Mensaje de Jharol */}
                      <div className="relative mt-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2.5 text-xs text-foreground flex items-center gap-2">
                        <span className="font-semibold text-indigo-700 dark:text-indigo-300 text-[11px] leading-tight">
                          Jharol: &ldquo;Cualquier sugerencia para mejorar la app me escribes por aquí.&rdquo;
                        </span>
                      </div>

                      <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                        <span>Página 1 de 1</span>
                        <span className="text-teal-600 dark:text-teal-400 font-medium flex items-center gap-1">
                          <CheckCircleIcon weight="fill" className="size-3" />
                          Hecho para la PUCP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pie de navegación simple */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground px-2">
        <span>Haz clic en cualquier elemento para interactuar libremente</span>
        <button
          type="button"
          onClick={() => {
            if (reproduciendo) {
              pausarAutoplay();
            } else {
              setReproduciendo(true);
            }
          }}
          className="text-primary font-bold hover:underline cursor-pointer"
        >
          {reproduciendo ? "Pausar tour automático" : "Reanudar tour automático ▶"}
        </button>
      </div>
    </div>
  );
}
