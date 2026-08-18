import { PlusIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NuevoApunteButtonProps = {
  variant: "sidebar" | "fab";
  className?: string;
};

// El editor de apuntes (Tiptap) todavía no existe, así que el CTA queda
// visible pero deshabilitado en esta pasada, en vez de simular una pantalla
// que aún no está construida.
export function NuevoApunteButton({
  variant,
  className,
}: NuevoApunteButtonProps) {
  if (variant === "fab") {
    return (
      <Button
        type="button"
        disabled
        title="Próximamente"
        aria-label="Crear nuevo apunte, próximamente"
        size="icon-lg"
        className={cn(
          "rounded-full ring-4 ring-background shadow-lg",
          className,
        )}
      >
        <PlusIcon className="size-5" aria-hidden />
      </Button>
    );
  }

  return (
    <Button type="button" disabled title="Próximamente" className={className}>
      <PlusIcon aria-hidden />
      Nuevo apunte
    </Button>
  );
}
