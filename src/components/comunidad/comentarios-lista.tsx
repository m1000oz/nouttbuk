import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fechaRelativa } from "@/lib/fecha/relativa";
import { ReportarSheet } from "@/components/comunidad/reportar-sheet";

function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export type ComentarioData = {
  id: string;
  texto: string;
  createdAt: string;
  autor: { nombre: string; usuario: string; avatarUrl: string | null };
};

type ComentariosListaProps = {
  usuarioId: string | null;
  comentarios: ComentarioData[];
};

export function ComentariosLista({
  usuarioId,
  comentarios,
}: ComentariosListaProps) {
  if (usuarioId === null) {
    return (
      <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
        Inicia sesión para ver los comentarios.
      </p>
    );
  }

  if (comentarios.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
        Todavía no hay comentarios en esta publicación.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {comentarios.map((comentario) => (
        <li key={comentario.id} className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2.5">
            <Avatar size="sm">
              {comentario.autor.avatarUrl && (
                <AvatarImage src={comentario.autor.avatarUrl} alt="" />
              )}
              <AvatarFallback>
                {iniciales(comentario.autor.nombre)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-foreground">
                  {comentario.autor.nombre}
                </span>
                <span className="text-xs text-muted-foreground">
                  {fechaRelativa(comentario.createdAt)}
                </span>
              </div>
              <p className="text-sm text-foreground">{comentario.texto}</p>
            </div>
          </div>
          <ReportarSheet
            objetivo={{ tipo: "comentario", id: comentario.id }}
            usuarioId={usuarioId}
          />
        </li>
      ))}
    </ul>
  );
}
