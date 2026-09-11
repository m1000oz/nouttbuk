"use client";

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

export type ProToolType = "notas" | "tasks" | "pomodoro" | null;
export type PomodoroTheme = "silent" | "rain" | "lofi" | "cafe" | "cat" | "synthwave" | "classical";

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

export type PomodoroSettings = {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStart: boolean;
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
  pomodoroMode: "work" | "break" | "long_break";
  pomodoroIsRunning: boolean;
  pomodoroTheme: PomodoroTheme;
  pomodoroGoal: string;
  pomodoroSettings: PomodoroSettings;
  pomodoroCycle: number;
  setPomodoroSettings: (settings: PomodoroSettings) => void;
  togglePomodoro: () => void;
  resetPomodoro: (mode: "work" | "break" | "long_break") => void;
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

  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>({
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStart: false
  });

  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroMode, setPomodoroMode] = useState<"work" | "break" | "long_break">("work");
  const [pomodoroIsRunning, setPomodoroIsRunning] = useState(false);
  const [pomodoroTheme, setPomodoroTheme] = useState<PomodoroTheme>("silent");
  const [pomodoroGoal, setPomodoroGoal] = useState("");
  const [pomodoroCycle, setPomodoroCycle] = useState(1);

  const ambientAudio = useRef<HTMLAudioElement | null>(null);
  const alarmAudio = useRef<HTMLAudioElement | null>(null);

  // Index para las playlists
  const [playlistIndex, setPlaylistIndex] = useState(0);

  // Playlists definidas (usamos enlaces directos estables de dominio público / youtube streams, etc.
  // Aquí usamos bibliotecas gratuitas como pixabay)
  const THEME_PLAYLISTS: Record<string, string[]> = {
    silent: [],
    rain: [
      "https://archive.org/download/autumn-sounds-rain-on-leaves-with-bird-chirping/AutumnSounds_Rain_On_leaves_with_bird_chirping.mp3",
      "https://archive.org/download/woodland-paths-chapter-three-rain-sounds/Woodland%20Paths%20Chapter%20three%20rain%20sounds.mp3",
      "https://archive.org/download/rain-forest_202511/Sounds%20Of%20The%20Tropical%20Rain%20Forest/01%20Sounds%20of%20the%20Tropical%20Rain%20Forest.mp3"
    ],
    cafe: [
      "https://archive.org/download/AmbientCafeSounds1/Ambient%20cafe%20sounds%201.mp3",
      "https://archive.org/download/AmbientCafeSounds2/Ambient%20cafe%20sounds%202.mp3"
    ],
    lofi: [
      "https://archive.org/download/jamendo-628859/01-2308672-Brentin%20Davis-Lofi%20No%20School.mp3",
      "https://archive.org/download/jamendo-479080/01-1936210-SoundForYou-Jazzy%20LoFi%20Hip%20Hop%20Stinger.mp3",
      "https://archive.org/download/jamendo-633744/01-2319309-Bobby%20Cole-Latte%20and%20Lost%20Pages%20Lofi.mp3",
      "https://archive.org/download/jamendo-507233/01-1996336-The_Mountain-LoFi%20Chill.mp3",
      "https://archive.org/download/jamendo-465355/01-1906685-Pumpupthemind-Lofi%20Hip%20Hop%20Is.mp3",
      "https://archive.org/download/jamendo-461836/01-1898757-Pumpupthemind-as%20Lofi%20Logo.mp3",
      "https://archive.org/download/jamendo-630666/01-2310980-Brentin%20Davis-Lofi%20Success.mp3",
      "https://archive.org/download/jamendo-333509/01-1545361-Lysergic%20Tempo-Master%20Beat%20inside%20Lofi.mp3",
      "https://archive.org/download/jamendo-630678/01-2310959-Brentin%20Davis-Lofi%20Lofi%20Dem%20Bucks.mp3",
      "https://archive.org/download/jamendo-520252/01-2029907-Dmytro%20Demchenko-Chill%20Motivational%20LoFI%20short%20A.mp3",
      "https://archive.org/download/jamendo-523614/01-2037052-Avalon%20Audio-Hip%20Hop%20LoFi%20Dance_Short_2.mp3"
    ],
    cat: [
      "https://archive.org/download/mother-cat-nursing-babies-and-purring-audibly-july-12th-2023/Mother%20cat%20nursing%20babies%20and%20purring%20audibly%20July%2012th%202023.mp3",
      "https://archive.org/download/crinkly-old-books-asmr-page-turning-no-talking-shc-aasum-cx-8/Crinkly%20Old%20Books%20%F0%9F%93%96%20ASMR%20Page%20Turning%20%28No%20Talking%29%20%5BshcAASumCx8%5D.mp3",
      "https://archive.org/download/softbabylullabysuperrelaxing/Soft%20Baby%20Lullaby%20Super%20Relaxing.mp3",
      "https://archive.org/download/IttyPurring/Itty%20purring.mp3",
      "https://archive.org/download/onlymp-3.to-asmr-120-best-triggers-for-sleep-deep-relaxation-1-hr-no-talking-vy-/onlymp3.to%20-%20%20ASMR%20120%20Best%20Triggers%20For%20Sleep%20Deep%20Relaxation%201Hr%20No%20Talking%20-Vy0P_dn-sBU-192k-1707138713.mp3",
      "https://archive.org/download/pianolullabyrelaxingbaby/Piano%20Lullaby%20Relaxing%20Baby.mp3",
      "https://archive.org/download/aporee_32981_37894/MyPurringCat.mp3",
      "https://archive.org/download/softrelaxingbabylullaby/Soft%20Relaxing%20Baby%20Lullaby.mp3"
    ],
    synthwave: [
      "https://archive.org/download/jamendo-617287/01-2284002-MokkaMusic-Galactic%20Quest.mp3",
      "https://archive.org/download/jamendo-622393/01-2295639-Avigeia%20Avetian-Eclipse%20Flux%20_Synthwave_.mp3"
    ],
    classical: [
      "https://archive.org/download/ChopinPianoConcertoNo.1InEMinorOp.11/ChopinPianoConcertoNo.11.AllegroMaestosoStanislavBunin.mp3",
      "https://archive.org/download/jamendo-187289/04-1680377-OnClassical-natalia_sokolovskaya_chopin_piano_works_04_mazurkas_op._41_iii._mazurka_in_a_flat_major.mp3",
      "https://archive.org/download/jamendo-136221/01-1134933-Simonbzh-Chopin%20-%20Nocturne%20Op.9%20n%26deg%3B1.mp3"
    ]
  };

  const [isInitialized, setIsInitialized] = useState(false);

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
    
    const guardadoSettings = localStorage.getItem("nouttbuk_pro_pomodoro_settings");
    let initialSettings = {
      workDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,
      autoStart: false
    };
    if (guardadoSettings) {
      try { 
        initialSettings = JSON.parse(guardadoSettings);
        setPomodoroSettings(initialSettings);
      } catch (e) { }
    }

    const guardadoState = localStorage.getItem("nouttbuk_pro_pomodoro_state");
    if (guardadoState) {
      try {
        const parsed = JSON.parse(guardadoState);
        setPomodoroMode(parsed.pomodoroMode ?? "work");
        setPomodoroTheme(parsed.pomodoroTheme ?? "silent");
        setPomodoroGoal(parsed.pomodoroGoal ?? "");
        setPomodoroCycle(parsed.pomodoroCycle ?? 1);
        
        let timeLeft = parsed.pomodoroTime ?? (initialSettings.workDuration * 60);
        const wasRunning = parsed.pomodoroIsRunning ?? false;
        
        if (wasRunning && parsed.lastUpdated) {
           const elapsed = Math.floor((Date.now() - parsed.lastUpdated) / 1000);
           timeLeft = Math.max(0, timeLeft - elapsed);
        }
        setPomodoroTime(timeLeft);
        setPomodoroIsRunning(wasRunning && timeLeft > 0);
      } catch (e) { }
    } else {
        setPomodoroTime(initialSettings.workDuration * 60);
    }

    setIsInitialized(true);

    if (typeof window !== "undefined") {
      ambientAudio.current = new Audio();
      ambientAudio.current.volume = 0.5; // Mejor volumen para background
      alarmAudio.current = new Audio("https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg");

      // Auto play next song in playlist
      ambientAudio.current.addEventListener('ended', () => {
        setPlaylistIndex(prev => prev + 1);
      });
    }

    // Fetch y Realtime Carpetas para el contexto
    let channel: any = null;
    let isMounted = true;
    
    async function initCarpetas() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) return;
      
      const fetchCarpetas = async () => {
        const { data } = await supabase
          .from("carpetas")
          .select("id, nombre, icono, color")
          .eq("propietario_id", user.id)
          .order("created_at", { ascending: false });
          
        if (data && isMounted) setCarpetas(data);
      };

      await fetchCarpetas();

      if (!isMounted) return;

      channel = supabase.channel('carpetas-pro-tools')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'carpetas' }, () => {
          fetchCarpetas();
        })
        .subscribe();
    }
    initCarpetas();

    return () => {
      isMounted = false;
      if (channel) createClient().removeChannel(channel);
    };
  }, []);

  // Refetch carpetas cuando se abre el panel
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
    if (!isInitialized) return;
    localStorage.setItem("nouttbuk_pro_postits", JSON.stringify(postIts));
  }, [postIts, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem("nouttbuk_pro_tasks", JSON.stringify(tasks));
  }, [tasks, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem("nouttbuk_pro_pomodoro_settings", JSON.stringify(pomodoroSettings));
  }, [pomodoroSettings, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem("nouttbuk_pro_pomodoro_state", JSON.stringify({
      pomodoroTime,
      pomodoroMode,
      pomodoroIsRunning,
      pomodoroTheme,
      pomodoroGoal,
      pomodoroCycle,
      lastUpdated: Date.now(),
    }));
  }, [pomodoroTime, pomodoroMode, pomodoroIsRunning, pomodoroTheme, pomodoroGoal, pomodoroCycle, isInitialized]);

  // Manejo de audios Pomodoro
  useEffect(() => {
    if (!ambientAudio.current) return;
    
    if (pomodoroTheme !== "silent") {
      const playlist = THEME_PLAYLISTS[pomodoroTheme] || [];
      if (playlist.length > 0) {
        // Enforce cyclic index
        const safeIndex = playlistIndex % playlist.length;
        const currentSrc = playlist[safeIndex];
        
        if (ambientAudio.current.src !== currentSrc) {
          ambientAudio.current.src = currentSrc;
          if (pomodoroIsRunning) {
            ambientAudio.current.play().catch(() => console.warn("Autoplay bloqueado"));
          }
        }
      }
    } else {
      ambientAudio.current.pause();
      ambientAudio.current.src = "";
    }
  }, [pomodoroTheme, playlistIndex]);

  // Reseteamos el index al cambiar de tema para que empiece desde 0
  useEffect(() => {
    setPlaylistIndex(0);
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
      
      // Lógica de transición
      let nextMode: "work" | "break" | "long_break" = "work";
      let nextTime = pomodoroSettings.workDuration * 60;
      let nextCycle = pomodoroCycle;

      if (pomodoroMode === "work") {
        if (pomodoroCycle % pomodoroSettings.longBreakInterval === 0) {
          nextMode = "long_break";
          nextTime = pomodoroSettings.longBreakDuration * 60;
        } else {
          nextMode = "break";
          nextTime = pomodoroSettings.breakDuration * 60;
        }
      } else {
        nextMode = "work";
        nextTime = pomodoroSettings.workDuration * 60;
        nextCycle = pomodoroCycle + 1;
      }

      setPomodoroMode(nextMode);
      setPomodoroTime(nextTime);
      setPomodoroCycle(nextCycle);
      
      if (pomodoroSettings.autoStart) {
        setTimeout(() => setPomodoroIsRunning(true), 1500);
      }
    }
    return () => clearInterval(interval);
  }, [pomodoroIsRunning, pomodoroTime, pomodoroMode, pomodoroCycle, pomodoroSettings]);

  const togglePomodoro = () => setPomodoroIsRunning((prev) => !prev);
  const resetPomodoro = (mode: "work" | "break" | "long_break") => {
    setPomodoroIsRunning(false);
    setPomodoroMode(mode);
    if (mode === "work") setPomodoroTime(pomodoroSettings.workDuration * 60);
    else if (mode === "break") setPomodoroTime(pomodoroSettings.breakDuration * 60);
    else setPomodoroTime(pomodoroSettings.longBreakDuration * 60);
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
        pomodoroSettings, setPomodoroSettings, pomodoroCycle,
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
