"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlusIcon, CheckIcon, ClockIcon } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { toast } from "@/components/ui/toast";

type AmistadEstado = 'pendiente' | 'aceptada' | 'rechazada' | null;

export function PerfilPublicoHeader({
  perfil,
  miId,
  estadoAmistadInicial,
  soySolicitanteInicial
}: {
  perfil: any;
  miId: string | null;
  estadoAmistadInicial: AmistadEstado;
  soySolicitanteInicial: boolean;
}) {
  const [estado, setEstado] = useState(estadoAmistadInicial);
  const [soySolicitante, setSoySolicitante] = useState(soySolicitanteInicial);
  const [loading, setLoading] = useState(false);

  const esMiPerfil = miId === perfil.id;

  async function enviarSolicitud() {
    if (!miId) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("amistades").insert({
      solicitante_id: miId,
      receptor_id: perfil.id,
      estado: "pendiente"
    });
    
    if (error) {
      toast.add({ title: "Error: " + error.message, type: "error" });
    } else {
      toast.add({ title: "Solicitud enviada", type: "success" });
      setEstado("pendiente");
      setSoySolicitante(true);
    }
    setLoading(false);
  }

  function renderBoton() {
    if (esMiPerfil) return null;
    if (!miId) return null;

    if (!estado) {
      return (
        <Button onClick={enviarSolicitud} disabled={loading}>
          <UserPlusIcon className="mr-2 size-5" /> Agregar a amigos
        </Button>
      );
    }
    if (estado === "pendiente") {
      if (soySolicitante) {
        return (
          <Button variant="secondary" disabled>
            <ClockIcon className="mr-2 size-5" /> Solicitud enviada
          </Button>
        );
      } else {
        return (
          <Button variant="secondary" disabled>
            Revisa tus solicitudes
          </Button>
        );
      }
    }
    if (estado === "aceptada") {
      return (
        <Button variant="outline" className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100" disabled>
          <CheckIcon className="mr-2 size-5" /> Amigos
        </Button>
      );
    }
    if (estado === "rechazada") {
      return (
        <Button variant="secondary" disabled>
          Solicitud rechazada
        </Button>
      );
    }
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 w-full mt-4 mb-8">
      <Avatar size="4xl" className="border-4 border-background shadow-sm ring-1 ring-border/50">
        <AvatarImage src={perfil.avatar_url || undefined} />
        <AvatarFallback className="text-4xl">
          {perfil.nombre.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex flex-col items-center sm:items-start gap-2 flex-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground text-center sm:text-left">
          {perfil.nombre}
        </h1>
        <p className="text-lg font-medium text-muted-foreground">@{perfil.usuario}</p>
        
        {(perfil.carrera?.nombre || perfil.universidad) && (
          <div className="flex flex-col gap-0.5 mt-2 items-center sm:items-start">
            {perfil.carrera?.nombre && (
              <p className="text-base font-medium text-foreground">{perfil.carrera.nombre}</p>
            )}
            {perfil.universidad && (
              <p className="text-base text-muted-foreground">{perfil.universidad}</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 sm:mt-0 shrink-0">
        {renderBoton()}
      </div>
    </div>
  );
}
