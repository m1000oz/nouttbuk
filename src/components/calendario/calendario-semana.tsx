"use client";

import { PlusIcon } from "@phosphor-icons/react";

import { resolverColorCarpeta } from "@/lib/carpetas/colores";
import { DIAS_SEMANA, type BloqueHorario } from "@/lib/calendario/consultas";
import {
  TOTAL_FRANJAS,
  etiquetaFranja,
  filaInicio,
  filasSpan,
} from "@/lib/calendario/grilla";
import { BloqueSheet } from "@/components/calendario/bloque-sheet";
import { cn } from "@/lib/utils";

type CalendarioSemanaProps = {
  bloques: BloqueHorario[];
  // Modo interactivo (mi calendario): permite crear/editar bloques y cada
  // bloque muestra su propio título. Modo cruce (lectura, varias personas a
  // la vez): sin edición, cada bloque se identifica por su dueño en vez de
  // su título (evita filtrar el detalle de la materia de otra persona) y las
  // franjas ocupadas se resaltan como fondo aunque no quede espacio para
  // dibujar la barra del bloque.
  perfilId?: string;
  franjasOcupadas?: Set<string>;
  nombrePorPerfil?: Record<string, string>;
};

export function CalendarioSemana({
  bloques,
  perfilId,
  franjasOcupadas,
  nombrePorPerfil,
}: CalendarioSemanaProps) {
  const interactivo = Boolean(perfilId);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <div
        className="grid min-w-[720px]"
        style={{
          gridTemplateColumns: "56px repeat(7, 1fr)",
          gridTemplateRows: `auto repeat(${TOTAL_FRANJAS}, 28px)`,
        }}
      >
        <div className="sticky top-0 z-10 border-b border-border bg-card" />
        {DIAS_SEMANA.map((dia, indiceDia) => (
          <div
            key={dia}
            className="sticky top-0 z-10 border-b border-l border-border bg-card px-1 py-1.5 text-center text-xs font-semibold text-foreground"
            style={{ gridColumn: indiceDia + 2 }}
          >
            {dia.slice(0, 3)}
          </div>
        ))}

        {Array.from({ length: TOTAL_FRANJAS }).map((_, franja) => (
          <div
            key={`hora-${franja}`}
            className={cn(
              "border-b border-border px-1 text-right text-[10px] text-muted-foreground",
              franja % 2 === 0 ? "border-b-border" : "border-b-transparent",
            )}
            style={{ gridRow: franja + 2 }}
          >
            {franja % 2 === 0 ? etiquetaFranja(franja) : ""}
          </div>
        ))}

        {DIAS_SEMANA.map((_, indiceDia) =>
          Array.from({ length: TOTAL_FRANJAS }).map((_, franja) => {
            const clave = `${indiceDia}:${franja}`;
            const libreParaTodos =
              franjasOcupadas !== undefined && !franjasOcupadas.has(clave);
            return (
              <div
                key={clave}
                className={cn(
                  "border-b border-l border-border",
                  franja % 2 === 1 && "border-b-border/50",
                  libreParaTodos && "bg-success/10",
                )}
                style={{ gridColumn: indiceDia + 2, gridRow: franja + 2 }}
              />
            );
          }),
        )}

        {interactivo &&
          DIAS_SEMANA.map((_, indiceDia) => (
            <BloqueSheet
              key={`nuevo-${indiceDia}`}
              perfilId={perfilId!}
              diaInicial={indiceDia}
              trigger={
                <button
                  type="button"
                  aria-label={`Agregar bloque el ${DIAS_SEMANA[indiceDia]}`}
                  className="group flex items-center justify-center opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100"
                  style={{ gridColumn: indiceDia + 2, gridRow: "2 / -1" }}
                >
                  <PlusIcon className="size-4 text-primary" aria-hidden />
                </button>
              }
            />
          ))}

        {bloques.map((bloque) => {
          const nombreDueno = nombrePorPerfil?.[bloque.perfil_id];
          const etiqueta = interactivo || !nombreDueno ? bloque.titulo : nombreDueno;
          const contenido = (
            <div
              className="m-px overflow-hidden rounded-md px-1.5 py-0.5 text-left text-[11px] leading-tight font-medium text-white"
              style={{
                gridColumn: bloque.dia_semana + 2,
                gridRow: `${filaInicio(bloque.hora_inicio) + 1} / span ${filasSpan(bloque.hora_inicio, bloque.hora_fin)}`,
                backgroundColor: resolverColorCarpeta(bloque.color),
              }}
              title={`${bloque.titulo} (${bloque.hora_inicio.slice(0, 5)}–${bloque.hora_fin.slice(0, 5)})`}
            >
              <span className="line-clamp-2">{etiqueta}</span>
            </div>
          );

          if (!interactivo) {
            return <div key={bloque.id}>{contenido}</div>;
          }

          return (
            <BloqueSheet
              key={bloque.id}
              perfilId={perfilId!}
              bloque={{
                id: bloque.id,
                titulo: bloque.titulo,
                diaSemana: bloque.dia_semana,
                horaInicio: bloque.hora_inicio,
                horaFin: bloque.hora_fin,
                color: bloque.color,
              }}
              trigger={
                <button
                  type="button"
                  className="m-px overflow-hidden rounded-md px-1.5 py-0.5 text-left text-[11px] leading-tight font-medium text-white outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{
                    gridColumn: bloque.dia_semana + 2,
                    gridRow: `${filaInicio(bloque.hora_inicio) + 1} / span ${filasSpan(bloque.hora_inicio, bloque.hora_fin)}`,
                    backgroundColor: resolverColorCarpeta(bloque.color),
                  }}
                  title={`${bloque.titulo} (${bloque.hora_inicio.slice(0, 5)}–${bloque.hora_fin.slice(0, 5)})`}
                >
                  <span className="line-clamp-2">{etiqueta}</span>
                </button>
              }
            />
          );
        })}
      </div>
    </div>
  );
}
