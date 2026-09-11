import { describe, expect, it } from "vitest";

import { mapearErrorAuth } from "@/lib/auth/mapear-error-auth";

describe("mapearErrorAuth", () => {
  it("reconoce el rechazo de dominio institucional", () => {
    const resultado = mapearErrorAuth(
      new Error(
        "El registro solo está permitido con un correo institucional @pucp.edu.pe",
      ),
    );
    expect(resultado.tipo).toBe("dominio");
  });

  it("reconoce credenciales inválidas", () => {
    const resultado = mapearErrorAuth(new Error("Invalid login credentials"));
    expect(resultado.tipo).toBe("credenciales");
  });

  it("reconoce un correo ya registrado", () => {
    const resultado = mapearErrorAuth(
      new Error("User already registered"),
    );
    expect(resultado.tipo).toBe("duplicado");
  });

  it("reconoce un código de verificación inválido o vencido", () => {
    const resultado = mapearErrorAuth(
      new Error("Token has expired or is invalid"),
    );
    expect(resultado.tipo).toBe("codigo");
  });

  it("cae en el caso genérico para errores no reconocidos", () => {
    const resultado = mapearErrorAuth(new Error("algo salió mal"));
    expect(resultado.tipo).toBe("red");
  });
});
