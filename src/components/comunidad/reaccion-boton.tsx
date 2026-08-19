"use client";

import { useState } from "react";
import { HeartIcon } from "@phosphor-icons/react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuthGate } from "@/components/nav/auth-gate";

type ReaccionBotonProps = {
  publicacionId: string;
  usuarioId: string | null;
  activo: boolean;
  count: number;
};

export function ReaccionBoton({
  publicacionId,
  usuarioId,
  activo,
  count,
}: ReaccionBotonProps) {
  const { abrirLogin } = useAuthGate();
  const [activoLocal, setActivoLocal] = useState(activo);
  const [countLocal, setCountLocal] = useState(count);
  const [enVuelo, setEnVuelo] = useState(false);

  async function handleClick() {
    if (!usuarioId) {
      abrirLogin();
      return;
    }
    if (enVuelo) return;
    setEnVuelo(true);

    const supabase = createClient();
    const siguienteActivo = !activoLocal;

    if (siguienteActivo) {
      const { error } = await supabase
        .from("reacciones")
        .insert({ publicacion_id: publicacionId, perfil_id: usuarioId });
      if (!error) {
        setActivoLocal(true);
        setCountLocal((actual) => actual + 1);
      }
    } else {
      const { error } = await supabase
        .from("reacciones")
        .delete()
        .eq("publicacion_id", publicacionId)
        .eq("perfil_id", usuarioId);
      if (!error) {
        setActivoLocal(false);
        setCountLocal((actual) => Math.max(0, actual - 1));
      }
    }

    setEnVuelo(false);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      aria-label={
        activoLocal ? "Quitar reacción" : "Reaccionar a esta publicación"
      }
      aria-pressed={activoLocal}
    >
      <HeartIcon
        weight={activoLocal ? "fill" : "regular"}
        className={activoLocal ? "text-destructive" : undefined}
        aria-hidden
      />
      {countLocal}
    </Button>
  );
}
