"use client";

import { useMemo, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarioSemana } from "@/components/calendario/calendario-semana";
import { DIAS_SEMANA, type BloqueHorario } from "@/lib/calendario/consultas";
import { franjasOcupadas, rangosLibresPorDia } from "@/lib/calendario/grilla";

type Persona = { id: string; nombre: string };

type CruceCalendariosProps = {
  personas: Persona[];
  bloques: BloqueHorario[];
};

function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Todo lo que RLS deja ver (mis bloques + los de quien me compartió su
// calendario, ver bloques_horario_select_propio_o_compartido) ya llegó desde
// el servidor en un solo viaje; elegir con quién cruzar el horario es puro
// filtrado en memoria, sin volver a pedirle nada a Supabase.
export function CruceCalendarios({ personas, bloques }: CruceCalendariosProps) {
  const [seleccionados, setSeleccionados] = useState<Set<string>>(
    () => new Set(personas.map((persona) => persona.id)),
  );

  const bloquesFiltrados = useMemo(
    () => bloques.filter((bloque) => seleccionados.has(bloque.perfil_id)),
    [bloques, seleccionados],
  );

  const nombrePorPerfil = useMemo(
    () => Object.fromEntries(personas.map((persona) => [persona.id, persona.nombre])),
    [personas],
  );

  const ocupadas = useMemo(
    () => franjasOcupadas(bloquesFiltrados),
    [bloquesFiltrados],
  );

  function alternar(personaId: string) {
    setSeleccionados((actual) => {
      const siguiente = new Set(actual);
      if (siguiente.has(personaId)) {
        // Al menos una persona seleccionada siempre: sin nadie elegido, "libre
        // para todos" perdería sentido (todo el calendario se vería libre).
        if (siguiente.size > 1) siguiente.delete(personaId);
      } else {
        siguiente.add(personaId);
      }
      return siguiente;
    });
  }

  const diasConHorariosLibres = DIAS_SEMANA.map((dia, indiceDia) => ({
    dia,
    rangos: rangosLibresPorDia(indiceDia, ocupadas),
  })).filter((entrada) => entrada.rangos.length > 0);

  return (
    <div className="flex flex-col gap-4">
      {personas.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {personas.map((persona) => {
            const activo = seleccionados.has(persona.id);
            return (
              <label
                key={persona.id}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-sm"
              >
                <Checkbox
                  checked={activo}
                  onCheckedChange={() => alternar(persona.id)}
                />
                <Avatar size="sm">
                  <AvatarFallback className="text-[10px]">
                    {iniciales(persona.nombre)}
                  </AvatarFallback>
                </Avatar>
                {persona.nombre}
              </label>
            );
          })}
        </div>
      )}

      <CalendarioSemana
        bloques={bloquesFiltrados}
        franjasOcupadas={ocupadas}
        nombrePorPerfil={nombrePorPerfil}
      />

      <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-muted/50 p-3">
        <h3 className="text-sm font-semibold text-foreground">
          Horarios libres para todos los seleccionados
        </h3>
        {diasConHorariosLibres.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay ningún horario libre en común entre las 7:00 y las 22:00.
          </p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm text-foreground">
            {diasConHorariosLibres.map(({ dia, rangos }) => (
              <li key={dia}>
                <span className="font-medium">{dia}:</span>{" "}
                {rangos.map((rango) => `${rango.inicio}–${rango.fin}`).join(", ")}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
