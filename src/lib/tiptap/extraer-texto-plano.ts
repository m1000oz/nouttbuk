import type { Json } from "@/lib/types/database.types";

type NodoTiptap = {
  text?: string;
  content?: NodoTiptap[];
};

function esNodoTiptap(valor: Json): valor is NodoTiptap & Record<string, Json> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function recolectarTexto(nodo: Json, partes: string[]): void {
  if (!esNodoTiptap(nodo)) return;

  if (typeof nodo.text === "string") {
    partes.push(nodo.text);
  }

  if (Array.isArray(nodo.content)) {
    for (const hijo of nodo.content) {
      recolectarTexto(hijo, partes);
    }
  }
}

// Arma un extracto de texto plano a partir del JSON de Tiptap almacenado en
// apuntes.contenido, para mostrar en tarjetas de feed que no pueden renderizar
// el documento completo.
export function extraerTextoPlano(contenido: Json, limite = 160): string {
  const partes: string[] = [];
  recolectarTexto(contenido, partes);
  const texto = partes.join(" ").replace(/\s+/g, " ").trim();

  if (texto.length <= limite) return texto;
  return `${texto.slice(0, limite).trimEnd()}…`;
}
