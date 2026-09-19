import { getSchema } from "@tiptap/core";
import type { Liveblocks } from "@liveblocks/node";
import { yXmlFragmentToProseMirrorRootNode } from "y-prosemirror";
import * as Y from "yjs";
import { describe, expect, it } from "vitest";

import {
  asegurarSalaSembrada,
  crearActualizacionDeSiembra,
  crearActualizacionDeTitulo,
} from "@/lib/liveblocks/sembrar-sala";
import { crearExtensionesEsquema } from "@/lib/tiptap/extensiones-documento";
import type { Json } from "@/lib/types/database.types";

const esquema = getSchema(crearExtensionesEsquema({ historial: false }));

const CONTENIDO: Json = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Título" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Hola ", marks: [{ type: "bold" }] },
        { type: "text", text: "mundo" },
      ],
    },
    { type: "paragraph", content: [{ type: "text", text: "Tercer párrafo" }] },
  ],
};

const DATOS = { contenido: CONTENIDO, titulo: "Mi apunte" };

function leer(doc: Y.Doc) {
  return yXmlFragmentToProseMirrorRootNode(doc.getXmlFragment("default"), esquema);
}

// Sala falsa de Liveblocks respaldada por un Y.Doc real: lo justo para
// ejercitar asegurarSalaSembrada sin red.
function crearSalaFalsa() {
  const doc = new Y.Doc();
  const metadata: Record<string, string> = {};
  let siembras = 0;
  const liveblocks = {
    getOrCreateRoom: async () => ({ metadata: { ...metadata } }),
    getYjsDocumentAsBinaryUpdate: async () => {
      const u = Y.encodeStateAsUpdate(doc);
      return u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength);
    },
    sendYjsBinaryUpdate: async (_id: string, update: Uint8Array) => {
      siembras += 1;
      Y.applyUpdate(doc, update);
    },
    updateRoom: async (_id: string, params: { metadata: Record<string, string> }) => {
      Object.assign(metadata, params.metadata);
    },
  } as unknown as Liveblocks;
  return { doc, metadata, liveblocks, siembras: () => siembras };
}

describe("crearActualizacionDeSiembra", () => {
  it("es determinista: el mismo contenido produce exactamente los mismos bytes", () => {
    const a = crearActualizacionDeSiembra(CONTENIDO);
    const b = crearActualizacionDeSiembra(CONTENIDO);
    expect(Buffer.compare(Buffer.from(a), Buffer.from(b))).toBe(0);
  });

  it("aplicarla varias veces no duplica el contenido", () => {
    const destino = new Y.Doc();
    const semilla = crearActualizacionDeSiembra(CONTENIDO);
    Y.applyUpdate(destino, semilla);
    Y.applyUpdate(destino, semilla);
    Y.applyUpdate(destino, crearActualizacionDeSiembra(CONTENIDO));
    const nodo = leer(destino);
    expect(nodo.childCount).toBe(3);
    expect(nodo.textContent).toBe("TítuloHola mundoTercer párrafo");
  });
});

