"use client";

import { ChatTeardropTextIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";

// UI honesta ahora, se conecta cuando exista el board de feedback (todo.md
// ítem 11, aparte): mismo criterio que el stub de colaboración "Grupo" en
// apunte-editor.tsx.
export function FeedbackStub() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/50 px-3 py-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ChatTeardropTextIcon className="size-4" aria-hidden />
        El board de feedback llega pronto.
      </div>
      <Button type="button" variant="outline" size="sm" disabled>
        Enviar feedback
      </Button>
    </div>
  );
}
