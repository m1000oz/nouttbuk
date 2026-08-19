import { describe, expect, it } from "vitest";

import { extraerTextoPlano } from "@/lib/tiptap/extraer-texto-plano";

describe("extraerTextoPlano", () => {
  it("junta el texto de varios párrafos con espacios", () => {
    const contenido = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Hola" }] },
        { type: "paragraph", content: [{ type: "text", text: "mundo" }] },
      ],
    };
    expect(extraerTextoPlano(contenido)).toBe("Hola mundo");
  });

  it("trunca y agrega puntos suspensivos cuando excede el límite", () => {
    const contenido = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "a".repeat(200) }] }],
    };
    const resultado = extraerTextoPlano(contenido, 10);
    expect(resultado).toBe(`${"a".repeat(10)}…`);
  });

  it("devuelve una cadena vacía para un documento sin texto", () => {
    const contenido = { type: "doc", content: [{ type: "paragraph" }] };
    expect(extraerTextoPlano(contenido)).toBe("");
  });

  it("no falla con un contenido que no es un objeto", () => {
    expect(extraerTextoPlano(null)).toBe("");
    expect(extraerTextoPlano("texto suelto")).toBe("");
  });
});
