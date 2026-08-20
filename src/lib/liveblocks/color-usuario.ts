import { COLORES_CARPETA, type ColorCarpeta } from "@/lib/carpetas/colores";

const CLAVES_COLOR = Object.keys(COLORES_CARPETA) as ColorCarpeta[];

// Color determinístico por usuario (mismo usuario, mismo color siempre) para
// el cursor de coedición en vivo, reutilizando la paleta de carpetas en vez
// de inventar una nueva.
export function colorParaUsuario(usuarioId: string): string {
  let hash = 0;
  for (let i = 0; i < usuarioId.length; i += 1) {
    hash = (hash << 5) - hash + usuarioId.charCodeAt(i);
    hash |= 0;
  }
  const clave = CLAVES_COLOR[Math.abs(hash) % CLAVES_COLOR.length];
  return COLORES_CARPETA[clave];
}
