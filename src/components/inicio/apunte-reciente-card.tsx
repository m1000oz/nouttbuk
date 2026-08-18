"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

import { Card, CardContent } from "@/components/ui/card";

const FORMATO_RELATIVO = new Intl.RelativeTimeFormat("es", {
  numeric: "auto",
});

function fechaRelativa(fechaISO: string): string {
  const diffMs = new Date(fechaISO).getTime() - Date.now();
  const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDias === 0) return "Hoy";
  if (Math.abs(diffDias) < 7) return FORMATO_RELATIVO.format(diffDias, "day");
  const diffSemanas = Math.round(diffDias / 7);
  return FORMATO_RELATIVO.format(diffSemanas, "week");
}

type ApunteRecienteCardProps = {
  id: string;
  titulo: string;
  updatedAt: string;
  carpeta?: { nombre: string } | null;
  index: number;
};

export function ApunteRecienteCard({
  id,
  titulo,
  updatedAt,
  carpeta,
  index,
}: ApunteRecienteCardProps) {
  const prefiereMenosMovimiento = useReducedMotion();

  return (
    <Link href={`/apuntes/${id}/editar`} className="block">
      <motion.div
        initial={prefiereMenosMovimiento ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.2,
          ease: "easeOut",
          delay: prefiereMenosMovimiento ? 0 : index * 0.05,
        }}
        whileHover={prefiereMenosMovimiento ? undefined : { y: -2 }}
      >
        <Card
          size="sm"
          className="border border-border shadow-[var(--shadow-card)] ring-0"
        >
          <CardContent className="flex items-center justify-between gap-3">
            <span className="truncate text-sm font-medium text-foreground">
              {titulo}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {carpeta ? `${carpeta.nombre} · ` : ""}
              {fechaRelativa(updatedAt)}
            </span>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
