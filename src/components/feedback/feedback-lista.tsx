import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { fechaRelativa } from "@/lib/fecha/relativa";
import { VotoBoton } from "@/components/feedback/voto-boton";
import type { FeedbackEstado } from "@/lib/types/enums";

export type FeedbackIdea = {
  id: string;
  texto: string;
  estado: FeedbackEstado;
  createdAt: string;
  autor: { nombre: string; usuario: string; avatarUrl: string | null };
  votos: number;
  yaVote: boolean;
};

const ESTADO_LABEL: Record<FeedbackEstado, string> = {
  nueva: "Nueva",
  en_revision: "En revisión",
  hecho: "Hecho",
};

// nueva usa el estilo por defecto de Badge outline; en_revision/hecho
// reutilizan los tokens --color-warning/--color-success ya existentes en
// globals.css, sin inventar colores nuevos para el board.
const ESTADO_CLASSNAME: Record<FeedbackEstado, string> = {
  nueva: "",
  en_revision: "border-transparent bg-warning/10 text-warning",
  hecho: "border-transparent bg-success/10 text-success",
};

function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type FeedbackListaProps = {
  usuarioId: string;
  ideas: FeedbackIdea[];
};

export function FeedbackLista({ usuarioId, ideas }: FeedbackListaProps) {
  if (ideas.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
        Todavía no hay ideas propuestas. ¡Anímate a escribir la primera!
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {ideas.map((idea) => (
        <li
          key={idea.id}
          className="flex items-start gap-3 rounded-lg border border-border px-3 py-3"
        >
          <VotoBoton
            feedbackId={idea.id}
            usuarioId={usuarioId}
            activo={idea.yaVote}
            count={idea.votos}
          />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Avatar size="sm">
                  {idea.autor.avatarUrl && (
                    <AvatarImage src={idea.autor.avatarUrl} alt="" />
                  )}
                  <AvatarFallback>{iniciales(idea.autor.nombre)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">
                  {idea.autor.nombre}
                </span>
                <span className="text-xs text-muted-foreground">
                  {fechaRelativa(idea.createdAt)}
                </span>
              </div>
              <Badge variant="outline" className={ESTADO_CLASSNAME[idea.estado]}>
                {ESTADO_LABEL[idea.estado]}
              </Badge>
            </div>
            <p className="text-sm text-foreground">{idea.texto}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
