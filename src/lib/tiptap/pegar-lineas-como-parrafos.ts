import { Fragment, Slice } from "@tiptap/pm/model";
import type { Node as NodoProseMirror } from "@tiptap/pm/model";

// El pegado (tanto de texto plano sin HTML como, más comúnmente, de HTML con
// saltos de línea sueltos: notepad, un PDF, un chat) puede llegar convertido
// en UN SOLO párrafo con varios `hardBreak` adentro en vez de en párrafos
// separados — es el comportamiento por defecto de ProseMirror para texto
// plano cuando la fuente no marca líneas en blanco, y para HTML depende de
// cómo la fuente representó sus propios saltos de línea. `Paginacion` (ver
// pagination-extension.ts) nunca puede partir un nodo de nivel superior a la
// mitad, así que un párrafo así de largo se empuja completo a la hoja
// siguiente si no cabe entero, desperdiciando hasta toda su altura en blanco
// — con varias líneas así pegadas seguidas esto se ve exactamente como
// páginas casi vacías, el reporte real de "romper todo" que originó este
// archivo. La solución no ataca cómo se pegó (texto plano vs HTML: ambos
// caminos terminan pasando por acá, ver el comentario de `transformPasted`
// más abajo) sino el resultado ya parseado: cualquier salto de línea duro
// dentro de un párrafo se convierte en un párrafo nuevo, dándole a
// Paginacion un punto de corte natural entre cada línea.

function contieneSaltoDuro(nodo: NodoProseMirror): boolean {
  let encontrado = false;
  nodo.content.forEach((hijo) => {
    if (hijo.type.name === "hardBreak") encontrado = true;
  });
  return encontrado;
}

function partirPorSaltosDuros(nodo: NodoProseMirror): NodoProseMirror[] {
  const segmentos: NodoProseMirror[][] = [[]];
  nodo.content.forEach((hijo) => {
    if (hijo.type.name === "hardBreak") {
      segmentos.push([]);
    } else {
      segmentos[segmentos.length - 1].push(hijo);
    }
  });
  // Cada segmento se reconstruye como un nodo del MISMO tipo que el
  // original (normalmente "paragraph", pero también podría ser un
  // encabezado con saltos duros adentro): no se fuerza todo a párrafo.
  return segmentos.map((segmento) =>
    nodo.type.create(nodo.attrs, Fragment.fromArray(segmento), nodo.marks),
  );
}

function dividirEnParrafos(fragmento: Fragment): Fragment {
  const resultado: NodoProseMirror[] = [];
  fragmento.forEach((nodo) => {
    if (nodo.isTextblock && contieneSaltoDuro(nodo)) {
      resultado.push(...partirPorSaltosDuros(nodo));
    } else if (nodo.content.childCount > 0) {
      // Recurre dentro de contenedores de bloque (citas, ítems de lista):
      // un salto duro pegado ahí adentro merece el mismo tratamiento.
      resultado.push(nodo.copy(dividirEnParrafos(nodo.content)));
    } else {
      resultado.push(nodo);
    }
  });
  return Fragment.fromArray(resultado);
}

// `transformPasted` (a diferencia de `clipboardTextParser`, que solo corre
// cuando el portapapeles no trae HTML) se ejecuta siempre, sea cual sea el
// camino que ProseMirror haya usado para construir el slice pegado — el
// punto de intercepción correcto para esta corrección sin importar de dónde
// venga el contenido.
export function crearTransformPasted() {
  return (slice: Slice): Slice => {
    const contenido = dividirEnParrafos(slice.content);
    return new Slice(contenido, slice.openStart, slice.openEnd);
  };
}
