"use client";

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

export type ProToolType = "notas" | "tasks" | "pomodoro" | null;
export type PomodoroTheme = "silent" | "rain" | "lofi" | "cafe";

export type ProTask = {
  id: string;
  text: string;
  completed: boolean;
  carpetaId?: string | null;
};

export type PostIt = {
  id: string;
  text: string;
  color: "yellow" | "blue" | "pink" | "green" | "purple";
  carpetaId?: string | null;
};

export type CarpetaMini = {
  id: string;
  nombre: string;
  icono: string | null;
  color: string;
};

type ProToolsState = {
  activeTool: ProToolType;
  setActiveTool: (tool: ProToolType) => void;

  // Contexto Global de Enfoque
  activeCarpetaId: string | null;
  setActiveCarpetaId: (id: string | null) => void;
  carpetas: CarpetaMini[];

  // Post-its (Notas Rápidas)
  postIts: PostIt[];
  addPostIt: (color?: PostIt["color"]) => void;
  updatePostIt: (id: string, text: string) => void;
  removePostIt: (id: string) => void;

  // Pomodoro
  pomodoroTime: number;
  pomodoroMode: "work" | "break";
  pomodoroIsRunning: boolean;
  pomodoroTheme: PomodoroTheme;
  pomodoroGoal: string;
  togglePomodoro: () => void;
  resetPomodoro: (mode: "work" | "break") => void;
  setPomodoroTheme: (theme: PomodoroTheme) => void;
  setPomodoroGoal: (goal: string) => void;

  // Tareas
  tasks: ProTask[];
  addTask: (text: string) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
};

const ProToolsContext = createContext<ProToolsState | null>(null);

