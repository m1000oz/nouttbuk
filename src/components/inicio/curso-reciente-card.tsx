"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { FolderIcon } from "@phosphor-icons/react";

import { resolverColorCarpeta } from "@/lib/carpetas/colores";

type CursoRecienteCardProps = {
  id: string;
  nombre: string;
  color: string | null;
  icono: string | null;
  index: number;
};

// Tile vertical centrado en el ícono, al estilo de un explorador de archivos
// de escritorio (ícono de carpeta grande arriba, nombre abajo) en vez del
// cuadrado de color con un ícono chico adentro que se usaba antes.
export function CursoRecienteCard({
  id,
  nombre,
  color,
  index,
}: CursoRecienteCardProps) {
  const prefiereMenosMovimiento = useReducedMotion();
  const colorResuelto = resolverColorCarpeta(color);

  return (
    // Mis apuntes (todo.md ítem 3) todavía no lee ?carpeta=, pero la ruta
    // /apuntes ya existe y funciona: este link queda listo para que ese
    // ítem lo consuma en vez de reinventar la navegación.
    <Link href={`/apuntes?carpeta=${id}`} className="block">
      <motion.div
        initial={prefiereMenosMovimiento ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.2,
          ease: "easeOut",
          delay: prefiereMenosMovimiento ? 0 : index * 0.05,
        }}
        whileHover={prefiereMenosMovimiento ? undefined : { y: -2 }}
        whileTap={prefiereMenosMovimiento ? undefined : { y: 0 }}
        className="flex flex-col items-center gap-1.5 rounded-xl border border-transparent px-3 py-4 text-center hover:border-border hover:bg-muted/50"
      >
        <FolderIcon
          weight="fill"
          className="size-12"
          style={{ color: colorResuelto }}
          aria-hidden
        />
        <span className="w-full truncate text-sm font-medium text-foreground">
          {nombre}
        </span>
      </motion.div>
    </Link>
  );
}
