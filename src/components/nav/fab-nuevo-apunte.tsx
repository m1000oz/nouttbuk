"use client";

import Link from "next/link";
import { PlusIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NuevoApunteButtonProps = {
  variant: "sidebar" | "fab";
  className?: string;
  // Cuando se crea desde dentro de una carpeta (Mis apuntes con ?carpeta=X),
  // se propaga a /apuntes/nuevo para que el editor arranque con esa carpeta
  // ya seleccionada, en vez de "Sin carpeta" por defecto.
  carpetaId?: string | null;
};

export function NuevoApunteButton({
  variant,
  className,
  carpetaId,
}: NuevoApunteButtonProps) {
  const href = carpetaId
    ? `/apuntes/nuevo?carpeta=${carpetaId}`
    : "/apuntes/nuevo";

  if (variant === "fab") {
    return (
      <Button
        aria-label="Crear nuevo apunte"
        size="icon-xl"
        nativeButton={false}
        render={<Link href={href} />}
        className={cn(
          "rounded-full ring-4 ring-background shadow-lg",
          className,
        )}
      >
        <PlusIcon className="size-6" aria-hidden />
      </Button>
    );
  }

  return (
    <Button size="xl" nativeButton={false} render={<Link href={href} />} className={className}>
      <PlusIcon aria-hidden className="size-5" />
      Nuevo apunte
    </Button>
  );
}
