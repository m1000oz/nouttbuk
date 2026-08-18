"use client";

import Link from "next/link";
import { PlusIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NuevoApunteButtonProps = {
  variant: "sidebar" | "fab";
  className?: string;
};

export function NuevoApunteButton({
  variant,
  className,
}: NuevoApunteButtonProps) {
  if (variant === "fab") {
    return (
      <Button
        aria-label="Crear nuevo apunte"
        size="icon-lg"
        nativeButton={false}
        render={<Link href="/apuntes/nuevo" />}
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
    <Button
      nativeButton={false}
      render={<Link href="/apuntes/nuevo" />}
      className={className}
    >
      <PlusIcon aria-hidden />
      Nuevo apunte
    </Button>
  );
}
