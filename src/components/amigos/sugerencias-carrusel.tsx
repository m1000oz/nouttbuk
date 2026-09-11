"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlusIcon, SparkleIcon } from "@phosphor-icons/react";
import { toast } from "@/components/ui/toast";

type Sugerencia = {
  id: string;
  nombre: string;
  usuario: string;
  avatar_url: string | null;
  razon: string;
};

export function SugerenciasCarrusel({ myId }: { myId: string }) {
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSugerencias() {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("sugerir_amigos", {
        perfil_id: myId,
        limite: 10,
      });

      if (data && !error) {
        setSugerencias(data as Sugerencia[]);
      }
      setLoading(false);
    }
    loadSugerencias();
  }, [myId]);

  async function agregar(userId: string) {
    const supabase = createClient();
    
    // Optimistic
    setSugerencias((prev) => prev.filter((s) => s.id !== userId));
    
    const { error } = await supabase.from("amistades").insert({
      solicitante_id: myId,
      receptor_id: userId,
      estado: "pendiente",
    });

    if (error) {
      toast.add({ title: "Error al enviar solicitud", type: "error" });
    } else {
      toast.add({ title: "Solicitud enviada", type: "success" });
    }
  }

  if (loading || sugerencias.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 py-2 w-full">
      <div className="flex items-center gap-2 px-1">
        <SparkleIcon className="text-yellow-500 size-5" weight="fill" />
        <h3 className="font-semibold text-sm text-foreground">Personas que quizás conozcas</h3>
      </div>
      <div className="flex overflow-x-auto gap-4 pb-4 snap-x no-scrollbar">
        {sugerencias.map((s) => (
          <div
            key={s.id}
            className="flex flex-col items-center justify-center p-4 border border-border/50 bg-card rounded-2xl min-w-[160px] max-w-[160px] snap-start shrink-0 text-center shadow-sm"
          >
            <Link href={`/u/${s.usuario}`} className="flex flex-col items-center hover:opacity-80 transition-opacity w-full">
              <Avatar size="lg" className="mb-3 ring-1 ring-border/50">
                <AvatarImage src={s.avatar_url || undefined} />
                <AvatarFallback>{s.nombre.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm truncate w-full">{s.nombre}</span>
            </Link>
            <span className="text-xs text-muted-foreground truncate w-full mb-3 mt-1">
              {s.razon}
            </span>
            <Button
              size="sm"
              variant="secondary"
              className="w-full rounded-xl text-xs"
              onClick={() => agregar(s.id)}
            >
              <UserPlusIcon className="mr-1 size-3" /> Agregar
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
