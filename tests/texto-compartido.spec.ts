import * as Y from "yjs";
import { describe, expect, it } from "vitest";

import { reemplazarTextoCompartido } from "@/lib/liveblocks/texto-compartido";

function nuevo(texto: string) {
  const doc = new Y.Doc();
  const t = doc.getText("titulo");
  t.insert(0, texto);
  return { doc, t };
}

function sincronizar(a: Y.Doc, b: Y.Doc) {
  Y.applyUpdate(b, Y.encodeStateAsUpdate(a, Y.encodeStateVector(b)));
  Y.applyUpdate(a, Y.encodeStateAsUpdate(b, Y.encodeStateVector(a)));
}

describe("reemplazarTextoCompartido", () => {
  it("lleva el texto al valor pedido (insertar, borrar y reemplazar)", () => {
    const { t } = nuevo("Cálculo 1");
    for (const objetivo of ["Cálculo 1 parcial", "Cálculo", "Álgebra", "", "Álgebra lineal", "Álgebra lineal"]) {
      reemplazarTextoCompartido(t, objetivo);
      expect(t.toString()).toBe(objetivo);
    }
  });

  it("no genera cambios si el texto es igual", () => {
    const { doc, t } = nuevo("igual");
    let cambios = 0;
    doc.on("update", () => (cambios += 1));
    reemplazarTextoCompartido(t, "igual");
    expect(cambios).toBe(0);
  });

  it("solo toca lo que cambió: una edición concurrente en otro extremo sobrevive", () => {
    const a = nuevo("Historia del Perú");
    const bDoc = new Y.Doc();
    sincronizar(a.doc, bDoc);
    const tb = bDoc.getText("titulo");

    // A cambia el principio, B cambia el final, sin verse.
    reemplazarTextoCompartido(a.t, "Historia moderna del Perú");
    reemplazarTextoCompartido(tb, "Historia del Perú (resumen)");
    sincronizar(a.doc, bDoc);

    expect(a.t.toString()).toBe(tb.toString());
    expect(a.t.toString()).toBe("Historia moderna del Perú (resumen)");
  });

  it("no parte un emoji (par sustituto) al editar junto a él", () => {
    const { t } = nuevo("Notas 😀");
    reemplazarTextoCompartido(t, "Notas 😃");
    expect(t.toString()).toBe("Notas 😃");
    reemplazarTextoCompartido(t, "Notas 😃!");
    expect(t.toString()).toBe("Notas 😃!");
    reemplazarTextoCompartido(t, "Mis notas 😃!");
    expect(t.toString()).toBe("Mis notas 😃!");
  });
});
