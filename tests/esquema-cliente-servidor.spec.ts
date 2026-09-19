import { getSchema } from "@tiptap/core";
import { describe, expect, it } from "vitest";

import { crearExtensionesEsquema } from "@/lib/tiptap/extensiones-documento";
import { crearExtensionesEsquemaServidor } from "@/lib/tiptap/extensiones-servidor";

// El servidor siembra las salas Yjs con SU esquema y los navegadores leen con
// el suyo: si difieren (un nodo, una marca o un atributo de más en uno solo)
// la siembra descarta o rechaza contenido sin avisar.
function describirEsquema(esquema: ReturnType<typeof getSchema>) {
  const nodos = Object.fromEntries(
    Object.entries(esquema.nodes).map(([nombre, tipo]) => [
      nombre,
      {
        contenido: tipo.spec.content ?? null,
        grupo: tipo.spec.group ?? null,
        inline: tipo.isInline,
        atributos: Object.keys(tipo.spec.attrs ?? {}).sort(),
      },
    ]),
  );
  const marcas = Object.fromEntries(
    Object.entries(esquema.marks).map(([nombre, tipo]) => [
      nombre,
      Object.keys(tipo.spec.attrs ?? {}).sort(),
    ]),
  );
  return { nodos, marcas };
}

describe("esquema Tiptap cliente y servidor", () => {
  for (const historial of [true, false]) {
    it(`coinciden exactamente (historial: ${historial})`, () => {
      const cliente = describirEsquema(getSchema(crearExtensionesEsquema({ historial })));
      const servidor = describirEsquema(getSchema(crearExtensionesEsquemaServidor({ historial })));
      expect(servidor).toEqual(cliente);
    });
  }

  it("el nodo imagen conserva ancho y modo de ajuste en el servidor", () => {
    const esquema = getSchema(crearExtensionesEsquemaServidor({ historial: false }));
    expect(Object.keys(esquema.nodes.image.spec.attrs ?? {})).toEqual(
      expect.arrayContaining(["src", "width", "align"]),
    );
    expect(esquema.nodes.image.isInline).toBe(true);
  });
});
