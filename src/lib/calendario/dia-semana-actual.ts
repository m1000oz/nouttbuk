// Mismo cuidado de timezone que saludoPorHora (src/lib/fecha/saludo.ts): se
// ancla el día a America/Lima en vez de usar `fecha.getDay()`, que leería el
// calendario del proceso donde corre Next.js, no el del estudiante. Convierte
// directo el nombre corto del día (evita reconstruir un Date a partir de la
// fecha de Lima) a la convención de esta app, 0 = lunes ... 6 = domingo (no
// ISO, no Date.getDay() de JS, ver el comentario de DIAS_SEMANA en
// src/lib/calendario/consultas.ts).
const INDICE_POR_DIA_CORTO: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

export function obtenerDiaSemanaActual(fecha: Date = new Date()): number {
  const diaCorto = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    weekday: "short",
  }).format(fecha);

  return INDICE_POR_DIA_CORTO[diaCorto] ?? 0;
}
