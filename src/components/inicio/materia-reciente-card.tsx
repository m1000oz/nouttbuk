"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { FolderSimpleIcon } from "@phosphor-icons/react";

import { Card, CardContent } from "@/components/ui/card";
import { resolverColorCarpeta } from "@/lib/carpetas/colores";

type MateriaRecienteCardProps = {
  id: string;
  nombre: string;
  color: string | null;
  icono: string | null;
  index: number;
};

export function MateriaRecienteCard({
  id,
  nombre,
  color,
  index,
}: MateriaRecienteCardProps) {
  const prefiereMenosMovimiento = useReducedMotion();
  const colorResuelto = resolverColorCarpeta(color);

  return (
    // Mis apuntes (todo.md ítem 3) todavía no lee ?carpeta=, pero la ruta
    // /apuntes ya existe y funciona: este link queda listo para que ese
    // ítem lo consuma en vez de reinventar la navegación.
    <Link href={`/apuntes?carpeta=${id}`} className="block">
      <motion.div
        initial={
          prefiereMenosMovimiento ? false : { opacity: 0, y: 12 }
        }
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.2,
          ease: "easeOut",
          delay: prefiereMenosMovimiento ? 0 : index * 0.05,
        }}
        whileHover={prefiereMenosMovimiento ? undefined : { y: -2 }}
        whileTap={prefiereMenosMovimiento ? undefined : { y: 0 }}
      >
        <Card
          size="sm"
          className="border border-border shadow-[var(--shadow-card)] ring-0"
        >
          <CardContent className="flex items-center gap-3">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: colorResuelto }}
            >
              <FolderSimpleIcon
                weight="fill"
                className="size-4 text-white"
                aria-hidden
              />
            </span>
            <span className="truncate text-sm font-medium text-foreground">
              {nombre}
            </span>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