export function ProToolsProvider({ children }: { children: ReactNode }) {
  const [activeTool, setActiveTool] = useState<ProToolType>(null);
  
  const [activeCarpetaId, setActiveCarpetaId] = useState<string | null>(null);
  const [carpetas, setCarpetas] = useState<CarpetaMini[]>([]);

  const [postIts, setPostIts] = useState<PostIt[]>([]);
  const [tasks, setTasks] = useState<ProTask[]>([]);

  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroMode, setPomodoroMode] = useState<"work" | "break">("work");
  const [pomodoroIsRunning, setPomodoroIsRunning] = useState(false);
  const [pomodoroTheme, setPomodoroTheme] = useState<PomodoroTheme>("silent");
  const [pomodoroGoal, setPomodoroGoal] = useState("");

  const ambientAudio = useRef<HTMLAudioElement | null>(null);
  const alarmAudio = useRef<HTMLAudioElement | null>(null);

  // Cargar datos al montar
  useEffect(() => {
    const guardadoPostIts = localStorage.getItem("nouttbuk_pro_postits");
    if (guardadoPostIts) {
      try { setPostIts(JSON.parse(guardadoPostIts)); } catch (e) { }
    }

    const guardadoTasks = localStorage.getItem("nouttbuk_pro_tasks");
    if (guardadoTasks) {
      try { setTasks(JSON.parse(guardadoTasks)); } catch (e) { }
    }

    if (typeof window !== "undefined") {
      ambientAudio.current = new Audio();
      ambientAudio.current.loop = true;
      alarmAudio.current = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");
    }

    // Fetch y Realtime Carpetas para el contexto
    let channel: any = null;
    
    async function initCarpetas() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const fetchCarpetas = async () => {
        const { data } = await supabase
          .from("carpetas")
          .select("id, nombre, icono, color")
          .eq("propietario_id", user.id)
          .order("created_at", { ascending: false });
          
        if (data) setCarpetas(data);
      };

      await fetchCarpetas();

      channel = supabase.channel('carpetas-pro-tools')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'carpetas' }, () => {
          fetchCarpetas();
        })
        .subscribe();
    }
    initCarpetas();

    return () => {
      if (channel) createClient().removeChannel(channel);
    };
  }, []);

  // Refetch carpetas cuando se abre el panel (por si Realtime está desactivado en la BD)
  useEffect(() => {
    if (activeTool !== null) {
      const fetchCarpetas = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data } = await supabase
          .from("carpetas")
          .select("id, nombre, icono, color")
          .eq("propietario_id", user.id)
          .order("created_at", { ascending: false });
          
        if (data) setCarpetas(data);
      };
      fetchCarpetas();
    }
  }, [activeTool]);

  useEffect(() => {
    localStorage.setItem("nouttbuk_pro_postits", JSON.stringify(postIts));
  }, [postIts]);

  useEffect(() => {
    localStorage.setItem("nouttbuk_pro_tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Manejo de audios Pomodoro...
  useEffect(() => {
    if (!ambientAudio.current) return;
    const themeUrls = {
      rain: "https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg",
      lofi: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
      cafe: "https://actions.google.com/sounds/v1/crowds/restaurant_chatter.ogg"
    };

    if (pomodoroTheme !== "silent") {
      ambientAudio.current.src = themeUrls[pomodoroTheme as keyof typeof themeUrls];
      if (pomodoroIsRunning) {
        ambientAudio.current.play().catch(() => console.warn("Autoplay bloqueado"));
      }
    } else {
      ambientAudio.current.pause();
    }
  }, [pomodoroTheme]);

  useEffect(() => {
    if (!ambientAudio.current) return;
    if (pomodoroIsRunning && pomodoroTheme !== "silent") {
      ambientAudio.current.play().catch(() => console.warn("Autoplay bloqueado"));
    } else {
      ambientAudio.current.pause();
    }
  }, [pomodoroIsRunning, pomodoroTheme]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pomodoroIsRunning && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime((prev) => prev - 1);
      }, 1000);
    } else if (pomodoroIsRunning && pomodoroTime === 0) {
      setPomodoroIsRunning(false);
      if (alarmAudio.current) {
        alarmAudio.current.play().catch(() => console.warn("Alarma bloqueada"));
      }
    }
    return () => clearInterval(interval);
  }, [pomodoroIsRunning, pomodoroTime]);

  const togglePomodoro = () => setPomodoroIsRunning((prev) => !prev);
  const resetPomodoro = (mode: "work" | "break") => {
    setPomodoroIsRunning(false);
    setPomodoroMode(mode);
    setPomodoroTime(mode === "work" ? 25 * 60 : 5 * 60);
  };

  // Funciones Tareas
  const addTask = (text: string) => {
    if (!text.trim()) return;
    setTasks(prev => [{ id: Date.now().toString(), text, completed: false, carpetaId: activeCarpetaId }, ...prev]);
  };
  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };
  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Funciones Post-its
  const addPostIt = (color: PostIt["color"] = "yellow") => {
    setPostIts(prev => [{ id: Date.now().toString(), text: "", color, carpetaId: activeCarpetaId }, ...prev]);
  };
  const updatePostIt = (id: string, text: string) => {
    setPostIts(prev => prev.map(p => p.id === id ? { ...p, text } : p));
  };
  const removePostIt = (id: string) => {
    setPostIts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <ProToolsContext.Provider
      value={{
        activeTool, setActiveTool,
        activeCarpetaId, setActiveCarpetaId, carpetas,
        postIts, addPostIt, updatePostIt, removePostIt,
        pomodoroTime, pomodoroMode, pomodoroIsRunning, pomodoroTheme, pomodoroGoal,
        togglePomodoro, resetPomodoro, setPomodoroTheme, setPomodoroGoal,
        tasks, addTask, toggleTask, removeTask,
      }}
    >
      {children}
    </ProToolsContext.Provider>
  );
}

export function useProTools() {
  const context = useContext(ProToolsContext);
  if (!context) {
    throw new Error("useProTools debe usarse dentro de un ProToolsProvider");
  }
  return context;
}
