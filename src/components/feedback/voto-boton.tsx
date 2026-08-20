"use client";

import { useState } from "react";
import { ArrowFatUpIcon } from "@phosphor-icons/react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type VotoBotonProps = {
  feedbackId: string;
  usuarioId: string;
  activo: boolean;
  count: number;
};

// Mismo patrón optimista que ReaccionBoton (src/components/comunidad/
// reaccion-boton.tsx): el board de feedback ya requiere sesión a nivel de
// página, así que no hace falta el auth-gate que sí necesita el feed
// público de comunidad.
export function VotoBoton({
  feedbackId,
  usuarioId,
  activo,
  count,
}: VotoBotonProps) {
  const [activoLocal, setActivoLocal] = useState(activo);
  const [countLocal, setCountLocal] = useState(count);
  const [enVuelo, setEnVuelo] = useState(false);

  async function handleClick() {
    if (enVuelo) return;
    setEnVuelo(true);

    const supabase = createClient();
    const siguienteActivo = !activoLocal;

    if (siguienteActivo) {
      const { error } = await supabase
        .from("feedback_votos")
        .insert({ feedback_id: feedbackId, perfil_id: usuarioId });
      if (!error) {
        setActivoLocal(true);
        setCountLocal((actual) => actual + 1);
      }
    } else {
      const { error } = await supabase
        .from("feedback_votos")
        .delete()
        .eq("feedback_id", feedbackId)
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
      aria-label={activoLocal ? "Quitar voto" : "Votar por esta idea"}
      aria-pressed={activoLocal}
      className="flex-col gap-0.5 px-2"
    >
      <ArrowFatUpIcon
        weight={activoLocal ? "fill" : "regular"}
        className={activoLocal ? "text-primary" : undefined}
        aria-hidden
      />
      <span className="text-xs">{countLocal}</span>
    </Button>
  );
}
