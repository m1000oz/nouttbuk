import { describe, expect, it } from "vitest";

import { posicionarBloques } from "@/lib/calendario/grilla";
import type { BloqueHorario } from "@/lib/calendario/consultas";

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

describe("posicionarBloques", () => {
  it("sin cruces, cada bloque ocupa toda la columna (columna 0 de 1)", () => {
    const posicionados = posicionarBloques([
      bloque(0, "09:00:00", "10:00:00"),
      bloque(0, "14:00:00", "15:00:00"),
    ]);
    expect(posicionados).toHaveLength(2);
    for (const bloque of posicionados) {
      expect(bloque.columna).toBe(0);
      expect(bloque.columnas).toBe(1);
    }
  });

  it("dos bloques que se cruzan se reparten en dos columnas distintas", () => {
    const posicionados = posicionarBloques([
      bloque(0, "09:00:00", "10:30:00"),
      bloque(0, "10:00:00", "11:00:00"),
    ]);
    expect(posicionados).toHaveLength(2);
    expect(posicionados.every((b) => b.columnas === 2)).toBe(true);
    const columnas = posicionados.map((b) => b.columna).sort();
    expect(columnas).toEqual([0, 1]);
  });

  it("tres bloques encadenados (A-B se cruzan, B-C se cruzan, A-C no) forman un solo clúster, y A/C pueden reusar columna ya que nunca se cruzan directamente", () => {
    const posicionados = posicionarBloques([
      bloque(0, "09:00:00", "10:00:00"), // A
      bloque(0, "09:30:00", "10:30:00"), // B: cruza con A y con C
      bloque(0, "10:15:00", "11:00:00"), // C: cruza con B, no con A
    ]);
    expect(posicionados).toHaveLength(3);
    // El máximo de bloques simultáneos en cualquier instante del clúster es
    // 2 (A+B, o B+C), nunca 3 a la vez, así que 2 columnas alcanzan.
    expect(posicionados.every((b) => b.columnas === 2)).toBe(true);
  });

  it("tres bloques que sí se cruzan todos a la vez necesitan 3 columnas", () => {
    const posicionados = posicionarBloques([
      bloque(0, "09:00:00", "11:00:00"), // A
      bloque(0, "09:15:00", "10:45:00"), // B: dentro de A
      bloque(0, "09:30:00", "10:30:00"), // C: dentro de A y B, los tres coinciden a las 09:30
    ]);
    expect(posicionados).toHaveLength(3);
    expect(posicionados.every((b) => b.columnas === 3)).toBe(true);
    const columnas = posicionados.map((b) => b.columna).sort();
    expect(columnas).toEqual([0, 1, 2]);
  });

  it("A y C, que no se cruzan entre sí pero ambos cruzan con B, pueden compartir columna", () => {
    const porId = new Map(
      posicionarBloques([
        bloque(0, "09:00:00", "10:00:00"), // A
        bloque(0, "09:30:00", "10:30:00"), // B: cruza con A y con C
        bloque(0, "10:15:00", "11:00:00"), // C: no cruza con A
      ]).map((b) => [`${b.hora_inicio}-${b.hora_fin}`, b]),
    );
    const a = porId.get("09:00:00-10:00:00")!;
    const c = porId.get("10:15:00-11:00:00")!;
    // A termina (10:00) antes de que C empiece (10:15): pueden reutilizar
    // la misma columna dentro del clúster de 3.
    expect(a.columna).toBe(c.columna);
  });

  it("bloques en días distintos nunca comparten clúster ni cuentan columnas del otro día", () => {
    const posicionados = posicionarBloques([
      bloque(0, "09:00:00", "10:00:00"),
      bloque(1, "09:00:00", "10:00:00"),
    ]);
    expect(posicionados).toHaveLength(2);
    for (const bloque of posicionados) {
      expect(bloque.columna).toBe(0);
      expect(bloque.columnas).toBe(1);
    }
  });

  it("conserva el resto de campos del bloque original", () => {
    const original = bloque(2, "09:00:00", "10:00:00");
    const [posicionado] = posicionarBloques([original]);
    expect(posicionado).toMatchObject({
      id: original.id,
      perfil_id: original.perfil_id,
      titulo: original.titulo,
      dia_semana: original.dia_semana,
      hora_inicio: original.hora_inicio,
      hora_fin: original.hora_fin,
      color: original.color,
    });
  });
});
