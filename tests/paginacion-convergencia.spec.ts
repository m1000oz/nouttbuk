import { describe, expect, it } from "vitest";

import { sonCortesEquivalentes } from "@/lib/tiptap/pagination-extension";

describe("sonCortesEquivalentes", () => {
  it("devuelve false si alguno de los arreglos es nulo", () => {
    expect(sonCortesEquivalentes(null, [])).toBe(false);
    expect(sonCortesEquivalentes([], null)).toBe(false);
    expect(sonCortesEquivalentes(null, null)).toBe(false);
  });

  it("devuelve true si ambos arreglos están vacíos (documento de 1 página)", () => {
    expect(sonCortesEquivalentes([], [])).toBe(true);
  });

  it("devuelve false si tienen diferente cantidad de cortes", () => {
    expect(sonCortesEquivalentes([{ pos: 10, hueco: 100 }], [])).toBe(false);
    expect(
      sonCortesEquivalentes(
        [{ pos: 10, hueco: 100 }],
        [
          { pos: 10, hueco: 100 },
          { pos: 20, hueco: 150 },
        ],
      ),
    ).toBe(false);
  });

  it("devuelve false si la posición de corte difiere", () => {
    expect(
      sonCortesEquivalentes(
        [{ pos: 10, hueco: 100 }],
        [{ pos: 12, hueco: 100 }],
      ),
    ).toBe(false);
  });

  it("devuelve true si las posiciones son idénticas y los huecos están dentro de la tolerancia", () => {
    expect(
      sonCortesEquivalentes(
        [{ pos: 10, hueco: 100 }],
        [{ pos: 10, hueco: 101.5 }],
        2,
      ),
    ).toBe(true);

    expect(
      sonCortesEquivalentes(
        [{ pos: 10, hueco: 100 }],
        [{ pos: 10, hueco: 102 }],
        2,
      ),
    ).toBe(true);
  });

  it("devuelve false si la diferencia en el hueco excede la tolerancia", () => {
    expect(
      sonCortesEquivalentes(
        [{ pos: 10, hueco: 100 }],
        [{ pos: 10, hueco: 103 }],
        2,
      ),
    ).toBe(false);
  });

  it("compara correctamente listas de múltiples cortes", () => {
    const cortes1 = [
      { pos: 15, hueco: 120 },
      { pos: 45, hueco: 200 },
      { pos: 90, hueco: 85 },
    ];
    const cortes2 = [
      { pos: 15, hueco: 121 },
      { pos: 45, hueco: 199 },
      { pos: 90, hueco: 86 },
    ];
    expect(sonCortesEquivalentes(cortes1, cortes2, 2)).toBe(true);

    const cortesDistinto = [
      { pos: 15, hueco: 121 },
      { pos: 45, hueco: 205 }, // > 2px
      { pos: 90, hueco: 86 },
    ];
    expect(sonCortesEquivalentes(cortes1, cortesDistinto, 2)).toBe(false);
  });
});
