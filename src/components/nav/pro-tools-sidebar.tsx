"use client";

import { useState } from "react";
import { 
  NotePencilIcon, 
  CheckSquareOffsetIcon, 
  TimerIcon, 
  SparkleIcon,
  PlayIcon,
  PauseIcon,
  ArrowCounterClockwiseIcon,
  CloudRainIcon,
  CoffeeIcon,
  HeadphonesIcon,
  SpeakerSlashIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  CircleIcon
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProTools } from "@/lib/context/pro-tools-context";

function GlobalContextLinker({ 
  carpetas, 
  activeCarpetaId, 
  setActiveCarpetaId, 
  isPomodoro 
}: { 
  carpetas: any[]; 
  activeCarpetaId: string | null; 
  setActiveCarpetaId: (id: string | null) => void;
  isPomodoro?: boolean;
}) {
  if (carpetas.length === 0) return null;

  const activeCarpeta = carpetas.find(c => c.id === activeCarpetaId);

  return (
    <div className={cn(
      "flex items-center gap-2 mb-4 w-full bg-card p-2 rounded-xl border border-border/50 shadow-sm",
      isPomodoro && "bg-transparent border-none shadow-none mb-0 p-0"
    )}>
      <span className={cn(
        "text-[10px] text-muted-foreground font-bold uppercase tracking-wider shrink-0 ml-1",
        isPomodoro && "text-white/80"
      )}>
        Vincular a:
      </span>
      
      <Select 
        value={activeCarpetaId || "global"} 
        onValueChange={(v) => setActiveCarpetaId(v === "global" ? null : v)}
      >
        <SelectTrigger className={cn(
          "flex-1 h-8 text-xs bg-muted/50 border-transparent rounded-lg focus:ring-0",
          isPomodoro && "bg-black/20 text-white hover:bg-black/30"
        )}>
          {activeCarpeta ? (
            <div className="flex items-center gap-2 font-medium">
              {activeCarpeta.icono && <span>{activeCarpeta.icono}</span>}
              <span className="truncate max-w-[120px]">{activeCarpeta.nombre}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 font-medium">
              <span>🌍</span>
              <span>Ninguna (Global)</span>
            </div>
          )}
        </SelectTrigger>
        <SelectContent className="z-[100] max-h-[300px]">
          <SelectItem value="global">
            <div className="flex items-center gap-2">
              <span>🌍</span>
              <span>Ninguna (Global)</span>
            </div>
          </SelectItem>
          {carpetas.map(c => (
            <SelectItem key={c.id} value={c.id}>
              <div className="flex items-center gap-2">
                {c.icono && <span>{c.icono}</span>}
                <span>{c.nombre}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const PRO_TOOLS = [
  { id: "notas", label: "Notas Rápidas", icon: NotePencilIcon },
  { id: "tasks", label: "Tareas", icon: CheckSquareOffsetIcon },
  { id: "pomodoro", label: "Pomodoro", icon: TimerIcon },
] as const;

export function ProToolsSidebar() {
  const { 
    activeTool, setActiveTool, 
    activeCarpetaId, setActiveCarpetaId, carpetas,
    postIts, addPostIt, updatePostIt, removePostIt,
    pomodoroTime, pomodoroMode, pomodoroIsRunning, pomodoroTheme, pomodoroGoal,
    togglePomodoro, resetPomodoro, setPomodoroTheme, setPomodoroGoal,
    tasks, addTask, toggleTask, removeTask
  } = useProTools();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const filteredPostIts = activeCarpetaId 
    ? postIts.filter(p => p.carpetaId === activeCarpetaId)
    : postIts.filter(p => !p.carpetaId);

  const filteredTasks = activeCarpetaId 
    ? tasks.filter(t => t.carpetaId === activeCarpetaId)
    : tasks.filter(t => !t.carpetaId);

  return (
    <>
      {/* --- Desktop Slim Sidebar --- */}
      <aside className="hidden sticky top-0 h-screen w-16 shrink-0 flex-col items-center gap-4 border-l border-border bg-sidebar py-8 text-sidebar-foreground xl:flex z-40">
        <div className="flex flex-col items-center gap-2 w-full px-2">
          {/* Cabecera / Branding PRO */}
          <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 mb-2" title="Herramientas PRO">
            <SparkleIcon weight="fill" className="size-5" />
          </div>

          <div className="h-px w-8 bg-border/50 mb-2" aria-hidden />

          {/* Botones de Herramientas */}
          {PRO_TOOLS.map((tool) => {
            const Icono = tool.icon;
            const activo = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(activo ? null : tool.id)}
                className={cn(
                  "flex size-11 cursor-pointer items-center justify-center rounded-xl transition-all",
                  activo 
                    ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" 
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                title={tool.label}
              >
                <Icono weight={activo ? "fill" : "regular"} className="size-[22px]" />
              </button>
            );
          })}
        </div>
      </aside>

      {/* --- Mobile FAB (Right side, above the other FAB) with Radial Menu --- */}
      <div className="fixed bottom-[140px] right-4 z-50 xl:hidden">
        {/* Overlay invisible para cerrar al tocar fuera */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 z-0" 
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
        
        <div className="relative flex items-center justify-center z-10 w-11 h-11">
          {/* Radial Items */}
          {PRO_TOOLS.map((tool, i) => {
            const angle = (90 + i * 45) * (Math.PI / 180);
            const radius = 80; 
            const x = mobileMenuOpen ? Math.cos(angle) * radius : 0;
            const y = mobileMenuOpen ? -Math.sin(angle) * radius : 0;
            const activo = activeTool === tool.id;
            const Icono = tool.icon;

            return (
              <button
                key={tool.id}
                onClick={() => {
                  setActiveTool(activo ? null : tool.id);
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "absolute left-1/2 top-1/2 flex size-[44px] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full shadow-md transition-all duration-300",
                  activo ? "bg-indigo-500 text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                style={{
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${mobileMenuOpen ? 1 : 0.5})`,
                  opacity: mobileMenuOpen ? 1 : 0,
                  pointerEvents: mobileMenuOpen ? "auto" : "none",
                  transitionDelay: mobileMenuOpen ? `${i * 30}ms` : "0ms",
                }}
                title={tool.label}
              >
                <Icono weight={activo ? "fill" : "regular"} className="size-5" />
              </button>
            );
          })}

          <Button 
            size="icon-xl" 
            variant="secondary"
            className={cn(
              "relative z-10 w-full h-full p-0 flex items-center justify-center rounded-full shadow-lg border border-border transition-colors duration-300 cursor-pointer",
              mobileMenuOpen ? "bg-indigo-500/10 text-indigo-500" : "bg-card text-indigo-500 hover:text-indigo-600 hover:bg-accent"
            )}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <SparkleIcon weight={activeTool || mobileMenuOpen ? "fill" : "regular"} className="size-6" />
          </Button>
        </div>
      </div>

      {/* --- Panels (Sheets) --- */}
      <Sheet open={activeTool !== null} onOpenChange={(o) => { if (!o) setActiveTool(null); }}>
        <SheetContent 
          side="right" 
          className="w-[320px] sm:w-[380px] p-0 flex flex-col shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] 
                     m-4 sm:m-6 h-[calc(100%-32px)] sm:h-[calc(100%-48px)] rounded-3xl right-0 xl:right-16 
                     border border-border/50 bg-card overflow-hidden
                     transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
                     data-starting-style:translate-x-32 data-ending-style:translate-x-32"
        >
          {activeTool === "notas" && (
            <>
              <SheetHeader className="border-b border-border/50 bg-muted/30 px-6 py-5 shrink-0 flex flex-col items-start gap-4">
                <SheetTitle className="flex items-center gap-2">
                  <NotePencilIcon className="size-5 text-indigo-500" />
                  Pizarra de Post-its
                </SheetTitle>
                <div className="flex items-center gap-2 w-full">
                  <span className="text-xs text-muted-foreground mr-1">Nuevo:</span>
                  {["yellow", "blue", "pink", "green"].map((color) => {
                    const colorMap = {
                      yellow: "bg-yellow-400 hover:bg-yellow-500",
                      blue: "bg-blue-400 hover:bg-blue-500",
                      pink: "bg-pink-400 hover:bg-pink-500",
                      green: "bg-green-400 hover:bg-green-500"
                    };
                    return (
                      <button 
                        key={color}
                        onClick={() => addPostIt(color as any)} 
                        className={cn("size-7 rounded-full shadow-sm cursor-pointer transition-transform active:scale-90 flex items-center justify-center text-black/50 hover:shadow-md", colorMap[color as keyof typeof colorMap])}
                        title={`Nuevo Post-it ${color}`}
                      >
                        <PlusIcon weight="bold" className="size-4" />
                      </button>
                    );
                  })}
                </div>
              </SheetHeader>
              <div className="flex flex-1 flex-col p-6 bg-muted/10 overflow-y-auto">
                <GlobalContextLinker 
                  carpetas={carpetas} 
                  activeCarpetaId={activeCarpetaId} 
                  setActiveCarpetaId={setActiveCarpetaId} 
                />
                
                {filteredPostIts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 opacity-50 text-muted-foreground pb-10">
                    <NotePencilIcon className="size-12 mb-3" />
                    <p className="text-sm font-medium">Pizarra vacía.</p>
                    <p className="text-xs text-center px-4 mt-1">Añade post-its de colores para guardar ideas rápidas.</p>
                  </div>
                ) : (
                  <div className="columns-2 gap-3 space-y-3">
                    {filteredPostIts.map(postIt => {
                      const colorClasses = {
                        yellow: "bg-yellow-100 text-yellow-900 border-yellow-200",
                        blue: "bg-blue-100 text-blue-900 border-blue-200",
                        pink: "bg-pink-100 text-pink-900 border-pink-200",
                        green: "bg-green-100 text-green-900 border-green-200",
                        purple: "bg-purple-100 text-purple-900 border-purple-200"
                      }[postIt.color] || "bg-yellow-100 text-yellow-900 border-yellow-200";

                      return (
                        <div key={postIt.id} className={cn("relative p-3 rounded-xl border shadow-sm flex flex-col group break-inside-avoid", colorClasses)}>
                          <button 
                            onClick={() => removePostIt(postIt.id)} 
                            className="absolute top-2 right-2 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity p-1.5 hover:bg-black/10 rounded-md cursor-pointer"
                          >
                            <TrashIcon className="size-3.5" />
                          </button>
                          <textarea
                            value={postIt.text}
                            onChange={(e) => updatePostIt(postIt.id, e.target.value)}
                            placeholder="Escribe algo..."
                            className="w-full h-28 bg-transparent resize-none outline-none text-sm font-medium leading-relaxed placeholder:text-black/30 mt-4"
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTool === "tasks" && (
            <>
              <SheetHeader className="border-b border-border/50 bg-muted/30 px-6 py-5 shrink-0">
                <SheetTitle className="flex items-center gap-2">
                  <CheckSquareOffsetIcon className="size-5 text-indigo-500" />
                  To-Dos del Día
                </SheetTitle>
              </SheetHeader>
              
              <div className="flex flex-col flex-1 overflow-hidden p-6 gap-6">
                <GlobalContextLinker 
                  carpetas={carpetas} 
                  activeCarpetaId={activeCarpetaId} 
                  setActiveCarpetaId={setActiveCarpetaId} 
                />
                
                {/* Input Tarea */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    addTask(newTaskText);
                    setNewTaskText("");
                  }}
                  className="flex items-center gap-2 shrink-0 -mt-2"
                >
                  <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Escribe una tarea y presiona Enter..."
                    className="flex-1 rounded-xl border border-border/50 bg-muted/50 px-4 py-3 text-sm outline-none transition-colors focus:border-indigo-500/50 focus:bg-card"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="shrink-0 rounded-xl size-[46px] bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm cursor-pointer disabled:cursor-default"
                    disabled={!newTaskText.trim()}
                  >
                    <PlusIcon weight="bold" className="size-5" />
                  </Button>
                </form>

                {/* Lista de tareas */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                  {filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 pb-10">
                      <CheckSquareOffsetIcon className="size-12 mb-3" />
                      <p className="text-sm font-medium">Todo al día.</p>
                      <p className="text-xs">Añade tareas para tu sesión de hoy.</p>
                    </div>
                  ) : (
                    filteredTasks.map((task) => (
                      <div 
                        key={task.id} 
                        className="group flex items-start gap-3 rounded-xl border border-transparent p-3 hover:border-border/50 hover:bg-muted/30 transition-all cursor-pointer"
                        onClick={() => toggleTask(task.id)}
                      >
                        <button
                          className={cn(
                            "mt-0.5 shrink-0 transition-colors cursor-pointer",
                            task.completed ? "text-indigo-500" : "text-muted-foreground hover:text-indigo-500/50"
                          )}
                        >
                          {task.completed ? (
                            <CheckCircleIcon weight="fill" className="size-6" />
                          ) : (
                            <CircleIcon className="size-6" />
                          )}
                        </button>
                        
                        <span className={cn(
                          "flex-1 text-sm leading-relaxed pt-0.5 transition-all duration-300",
                          task.completed ? "text-muted-foreground line-through opacity-50" : "text-foreground"
                        )}>
                          {task.text}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTask(task.id);
                          }}
                          className="shrink-0 text-muted-foreground/30 hover:text-red-500 transition-colors opacity-100 xl:opacity-0 xl:group-hover:opacity-100 p-1 cursor-pointer"
                          title="Eliminar tarea"
                        >
                          <TrashIcon className="size-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {activeTool === "pomodoro" && (() => {
            // Diccionario de temas visuales para la inmersión
            const themeConfig = {
              silent: {
                bgGradient: "from-slate-900 via-slate-800 to-slate-950",
                orbColor: "border-slate-500/30 bg-slate-500/10",
                textColor: "text-slate-200",
                accentColor: "bg-slate-200 text-slate-900",
                pulse: "shadow-slate-500/20",
                label: "Focus Puro"
              },
              rain: {
                bgGradient: "from-blue-900 via-cyan-900 to-slate-900",
                orbColor: "border-blue-400/30 bg-blue-500/10",
                textColor: "text-blue-100",
                accentColor: "bg-blue-400 text-blue-950",
                pulse: "shadow-blue-500/30",
                label: "Tormenta"
              },
              lofi: {
                bgGradient: "from-fuchsia-900 via-purple-900 to-indigo-950",
                orbColor: "border-fuchsia-400/30 bg-fuchsia-500/10",
                textColor: "text-fuchsia-100",
                accentColor: "bg-fuchsia-400 text-fuchsia-950",
                pulse: "shadow-fuchsia-500/30",
                label: "Lo-Fi Beats"
              },
              cafe: {
                bgGradient: "from-orange-900 via-amber-900 to-stone-900",
                orbColor: "border-orange-400/30 bg-orange-500/10",
                textColor: "text-orange-100",
                accentColor: "bg-orange-400 text-orange-950",
                pulse: "shadow-orange-500/30",
                label: "Cafetería"
              }
            };

            const current = themeConfig[pomodoroTheme];
            const maxTime = pomodoroMode === "work" ? 25 * 60 : 5 * 60;
            const progress = ((maxTime - pomodoroTime) / maxTime) * 100;

            return (
              <div className={cn(
                "flex flex-1 flex-col overflow-hidden transition-colors duration-700 bg-gradient-to-br",
                current.bgGradient
              )}>
                
                {/* Header inmersivo (sin fondo para integrarse al gradiente) */}
                <SheetHeader className="px-6 py-5 shrink-0 z-10 flex flex-row items-center justify-between">
                  <SheetTitle className={cn("flex items-center gap-2 font-medium tracking-wide", current.textColor)}>
                    <TimerIcon className="size-5" />
                    {current.label}
                  </SheetTitle>
                  <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full bg-black/20 backdrop-blur-md border border-white/10", current.textColor)}>
                    {pomodoroMode === "work" ? "🔥 FOCUS" : "☕ BREAK"}
                  </span>
                </SheetHeader>
                
                <div className="flex flex-1 flex-col px-6 pb-6 items-center z-10 overflow-y-auto">
                  
                  {/* Context Linker Global */}
                  <div className="w-full mt-4">
                    <GlobalContextLinker 
                      carpetas={carpetas} 
                      activeCarpetaId={activeCarpetaId} 
                      setActiveCarpetaId={setActiveCarpetaId}
                      isPomodoro
                    />
                  </div>
                  
                  {/* Orb / Timer Principal con efecto respiración y anillo de progreso SVG */}
                  <div className="relative flex size-56 items-center justify-center mt-2">
                    {/* SVG Progress Ring */}
                    <svg className="absolute inset-0 size-full -rotate-90 pointer-events-none drop-shadow-xl" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                      <circle 
                        cx="50" cy="50" r="46" fill="none" 
                        stroke="currentColor" strokeWidth="4" 
                        strokeDasharray="289" strokeDashoffset={289 - (289 * progress) / 100} 
                        strokeLinecap="round"
                        className={cn("transition-all duration-1000 ease-linear", current.textColor)}
                      />
                    </svg>

                    {/* Glassmorphism Orb */}
                    <div className={cn(
                      "flex flex-col size-48 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-700 shadow-2xl",
                      current.orbColor,
                      pomodoroIsRunning && `shadow-[0_0_40px_-10px] ${current.pulse}`
                    )}>
                      <span className="text-5xl font-bold font-mono tracking-tighter text-white drop-shadow-md">
                        {formatTime(pomodoroTime)}
                      </span>
                      {pomodoroIsRunning && (
                        <span className={cn("mt-2 text-xs font-medium uppercase tracking-widest animate-pulse", current.textColor)}>
                          Corriendo...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Input de Meta/Objetivo (Goal Tracker) */}
                  <div className="w-full mt-6 mb-4 px-4 relative">
                    <input
                      type="text"
                      placeholder="¿En qué te enfocarás hoy?"
                      value={pomodoroGoal}
                      onChange={(e) => setPomodoroGoal(e.target.value)}
                      className={cn(
                        "w-full bg-transparent border-b-2 border-white/10 pb-2 text-center text-lg font-medium outline-none transition-colors focus:border-white/40 placeholder:text-white/20",
                        current.textColor
                      )}
                    />
                  </div>

                  {/* Sugerencias de Tareas */}
                  {filteredTasks.filter(t => !t.completed).length > 0 && (
                    <div className="w-full px-2 mb-6 -mt-2">
                      <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                        {filteredTasks.filter(t => !t.completed).map(task => (
                          <button
                            key={task.id}
                            onClick={() => setPomodoroGoal(task.text)}
                            className={cn(
                              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors cursor-pointer",
                              pomodoroGoal === task.text 
                                ? "bg-white/20 border-white/40" 
                                : "bg-black/10 border-white/10 hover:bg-black/20",
                              current.textColor
                            )}
                          >
                            {task.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Main Action Area (Ocupa el espacio desperdiciado) */}
                  <div className="w-full flex flex-col items-center gap-6 mt-auto">
                    
                    {/* Controles de reproducción reinventados */}
                    <div className="flex items-center justify-center gap-6 bg-black/20 backdrop-blur-md p-3 rounded-full border border-white/10 shadow-inner">
                      <button
                        onClick={() => resetPomodoro(pomodoroMode)}
                        className={cn("p-3 rounded-full transition-colors hover:bg-white/10 cursor-pointer", current.textColor)}
                        title="Reiniciar"
                      >
                        <ArrowCounterClockwiseIcon className="size-5" />
                      </button>
                      
                      <button
                        onClick={togglePomodoro}
                        className={cn(
                          "flex size-16 items-center justify-center rounded-full shadow-lg transition-transform active:scale-90 cursor-pointer",
                          current.accentColor
                        )}
                      >
                        {pomodoroIsRunning ? (
                          <PauseIcon weight="fill" className="size-8" />
                        ) : (
                          <PlayIcon weight="fill" className="size-8 translate-x-0.5" />
                        )}
                      </button>

                      <button
                        onClick={() => resetPomodoro(pomodoroMode === "work" ? "break" : "work")}
                        className={cn("p-3 rounded-full transition-colors hover:bg-white/10 cursor-pointer", current.textColor)}
                        title="Alternar Modo"
                      >
                        <TimerIcon className="size-5" />
                      </button>
                    </div>
                    
                    {/* Selector de mundos/temas */}
                    <div className="w-full grid grid-cols-4 gap-3 bg-black/20 backdrop-blur-md p-2 rounded-2xl border border-white/10 mt-4">
                      {[
                        { id: "silent", icon: SpeakerSlashIcon },
                        { id: "rain", icon: CloudRainIcon },
                        { id: "lofi", icon: HeadphonesIcon },
                        { id: "cafe", icon: CoffeeIcon }
                      ].map((theme) => {
                         const Icon = theme.icon;
                         const isActive = pomodoroTheme === theme.id;
                         return (
                           <button
                             key={theme.id}
                             onClick={() => setPomodoroTheme(theme.id as any)}
                             className={cn(
                               "flex flex-col items-center justify-center py-3 rounded-xl transition-all cursor-pointer",
                               isActive 
                                 ? "bg-white/20 shadow-sm" 
                                 : "hover:bg-white/5 opacity-50 hover:opacity-100"
                             )}
                           >
                             <Icon weight={isActive ? "fill" : "regular"} className={cn("size-6", current.textColor)} />
                           </button>
                         );
                      })}
                    </div>
                    
                  </div>
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>
    </>
  );
}
