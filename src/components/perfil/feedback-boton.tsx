"use client";

import Link from "next/link";
import { ChatTeardropTextIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";

// Antes un stub deshabilitado hasta que existiera el board de feedback
// (todo.md ítem 11); ahora enlaza al board real en /feedback.
export function FeedbackBoton() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/50 px-3 py-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ChatTeardropTextIcon className="size-4" aria-hidden />
        Cuéntanos qué te gustaría ver en Nouttbuk.
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<Link href="/feedback" />}
      >
        Enviar feedback
      </Button>
    </div>
  );
}