describe("asegurarSalaSembrada", () => {
  it("siembra una sala vacía con el contenido de Postgres y la marca", async () => {
    const sala = crearSalaFalsa();
    await asegurarSalaSembrada(sala.liveblocks, "apunte-1", async () => DATOS);
    expect(leer(sala.doc).textContent).toBe("TítuloHola mundoTercer párrafo");
    expect(sala.metadata.sembrado).toBe("1");
    expect(sala.doc.getText("titulo").toString()).toBe("Mi apunte");
  });

  it("veinte aperturas concurrentes de una sala nueva dejan un solo documento", async () => {
    const sala = crearSalaFalsa();
    await Promise.all(
      Array.from({ length: 20 }, () =>
        asegurarSalaSembrada(sala.liveblocks, "apunte-1", async () => DATOS),
      ),
    );
    // La carrera es real: todas leyeron la sala vacía y todas enviaron la semilla.
    expect(sala.siembras()).toBeGreaterThan(1);
    const nodo = leer(sala.doc);
    expect(nodo.childCount).toBe(3);
    expect(nodo.textContent).toBe("TítuloHola mundoTercer párrafo");
    expect(sala.doc.getText("titulo").toString()).toBe("Mi apunte");
  });

  it("una sala sembrada antes del título recibe solo el título, sin tocar el contenido", async () => {
    const sala = crearSalaFalsa();
    Y.applyUpdate(sala.doc, crearActualizacionDeSiembra(CONTENIDO));
    sala.metadata.sembrado = "1";
    const antes = Y.encodeStateAsUpdate(sala.doc);

    await asegurarSalaSembrada(sala.liveblocks, "apunte-1", async () => DATOS);
    await asegurarSalaSembrada(sala.liveblocks, "apunte-1", async () => DATOS);
    expect(sala.doc.getText("titulo").toString()).toBe("Mi apunte");
    expect(leer(sala.doc).childCount).toBe(3);
    // El contenido sigue siendo el mismo documento, nada se duplicó.
    const solo = new Y.Doc();
    Y.applyUpdate(solo, antes);
    expect(leer(solo).textContent).toBe(leer(sala.doc).textContent);
  });

  it("la siembra del título es idempotente y no se pisa con ediciones posteriores", () => {
    const doc = new Y.Doc();
    Y.applyUpdate(doc, crearActualizacionDeTitulo("Mi apunte"));
    Y.applyUpdate(doc, crearActualizacionDeTitulo("Mi apunte"));
    expect(doc.getText("titulo").toString()).toBe("Mi apunte");
    doc.getText("titulo").insert(9, " final");
    Y.applyUpdate(doc, crearActualizacionDeTitulo("Mi apunte"));
    expect(doc.getText("titulo").toString()).toBe("Mi apunte final");
  });

  it("no toca una sala que ya tiene contenido de otra persona", async () => {
    const sala = crearSalaFalsa();
    const otro = new Y.Doc();
    otro.getXmlFragment("default").insert(0, [new Y.XmlElement("paragraph")]);
    Y.applyUpdate(sala.doc, Y.encodeStateAsUpdate(otro));
    sala.metadata.titulo_sembrado = "1";

    await asegurarSalaSembrada(sala.liveblocks, "apunte-1", async () => DATOS);
    expect(sala.siembras()).toBe(0);
    expect(sala.doc.getXmlFragment("default").length).toBe(1);
    expect(sala.metadata.sembrado).toBe("1");
  });

  it("no vuelve a sembrar una sala donde alguien borró todo el contenido", async () => {
    const sala = crearSalaFalsa();
    const fragmento = sala.doc.getXmlFragment("default");
    fragmento.insert(0, [new Y.XmlElement("paragraph")]);
    fragmento.delete(0, 1);
    expect(fragmento.length).toBe(0);
    sala.metadata.titulo_sembrado = "1";

    await asegurarSalaSembrada(sala.liveblocks, "apunte-1", async () => DATOS);
    expect(sala.siembras()).toBe(0);
    expect(fragmento.length).toBe(0);
  });

  it("con la marca ya puesta no descarga ni envía nada", async () => {
    const sala = crearSalaFalsa();
    sala.metadata.sembrado = "1";
    let consultas = 0;
    sala.metadata.titulo_sembrado = "1";
    await asegurarSalaSembrada(sala.liveblocks, "apunte-1", async () => {
      consultas += 1;
      return DATOS;
    });
    expect(consultas).toBe(0);
    expect(sala.siembras()).toBe(0);
  });

  it("propaga el error si el contenido no encaja en el esquema, sin marcar la sala", async () => {
    const sala = crearSalaFalsa();
    const invalido = { type: "doc", content: [{ type: "nodoQueNoExiste" }] } as Json;
    await expect(
      asegurarSalaSembrada(sala.liveblocks, "apunte-1", async () => ({ contenido: invalido, titulo: "x" })),
    ).rejects.toThrow();
    expect(sala.metadata.sembrado).toBeUndefined();
    expect(sala.doc.getXmlFragment("default").length).toBe(0);
  });
});
