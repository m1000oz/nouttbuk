import { describe, expect, it } from "vitest";

import { colorParaUsuario } from "@/lib/liveblocks/color-usuario";
import { COLORES_CARPETA } from "@/lib/carpetas/colores";

describe("colorParaUsuario", () => {
  it("siempre devuelve un color de la paleta de carpetas", () => {
    const paleta = Object.values(COLORES_CARPETA);
    expect(paleta).toContain(colorParaUsuario("usuario-cualquiera"));
  });

  it("es determinístico: el mismo id siempre da el mismo color", () => {
    const id = "6e77c979-75bf-47c2-b17f-b88240452ea2";
    expect(colorParaUsuario(id)).toBe(colorParaUsuario(id));
  });

  it("ids distintos pueden dar colores distintos (no colapsa todo a uno solo)", () => {
    const colores = new Set(
      ["ana", "carlos", "beatriz", "diego", "elena"].map(colorParaUsuario),
    );
    expect(colores.size).toBeGreaterThan(1);
  });
});
