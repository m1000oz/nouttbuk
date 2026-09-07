// Única fuente de verdad para las medidas de la "hoja" del editor: la
// extensión de paginación (dónde salta el contenido) y HojasEditor (cuántos
// fondos de hoja dibuja, y con qué margen visual) leen de acá, así ninguna
// puede desalinearse de la otra. Los cuatro export originales se mantienen
// como el preset A4 vertical por defecto: detalle-publicacion.tsx (la vista
// pública de Comunidad) no tiene UI de configuración de página y sigue
// importándolos tal cual, sin saber que existen los presets de abajo.
export const ALTURA_PAGINA_PX = 1123;
export const ANCHO_PAGINA_PX = 794;
export const MARGEN_PAGINA_PX = 96;
export const SEPARACION_PAGINAS_PX = 32;

export type TamanoPagina = "a4" | "carta";
export type MargenPreset = "normal" | "estrecho" | "ancho";
export type OrientacionPagina = "vertical" | "horizontal";

// Medidas a 96dpi (el estándar de navegador): A4 = 210mm x 297mm, Carta =
// 8.5in x 11in. Los valores de A4 coinciden exactamente con las constantes
// de arriba, confirmando que esa era ya la asunción implícita.
export const PRESETS_TAMANO: Record<
  TamanoPagina,
  { alturaPagina: number; anchoPagina: number; etiqueta: string }
> = {
  a4: { alturaPagina: 1123, anchoPagina: 794, etiqueta: "A4" },
  carta: { alturaPagina: 1056, anchoPagina: 816, etiqueta: "Carta" },
};

// Un solo margen uniforme (no cuatro lados independientes como Docs): más
// simple de razonar y suficiente para el caso de uso real (ensayos
// académicos), no una hoja de estilo con reglas tipográficas complejas.
export const PRESETS_MARGEN: Record<MargenPreset, { valor: number; etiqueta: string }> = {
  estrecho: { valor: 48, etiqueta: "Estrecho" },
  normal: { valor: MARGEN_PAGINA_PX, etiqueta: "Normal" },
  ancho: { valor: 144, etiqueta: "Ancho" },
};
