import type { BloqueHorario } from "@/lib/calendario/consultas";

// Grilla semanal: 7:00 a 22:00 en franjas de 30 minutos (30 filas), suficiente
// para el horario típico de clases/reuniones de un estudiante sin volver la
// grilla enorme. hora_inicio/hora_fin llegan de Postgres como "HH:MM:SS".
export const HORA_INICIO_GRILLA = 7;
export const HORA_FIN_GRILLA = 22;
const MINUTOS_POR_FRANJA = 30;
const MINUTOS_INICIO_GRILLA = HORA_INICIO_GRILLA * 60;
const MINUTOS_FIN_GRILLA = HORA_FIN_GRILLA * 60;
export const TOTAL_FRANJAS =
  (MINUTOS_FIN_GRILLA - MINUTOS_INICIO_GRILLA) / MINUTOS_POR_FRANJA;

export function minutosDesdeMedianoche(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

// Fila de CSS grid (1-indexada) donde empieza un bloque, acotada a la grilla
// visible: un bloque que empieza antes de las 7:00 se recorta a la fila 1 en
// vez de desbordar con un índice negativo.
export function filaInicio(hora: string): number {
  const minutos = minutosDesdeMedianoche(hora);
  const franja = Math.floor(
    (minutos - MINUTOS_INICIO_GRILLA) / MINUTOS_POR_FRANJA,
  );
  return Math.max(1, franja + 1);
}

export function filasSpan(horaInicio: string, horaFin: string): number {
  const inicio = Math.max(minutosDesdeMedianoche(horaInicio), MINUTOS_INICIO_GRILLA);
  const fin = Math.min(minutosDesdeMedianoche(horaFin), MINUTOS_FIN_GRILLA);
  return Math.max(1, Math.round((fin - inicio) / MINUTOS_POR_FRANJA));
}

export function etiquetaFranja(indiceFranja: number): string {
  const minutosTotales = MINUTOS_INICIO_GRILLA + indiceFranja * MINUTOS_POR_FRANJA;
  const h = Math.floor(minutosTotales / 60);
  const m = minutosTotales % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Para la vista de cruce: por día, el conjunto de índices de franja (0..TOTAL_FRANJAS-1)
// ocupados por AL MENOS UNO de los bloques dados. El resto de franjas dentro
// de la grilla queda "libre para todos" por descarte.
export function franjasOcupadas(bloques: BloqueHorario[]): Set<string> {
  const ocupadas = new Set<string>();
  for (const bloque of bloques) {
    const inicio = Math.max(
      Math.floor(
        (minutosDesdeMedianoche(bloque.hora_inicio) - MINUTOS_INICIO_GRILLA) /
          MINUTOS_POR_FRANJA,
      ),
      0,
    );
    const fin = Math.min(
      Math.ceil(
        (minutosDesdeMedianoche(bloque.hora_fin) - MINUTOS_INICIO_GRILLA) /
          MINUTOS_POR_FRANJA,
      ),
      TOTAL_FRANJAS,
    );
    for (let franja = inicio; franja < fin; franja++) {
      ocupadas.add(`${bloque.dia_semana}:${franja}`);
    }
  }
  return ocupadas;
}

export type RangoLibre = { inicio: string; fin: string };

// Convierte el set de franjas ocupadas en rangos de texto legibles por día
// ("14:00–16:00"), agrupando franjas libres consecutivas: es la respuesta
// directa a "en qué horarios pueden reunirse", no solo un mapa de colores.
export function rangosLibresPorDia(
  diaSemana: number,
  ocupadas: Set<string>,
): RangoLibre[] {
  const rangos: RangoLibre[] = [];
  let inicioFranja: number | null = null;

  for (let franja = 0; franja <= TOTAL_FRANJAS; franja++) {
    const libre = franja < TOTAL_FRANJAS && !ocupadas.has(`${diaSemana}:${franja}`);
    if (libre && inicioFranja === null) {
      inicioFranja = franja;
    } else if (!libre && inicioFranja !== null) {
      rangos.push({
        inicio: etiquetaFranja(inicioFranja),
        fin: etiquetaFranja(franja),
      });
      inicioFranja = null;
    }
  }

  return rangos;
}
