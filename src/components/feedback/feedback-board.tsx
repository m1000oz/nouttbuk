"use client";

import { useState } from "react";
import Link from "next/link";
import { XIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { FeedbackComposer } from "@/components/feedback/feedback-composer";
import { FeedbackLista, type FeedbackIdea } from "@/components/feedback/feedback-lista";

type FeedbackBoardProps = {
  usuarioId: string;
  ideas: FeedbackIdea[];
};

// Mismo patrón de overlay de pantalla completa que ApunteEditor y
// DetallePublicacion: cubre el nav lateral sin una segunda ramificación del
// árbol de rutas del shell. Se llega acá solo desde Perfil → "Enviar
// feedback", por eso "Cerrar" vuelve a /perfil en vez de a un origen
// genérico.
export function FeedbackBoard({ usuarioId, ideas }: FeedbackBoardProps) {
  const [ideasLocal, setIdeasLocal] = useState<FeedbackIdea[]>(ideas);

  function handleIdeaCreada(idea: FeedbackIdea) {
    setIdeasLocal((actual) => [idea, ...actual]);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Cerrar board de feedback"
          nativeButton={false}
          render={<Link href="/perfil" />}
        >
          <XIcon aria-hidden />
        </Button>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 overflow-y-auto px-6 py-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Board de feedback
          </h1>
          <p className="text-sm text-muted-foreground">
            Propón ideas o mira qué se está evaluando o ya se hizo.
          </p>
        </div>

        <FeedbackComposer usuarioId={usuarioId} onIdeaCreada={handleIdeaCreada} />

        <FeedbackLista usuarioId={usuarioId} ideas={ideasLocal} />
      </div>
    </div>
  );
}
