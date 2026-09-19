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

// Recorta un texto plano ya extraído a `limite` caracteres, agregando "…" si
// hizo falta cortar. Separado de extraerTextoPlano para poder re-recortar un
// extracto ya guardado (apuntes.extracto) a distintos tamaños según la
// tarjeta que lo muestra, sin volver a caminar el JSON de Tiptap.
export function recortarTexto(texto: string, limite: number): string {
  if (texto.length <= limite) return texto;
  return `${texto.slice(0, limite).trimEnd()}…`;
}

// Arma un extracto de texto plano a partir del JSON de Tiptap almacenado en
// apuntes.contenido. Se calcula una sola vez al guardar el apunte (ver
// apunte-editor.tsx) y se persiste en apuntes.extracto, para que los
// listados (Mis apuntes, Inicio, los feeds de Comunidad/Amigos) no necesiten
// traer el `contenido` completo solo para mostrar una vista previa. El
// límite por defecto (300) es mayor que cualquier tarjeta individual
// necesita (160-220), así el extracto guardado sirve para recortes más
// cortos en el cliente vía recortarTexto sin perder texto real.
export function extraerTextoPlano(contenido: Json, limite = 300): string {
  const partes: string[] = [];
  recolectarTexto(contenido, partes);
  const texto = partes.join(" ").replace(/\s+/g, " ").trim();
  return recortarTexto(texto, limite);
}
