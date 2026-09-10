"use client";

import { useEffect } from "react";
import Link from "next/link";
import { WarningIcon, ArrowClockwiseIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";

export default function ErrorGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl border border-dashed border-destructive/40 bg-destructive/10 text-destructive">
        <WarningIcon className="size-7" aria-hidden />
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">
          Algo salió mal
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Ocurrió un problema inesperado. Puedes intentarlo de nuevo o volver
          al inicio.
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={reset}>
          <ArrowClockwiseIcon aria-hidden />
          Reintentar
        </Button>
        <Button nativeButton={false} render={<Link href="/" />}>
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}
