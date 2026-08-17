import { describe, expect, it } from "vitest";

import { esCorreoInstitucionalValido } from "@/lib/auth/dominio-institucional";

describe("esCorreoInstitucionalValido", () => {
  it("acepta un correo @pucp.edu.pe", () => {
    expect(esCorreoInstitucionalValido("estudiante@pucp.edu.pe")).toBe(true);
  });

  it("acepta el dominio sin distinguir mayúsculas", () => {
    expect(esCorreoInstitucionalValido("Estudiante@PUCP.EDU.PE")).toBe(true);
  });

  it("rechaza otros dominios", () => {
    expect(esCorreoInstitucionalValido("estudiante@gmail.com")).toBe(false);
  });

  it("rechaza dominios que solo contienen la cadena pucp.edu.pe sin terminar en ella", () => {
    expect(esCorreoInstitucionalValido("estudiante@pucp.edu.pe.evil.com")).toBe(
      false,
    );
  });
});
