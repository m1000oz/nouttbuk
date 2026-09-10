"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { CalendarBlankIcon } from "@phosphor-icons/react";

import { Card, CardContent } from "@/components/ui/card";
import { SeccionVacia } from "@/components/shared/seccion-vacia";
import { formatearHoraAMPM } from "@/components/calendario/calendario-semana";
import { resolverColorCarpeta } from "@/lib/carpetas/colores";
import type { BloqueHorario } from "@/lib/calendario/consultas";

type HorarioHoyProps = {
  bloques: BloqueHorario[];
};

// Widget de solo lectura: los bloques del día de hoy, ya filtrados en el
// server (inicio/page.tsx) por dia_semana === obtenerDiaSemanaActual(), acá
// solo se ordenan por hora y se dibujan.
export function HorarioHoy({ bloques }: HorarioHoyProps) {
  const prefiereMenosMovimiento = useReducedMotion();

  if (bloques.length === 0) {
    return (
      <SeccionVacia
        icon={CalendarBlankIcon}
        titulo="No tienes clases hoy"
        descripcion="Cuando agregues bloques a tu horario, los que caigan hoy aparecen aquí."
        accion={
          <Link
            href="/calendario"
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver mi horario
          </Link>
        }
      />
    );
  }

  return (
    <Card className="border border-border shadow-[var(--shadow-card)] ring-0">
      <CardContent className="flex flex-col gap-3">
        {bloques.map((bloque, index) => (
          <motion.div
            key={bloque.id}
            className="flex items-center gap-3"
            initial={prefiereMenosMovimiento ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
              delay: prefiereMenosMovimiento ? 0 : index * 0.05,
            }}
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: resolverColorCarpeta(bloque.color) }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
              {bloque.titulo}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatearHoraAMPM(bloque.hora_inicio)} – {formatearHoraAMPM(bloque.hora_fin)}
            </span>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
