import { getSchema } from "@tiptap/core";
import type { Liveblocks } from "@liveblocks/node";
import { prosemirrorJSONToYXmlFragment } from "y-prosemirror";
import * as Y from "yjs";

import { NOMBRE_TEXTO_TITULO } from "@/lib/liveblocks/nombres-sala";
import { crearExtensionesEsquemaServidor } from "@/lib/tiptap/extensiones-servidor";
import type { Json } from "@/lib/types/database.types";

// Claves de metadatos de la sala que marcan "ya se sembró" cada parte. Son
// solo una optimización para no descargar el documento Yjs en cada
// autorización: la corrección no depende de ellas, ver más abajo.
const METADATO_CONTENIDO = "sembrado";
const METADATO_TITULO = "titulo_sembrado";

// Identificadores de cliente FIJOS para los documentos de siembra. Es lo que
// hace que sembrar sea idempotente: dos siembras concurrentes (o repetidas)
// del mismo dato generan exactamente los mismos ítems Yjs con los mismos ids,
// y aplicar dos veces la misma actualización deja una sola copia. Con un
// clientID aleatorio por siembra, dos personas abriendo a la vez una nota
// nueva duplicaban todo el contenido. Son uint32 arbitrarios: la
// probabilidad de que coincidan con el de un cliente real (aleatorio de 32
// bits) es ~2^-32, despreciable. Contenido y título usan ids DISTINTOS a
// propósito: el título se agregó después de que ya hubiera salas sembradas, y
// reutilizar el id del contenido habría generado ítems con ids repetidos
// (mismo cliente, mismos relojes) sobre esas salas, corrompiéndolas.
const CLIENT_ID_CONTENIDO = 0x5eed5eed;
const CLIENT_ID_TITULO = 0x71710001;

const NOMBRE_FRAGMENTO = "default";

export function crearActualizacionDeSiembra(contenido: Json): Uint8Array {
  const esquema = getSchema(crearExtensionesEsquemaServidor({ historial: false }));
  const doc = new Y.Doc();
  doc.clientID = CLIENT_ID_CONTENIDO;
  prosemirrorJSONToYXmlFragment(
    esquema,
    contenido as Parameters<typeof prosemirrorJSONToYXmlFragment>[1],
    doc.getXmlFragment(NOMBRE_FRAGMENTO),
  );
  return Y.encodeStateAsUpdate(doc);
}

export function crearActualizacionDeTitulo(titulo: string): Uint8Array {
  const doc = new Y.Doc();
  doc.clientID = CLIENT_ID_TITULO;
  doc.getText(NOMBRE_TEXTO_TITULO).insert(0, titulo);
  return Y.encodeStateAsUpdate(doc);
}

function cargar(actualizacion: ArrayBuffer): Y.Doc {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, new Uint8Array(actualizacion));
  return doc;
}

// Sin ninguna estructura: ni contenido ni historial de borrados. Un documento
// donde alguien escribió y luego borró todo NO está vacío en este sentido
// (conserva sus ítems borrados), así que nunca se vuelve a sembrar sobre el
// trabajo de alguien.
function estaVacio(doc: Y.Doc): boolean {
  return doc.store.clients.size === 0;
}

function tieneTituloSembrado(doc: Y.Doc): boolean {
  return Y.decodeStateVector(Y.encodeStateVector(doc)).has(CLIENT_ID_TITULO);
}

export type DatosDeApunte = {
  contenido: Json | null;
  titulo: string;
};

// Garantiza que la sala Yjs de un apunte exista y contenga el contenido y el
// título guardados en Postgres, sembrándolos una sola vez desde el servidor
// ANTES de que ningún cliente se conecte. Reemplaza a la siembra que hacían
// los navegadores al ver el fragmento vacío tras `sync`, que con dos
// conexiones simultáneas era una carrera. Cada parte se decide por separado
// (una sala puede tener contenido de antes del título compartido) pero se
// envía en UNA sola actualización, para que un fallo a mitad de camino no
// deje la sala con una parte sí y otra no.
export async function asegurarSalaSembrada(
  liveblocks: Liveblocks,
  roomId: string,
  obtenerDatos: () => Promise<DatosDeApunte>,
): Promise<void> {
  const sala = await liveblocks.getOrCreateRoom(roomId, {
    defaultAccesses: [],
    metadata: {},
  });
  const contenidoListo = sala.metadata?.[METADATO_CONTENIDO] === "1";
  const tituloListo = sala.metadata?.[METADATO_TITULO] === "1";
  if (contenidoListo && tituloListo) return;

  const actual = cargar(await liveblocks.getYjsDocumentAsBinaryUpdate(roomId));
  const datos = await obtenerDatos();

  const actualizaciones: Uint8Array[] = [];
  if (!contenidoListo && estaVacio(actual) && datos.contenido) {
    actualizaciones.push(crearActualizacionDeSiembra(datos.contenido));
  }
  if (!tituloListo && !tieneTituloSembrado(actual) && datos.titulo) {
    actualizaciones.push(crearActualizacionDeTitulo(datos.titulo));
  }
  if (actualizaciones.length > 0) {
    await liveblocks.sendYjsBinaryUpdate(roomId, Y.mergeUpdates(actualizaciones));
  }

  await liveblocks.updateRoom(roomId, {
    metadata: { [METADATO_CONTENIDO]: "1", [METADATO_TITULO]: "1" },
  });
}
