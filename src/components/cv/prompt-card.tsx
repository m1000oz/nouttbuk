"use client";

import { useState } from "react";
import { CheckIcon, CopySimpleIcon } from "@phosphor-icons/react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PasoGuiaCv } from "@/lib/cv/guia";

// Antes: burbuja de chat (avatar circular + caja de mensaje punteada),
// repetida 6 veces en una sola columna, lo que hacía que toda la pantalla
// se leyera como una fila de mensajes casi idénticos. Ahora es una tarjeta
// numerada como cualquier otra tarjeta de la app (mismo tratamiento que
// ApunteTarjeta), pensada para vivir en una grilla, no en una columna.
// Mismo patrón de "copiar y confirmar por 2 segundos" que el botón
// Compartir de detalle-publicacion.tsx.
export function PromptCard({ paso }: { paso: PasoGuiaCv }) {
  const [copiado, setCopiado] = useState(false);

  async function handleCopiar() {
    await navigator.clipboard.writeText(paso.prompt);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <Card className="h-full border border-border shadow-[var(--shadow-card)] ring-0">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground">{paso.titulo}</h3>
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
            {paso.numero}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Úsalo cuando: </span>
          {paso.cuandoUsarlo}
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{paso.explicacion}</p>

        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
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
      </CardContent>
    </Card>
  );
}
