"use client";

import { useState } from "react";
import { CheckIcon, CopySimpleIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import type { PasoGuiaCv } from "@/lib/cv/guia";

// Mismo patrón de "copiar y confirmar por 2 segundos" que el botón Compartir
// de detalle-publicacion.tsx (navigator.clipboard + estado local con
// setTimeout), sin fallback de navigator.share acá: un prompt es texto para
// pegar en otra pestaña, no algo que tenga sentido "compartir" como un link.
export function PromptCard({ paso }: { paso: PasoGuiaCv }) {
  const [copiado, setCopiado] = useState(false);

  async function handleCopiar() {
    await navigator.clipboard.writeText(paso.prompt);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {paso.numero}
        </span>
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold text-foreground">{paso.titulo}</h3>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Úsalo cuando: </span>
            {paso.cuandoUsarlo}
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{paso.explicacion}</p>

      <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-muted/50 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-muted-foreground">
            Prompt para ChatGPT, Gemini o Claude
          </span>
          <Button type="button" variant="outline" size="sm" onClick={handleCopiar}>
            {copiado ? <CheckIcon aria-hidden /> : <CopySimpleIcon aria-hidden />}
            {copiado ? "Copiado" : "Copiar"}
          </Button>
        </div>
        <pre className="max-h-40 overflow-y-auto text-wrap text-xs text-foreground">
          {paso.prompt}
        </pre>
      </div>
    </div>
  );
}
