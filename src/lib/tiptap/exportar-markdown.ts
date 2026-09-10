// Tiptap v2 no trae un serializador a Markdown propio (a diferencia de v3).
// Se escribe uno a mano, cubriendo los nodos y marcas reales del esquema de
// este proyecto (ver crearExtensionesEsquema en extensiones-documento.ts) en
// vez de instalar una dependencia nueva solo para esto: es "mejor esfuerzo"
// (Markdown no tiene equivalente estándar para color/resaltado/subíndice/
// alineación de texto, esos se pierden a propósito) pensado para reabrir el
// apunte en otro editor de texto plano, no para un roundtrip perfecto.
type NodoJSON = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: NodoJSON[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
};

function escaparInline(texto: string): string {
  // Solo los caracteres que realmente disparan sintaxis inline (énfasis,
  // código): escapar guiones o puntos sueltos en medio de una oración
  // produciría un Markdown feo y sin necesidad real.
  return texto.replace(/([\\`*_])/g, "\\$1");
}

function aplicarMarcas(texto: string, marcas: NodoJSON["marks"]): string {
  if (!texto || !marcas || marcas.length === 0) return texto;
  return marcas.reduce((acumulado, marca) => {
    switch (marca.type) {
      case "bold":
        return `**${acumulado}**`;
      case "italic":
        return `_${acumulado}_`;
      case "strike":
        return `~~${acumulado}~~`;
      case "code":
        return `\`${acumulado}\``;
      case "link":
        return `[${acumulado}](${(marca.attrs?.href as string) ?? ""})`;
      // subíndice/superíndice/resaltado/color/textStyle no tienen sintaxis
      // estándar en Markdown: se deja el texto tal cual, sin inventar una.
      default:
        return acumulado;
    }
  }, texto);
}

function extraerTextoPlano(nodos: NodoJSON[] | undefined): string {
  if (!nodos) return "";
  return nodos
    .map((nodo) => (nodo.type === "text" ? (nodo.text ?? "") : extraerTextoPlano(nodo.content)))
    .join("");
}

function serializarInline(nodos: NodoJSON[] | undefined): string {
  if (!nodos) return "";
  return nodos
    .map((nodo) => {
      if (nodo.type === "text") return aplicarMarcas(escaparInline(nodo.text ?? ""), nodo.marks);
      if (nodo.type === "hardBreak") return "  \n";
      if (nodo.type === "image") {
        return `![${(nodo.attrs?.alt as string) ?? ""}](${(nodo.attrs?.src as string) ?? ""})`;
      }
      if (nodo.type === "inlineMath") return `$${(nodo.attrs?.latex as string) ?? ""}$`;
      return extraerTextoPlano([nodo]);
    })
    .join("");
}

function serializarCeldaTabla(celda: NodoJSON): string {
  // Cada celda es un párrafo (a veces varios): se aplanan a una sola línea
  // separada por espacios, ya que una tabla Markdown no admite multilínea
  // real dentro de una celda.
  const parrafos = celda.content ?? [];
  return parrafos
    .map((parrafo) => serializarInline(parrafo.content))
    .join(" ")
    .replace(/\|/g, "\\|")
    .trim();
}

function serializarTabla(tabla: NodoJSON): string {
  const filas = tabla.content ?? [];
  if (filas.length === 0) return "";
  const filaACeldas = (fila: NodoJSON) =>
    (fila.content ?? []).map((celda) => serializarCeldaTabla(celda) || " ");
  const [encabezado, ...cuerpo] = filas;
  const celdasEncabezado = filaACeldas(encabezado);
  const lineas = [
    `| ${celdasEncabezado.join(" | ")} |`,
    `| ${celdasEncabezado.map(() => "---").join(" | ")} |`,
    ...cuerpo.map((fila) => `| ${filaACeldas(fila).join(" | ")} |`),
  ];
  return lineas.join("\n");
}

function serializarItem(item: NodoJSON, nivel: number, marcador: string): string {
  const indentacion = "  ".repeat(nivel);
  const [primero, ...resto] = item.content ?? [];
  const lineaPrincipal = `${indentacion}${marcador} ${primero ? serializarBloque(primero, nivel) : ""}`;
  const lineasHijas = resto
    .map((hijo) => serializarBloque(hijo, nivel + 1))
    .filter(Boolean)
    .join("\n");
  return [lineaPrincipal, lineasHijas].filter(Boolean).join("\n");
}

function serializarBloque(nodo: NodoJSON, nivelLista: number): string {
  switch (nodo.type) {
    case "paragraph":
      return serializarInline(nodo.content);
    case "heading": {
      const nivel = Math.min(6, Math.max(1, Number(nodo.attrs?.level) || 1));
      return `${"#".repeat(nivel)} ${serializarInline(nodo.content)}`;
    }
    case "blockquote":
      return (nodo.content ?? [])
        .map((hijo) => serializarBloque(hijo, nivelLista))
        .join("\n\n")
        .split("\n")
        .map((linea) => `> ${linea}`)
        .join("\n");
    case "codeBlock": {
      const lenguaje = (nodo.attrs?.language as string) ?? "";
      return `\`\`\`${lenguaje}\n${extraerTextoPlano(nodo.content)}\n\`\`\``;
    }
    case "horizontalRule":
      return "---";
    case "bulletList":
      return (nodo.content ?? []).map((item) => serializarItem(item, nivelLista, "-")).join("\n");
    case "orderedList": {
      let contador = Number(nodo.attrs?.start) || 1;
      return (nodo.content ?? [])
        .map((item) => serializarItem(item, nivelLista, `${contador++}.`))
        .join("\n");
    }
    case "taskList":
      return (nodo.content ?? [])
        .map((item) => serializarItem(item, nivelLista, `- [${item.attrs?.checked ? "x" : " "}]`))
        .join("\n");
    case "table":
      return serializarTabla(nodo);
    case "image":
      return `![${(nodo.attrs?.alt as string) ?? ""}](${(nodo.attrs?.src as string) ?? ""})`;
    default:
      // Cualquier nodo futuro sin caso explícito cae acá: mejor un texto
      // plano de mejor esfuerzo que perder el contenido por completo.
      return serializarInline(nodo.content) || extraerTextoPlano(nodo.content);
  }
}

export function convertirDocumentoAMarkdown(documento: NodoJSON): string {
  const bloques = documento.content ?? [];
  return `${bloques.map((nodo) => serializarBloque(nodo, 0)).filter(Boolean).join("\n\n")}\n`;
}
