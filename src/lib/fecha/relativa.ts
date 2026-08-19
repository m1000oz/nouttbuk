const FORMATO_RELATIVO = new Intl.RelativeTimeFormat("es", {
  numeric: "auto",
});

export function fechaRelativa(fechaISO: string): string {
  const diffMs = new Date(fechaISO).getTime() - Date.now();
  const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDias === 0) return "Hoy";
  if (Math.abs(diffDias) < 7) return FORMATO_RELATIVO.format(diffDias, "day");
  const diffSemanas = Math.round(diffDias / 7);
  return FORMATO_RELATIVO.format(diffSemanas, "week");
}
