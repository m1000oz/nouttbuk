"use client";

import { type FormEvent, useState } from "react";
import { FlagIcon } from "@phosphor-icons/react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { useAuthGate } from "@/components/nav/auth-gate";
import type { MotivoReporte } from "@/lib/types/enums";

type ReportarSheetProps = {
  objetivo:
    | { tipo: "publicacion"; id: string }
    | { tipo: "comentario"; id: string };
  usuarioId: string | null;
};

const MOTIVO_LABEL: Record<MotivoReporte, string> = {
  spam: "Spam o publicidad",
  contenido_inapropiado: "Contenido inapropiado",
  plagio: "Plagio",
  otro: "Otro motivo",
};

// No hay panel de moderación en esta app (mismo criterio que feedback.estado:
// el dueño del producto revisa las tablas de reportes directamente en
// Supabase Studio y borra el apunte/comentario a mano cuando corresponde),
// así que este sheet solo necesita enviar el reporte, no mostrar un
// historial ni un estado de revisión.
export function ReportarSheet({ objetivo, usuarioId }: ReportarSheetProps) {
  const { abrirLogin } = useAuthGate();
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState<MotivoReporte>("spam");
  const [detalle, setDetalle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function handleAbrir() {
    if (!usuarioId) {
      abrirLogin();
      return;
    }
    setOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!usuarioId) return;

    setError(null);
    setEnviando(true);

    const supabase = createClient();
    const detalleFinal = detalle.trim() || null;

    const { error: dbError } =
      objetivo.tipo === "publicacion"
        ? await supabase.from("reportes_publicacion").insert({
            publicacion_id: objetivo.id,
            perfil_id: usuarioId,
            motivo,
            detalle: detalleFinal,
          })
        : await supabase.from("reportes_comentario").insert({
            comentario_id: objetivo.id,
            perfil_id: usuarioId,
            motivo,
            detalle: detalleFinal,
          });

    setEnviando(false);

    if (dbError) {
      if (dbError.code === "23505") {
        setError("Ya habías reportado esto.");
      } else {
        setError("No se pudo enviar el reporte. Intenta de nuevo.");
      }
      return;
    }

    setOpen(false);
    setDetalle("");
    setMotivo("spam");
    toast.add({ title: "Gracias por tu reporte.", type: "success" });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAbrir}
            aria-label={
              objetivo.tipo === "publicacion"
                ? "Reportar publicación"
                : "Reportar comentario"
            }
          >
            <FlagIcon aria-hidden />
          </Button>
        }
      />
      <SheetContent
        side="bottom"
        className="mx-auto w-full rounded-t-xl border-t border-border sm:max-w-sm"
      >
        <div
          className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border"
          aria-hidden
        />
        <SheetHeader>
          <SheetTitle>
            {objetivo.tipo === "publicacion"
              ? "Reportar publicación"
              : "Reportar comentario"}
          </SheetTitle>
          <SheetDescription>
            Cuéntanos qué está mal. Lo revisamos y actuamos si corresponde.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pb-4">
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reportar-motivo">Motivo</Label>
            <Select
              value={motivo}
              onValueChange={(valor) => setMotivo((valor as MotivoReporte) ?? "spam")}
              items={MOTIVO_LABEL}
            >
              <SelectTrigger id="reportar-motivo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(MOTIVO_LABEL) as MotivoReporte[]).map((clave) => (
                  <SelectItem key={clave} value={clave}>
                    {MOTIVO_LABEL[clave]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reportar-detalle">Detalle (opcional)</Label>
            <Textarea
              id="reportar-detalle"
              rows={3}
              value={detalle}
              onChange={(event) => setDetalle(event.target.value)}
              placeholder="Agrega contexto si es útil..."
            />
          </div>

          <SheetFooter className="p-0">
            <Button type="submit" variant="destructive" loading={enviando}>
              Enviar reporte
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
