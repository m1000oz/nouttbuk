// MVP de una sola universidad/país (PUCP, Perú, ver el Product summary de
// CLAUDE.md): se ancla la hora a America/Lima explícitamente en vez de usar
// `fecha.getHours()`, que leería el reloj/timezone del proceso donde corre
// Next.js (Vercel puede desplegar en cualquier región), no el del estudiante.
export function saludoPorHora(fecha: Date = new Date()): string {
  const hora = Number(
    new Intl.DateTimeFormat("es-PE", {
      timeZone: "America/Lima",
      hour: "numeric",
      hourCycle: "h23",
    }).format(fecha),
  );

  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}
