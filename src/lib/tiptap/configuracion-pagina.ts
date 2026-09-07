import {
  ALTURA_PAGINA_PX,
  ANCHO_PAGINA_PX,
  MARGEN_PAGINA_PX,
  SEPARACION_PAGINAS_PX,
  type OrientacionPagina,
} from "@/lib/tiptap/geometria-pagina";

export type GeometriaPagina = {
  // Siempre ya orientados: cambiar `orientacion` en el diálogo intercambia
  // alturaPagina/anchoPagina en el momento, en vez de que cada consumidor
  // tenga que recalcular el swap por su cuenta.
  alturaPagina: number;
  anchoPagina: number;
  margenPagina: number;
  separacionPaginas: number;
  orientacion: OrientacionPagina;
};

export type ConfiguracionEncabezadoPie = {
  encabezado: string;
  pie: string;
  mostrarNumeroPagina: boolean;
  primeraPaginaDistinta: boolean;
};

export const GEOMETRIA_POR_DEFECTO: GeometriaPagina = {
  alturaPagina: ALTURA_PAGINA_PX,
  anchoPagina: ANCHO_PAGINA_PX,
  margenPagina: MARGEN_PAGINA_PX,
  separacionPaginas: SEPARACION_PAGINAS_PX,
  orientacion: "vertical",
};

export const ENCABEZADO_PIE_POR_DEFECTO: ConfiguracionEncabezadoPie = {
  encabezado: "",
  pie: "",
  mostrarNumeroPagina: true,
  primeraPaginaDistinta: false,
};

// Puente fuera de React entre el estado que vive en ApunteEditor (la fuente
// de verdad, hidratada de localStorage) y la extensión Paginacion: Tiptap
// construye sus extensiones una sola vez (a nivel de módulo, ver
// extensiones-documento.ts/editor-estatico.tsx) por la restricción de
// StarterKit/Gapcursor descrita ahí mismo, así que Paginacion no puede
// recibir la geometría como prop de React en cada render. En su lugar, lee
// esta función getter (estable, pasada una sola vez a `.configure()`) en
// cada recálculo, que ya se re-ejecuta solo vía ResizeObserver cuando el
// contenido o el layout cambian.
let geometriaActual: GeometriaPagina = GEOMETRIA_POR_DEFECTO;
let encabezadoPieActual: ConfiguracionEncabezadoPie = ENCABEZADO_PIE_POR_DEFECTO;

// Un cambio de alto de página (o de orientación) sin que cambie el ancho no
// siempre provoca un reflujo de texto, así que el ResizeObserver de
// Paginacion podría no reaccionar solo. Este evento le pide un recálculo
// explícito justo después de actualizar la geometría.
export const EVENTO_GEOMETRIA_CAMBIO = "nouttbuk:geometria-pagina-cambio";

export function actualizarGeometria(geometria: GeometriaPagina) {
  geometriaActual = geometria;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENTO_GEOMETRIA_CAMBIO));
  }
}

export function obtenerGeometria(): GeometriaPagina {
  return geometriaActual;
}

export function obtenerGeometriaConfiguracionPagina() {
  const g = geometriaActual;
  return {
    alturaPagina: g.alturaPagina,
    margenPagina: g.margenPagina,
    separacionPaginas: g.separacionPaginas,
  };
}

export function actualizarEncabezadoPie(config: ConfiguracionEncabezadoPie) {
  encabezadoPieActual = config;
}

export function obtenerEncabezadoPie(): ConfiguracionEncabezadoPie {
  return encabezadoPieActual;
}

// Puente en la dirección contraria: cuántas páginas hacen falta según la
// extensión Paginacion (que mide nodo por nodo, la única cuenta realmente
// precisa) hacia HojasEditor (que antes recalculaba esto por su cuenta
// dividiendo el alto total del contenedor entre el alto de una hoja). Las
// dos cuentas podían desacordar: el alto total del contenedor incluye el
// padding de arriba Y de abajo una sola vez (no por página), así que esa
// división cruda podía "ver" una página de más (o de menos) que la que
// Paginacion realmente necesitaba, dejando una hoja de fondo vacía o un
// tramo de texto sin hoja detrás. Ahora HojasEditor no calcula nada, solo
// refleja este valor.
export const EVENTO_PAGINAS_CAMBIO = "nouttbuk:paginas-calculadas-cambio";
let paginasCalculadas = 1;

export function actualizarPaginasCalculadas(paginas: number) {
  if (paginas === paginasCalculadas) return;
  paginasCalculadas = paginas;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENTO_PAGINAS_CAMBIO, { detail: paginas }));
  }
}

export function obtenerPaginasCalculadas(): number {
  return paginasCalculadas;
}
