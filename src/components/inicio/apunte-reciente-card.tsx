"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

import { Card, CardContent } from "@/components/ui/card";
import { fechaRelativa } from "@/lib/fecha/relativa";

type ApunteRecienteCardProps = {
  id: string;
  titulo: string;
  updatedAt: string;
  carpeta?: { nombre: string } | null;
  propietario?: string;
  index: number;
};

export function ApunteRecienteCard({
  id,
  titulo,
  updatedAt,
  carpeta,
  propietario,
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
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-foreground">
                {titulo}
              </span>
              {propietario && (
                <span className="truncate text-xs text-muted-foreground">
                  Compartido por {propietario}
                </span>
              )}
            </div>
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
