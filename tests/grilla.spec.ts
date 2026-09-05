import { describe, expect, it } from "vitest";

import {
  TOTAL_FRANJAS,
  etiquetaFranja,
  filaInicio,
  filasSpan,
  franjasOcupadas,
  minutosDesdeMedianoche,
  rangosLibresPorDia,
} from "@/lib/calendario/grilla";
import type { BloqueHorario } from "@/lib/calendario/consultas";

// Construye un bloque de prueba sin pasar por Supabase: la grilla solo
// necesita dia_semana/hora_inicio/hora_fin, el resto son campos que el
// cálculo no lee.
function bloque(
  diaSemana: number,
  horaInicio: string,
  horaFin: string,
): BloqueHorario {
  return {
    id: crypto.randomUUID(),
    perfil_id: "perfil-de-prueba",
    titulo: "Bloque de prueba",
    dia_semana: diaSemana,
    hora_inicio: horaInicio,
    hora_fin: horaFin,
    color: "blue",
  };
}

describe("minutosDesdeMedianoche", () => {
  it("convierte horas de Postgres a minutos", () => {
    expect(minutosDesdeMedianoche("07:00:00")).toBe(420);
    expect(minutosDesdeMedianoche("14:30:00")).toBe(870);
  });
});

describe("filaInicio", () => {
  it("un bloque que empieza al inicio de la grilla va a la fila 1", () => {
    expect(filaInicio("07:00:00")).toBe(1);
  });

  it("un bloque a las 14:00 cae en la fila 15 (7 horas = 14 franjas de 30 min después de las 7:00)", () => {
    expect(filaInicio("14:00:00")).toBe(15);
  });

  it("un bloque que empieza antes de la grilla se recorta a la fila 1, no da un índice negativo", () => {
    expect(filaInicio("06:00:00")).toBe(1);
  });
});

describe("filasSpan", () => {
  it("un bloque de 1.5 horas ocupa 3 franjas de 30 minutos", () => {
    expect(filasSpan("09:00:00", "10:30:00")).toBe(3);
  });

  it("un bloque que se sale de la grilla por ambos lados se recorta al total de franjas", () => {
    expect(filasSpan("05:00:00", "23:00:00")).toBe(TOTAL_FRANJAS);
  });

  it("nunca da un span menor a 1, ni con un rango degenerado", () => {
    expect(filasSpan("10:00:00", "10:00:00")).toBeGreaterThanOrEqual(1);
  });
});

describe("etiquetaFranja", () => {
  it("la franja 0 es el inicio de la grilla", () => {
    expect(etiquetaFranja(0)).toBe("07:00");
  });

  it("la última franja válida es media hora antes del fin de la grilla", () => {
    expect(etiquetaFranja(TOTAL_FRANJAS - 1)).toBe("21:30");
  });
});

describe("franjasOcupadas", () => {
  it("deduplica el solape de dos bloques del mismo día en vez de sumarlos", () => {
    const ocupadas = franjasOcupadas([
      bloque(0, "09:00:00", "10:30:00"),
      bloque(0, "10:00:00", "11:00:00"),
    ]);
    // Unión real: 09:00-11:00 = 4 franjas de 30 min, no 3+2=5.
    expect(ocupadas.size).toBe(4);
  });

  it("bloques en días distintos nunca colisionan entre sí", () => {
    const ocupadas = franjasOcupadas([
      bloque(0, "09:00:00", "10:00:00"),
      bloque(1, "09:00:00", "10:00:00"),
    ]);
    expect(ocupadas.has("0:4")).toBe(true);
    expect(ocupadas.has("1:4")).toBe(true);
    expect(ocupadas.size).toBe(4);
  });
});

describe("rangosLibresPorDia", () => {
  it("un día sin bloques está libre de punta a punta", () => {
    const rangos = rangosLibresPorDia(0, new Set());
    expect(rangos).toEqual([{ inicio: "07:00", fin: "22:00" }]);
  });

  it("un día totalmente ocupado no tiene ningún rango libre", () => {
    const ocupadas = franjasOcupadas([bloque(0, "07:00:00", "22:00:00")]);
    expect(rangosLibresPorDia(0, ocupadas)).toEqual([]);
  });

  it("calcula los huecos libres exactos entre bloques ocupados (verificado a mano con dos cuentas reales)", () => {
    const ocupadas = franjasOcupadas([
      bloque(0, "09:00:00", "12:00:00"),
      bloque(0, "14:00:00", "15:00:00"),
    ]);
    expect(rangosLibresPorDia(0, ocupadas)).toEqual([
      { inicio: "07:00", fin: "09:00" },
      { inicio: "12:00", fin: "14:00" },
      { inicio: "15:00", fin: "22:00" },
    ]);
  });
});
