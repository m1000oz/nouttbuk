// Paleta de colores de carpeta/curso, según DESIGN-SYSTEM.md (sin variante
// por tema). `carpetas.color` en la base de datos guarda estas claves cortas.
export const COLORES_CARPETA = {
  coral: "var(--color-folder-coral)",
  amber: "var(--color-folder-amber)",
  lime: "var(--color-folder-lime)",
  cyan: "var(--color-folder-cyan)",
  blue: "var(--color-folder-blue)",
  violet: "var(--color-folder-violet)",
  fuchsia: "var(--color-folder-fuchsia)",
  pink: "var(--color-folder-pink)",
} as const;

export type ColorCarpeta = keyof typeof COLORES_CARPETA;

export const COLOR_CARPETA_POR_DEFECTO: ColorCarpeta = "blue";

export function resolverColorCarpeta(color: string | null): string {
  if (!color) return COLORES_CARPETA[COLOR_CARPETA_POR_DEFECTO];
  return COLORES_CARPETA[color as ColorCarpeta] ?? color;
}
