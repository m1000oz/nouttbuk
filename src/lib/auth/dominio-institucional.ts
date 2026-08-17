const DOMINIO_INSTITUCIONAL = "@pucp.edu.pe";

export function esCorreoInstitucionalValido(correo: string): boolean {
  return correo.trim().toLowerCase().endsWith(DOMINIO_INSTITUCIONAL);
}

export const MENSAJE_DOMINIO_INVALIDO =
  "El registro solo está permitido con un correo institucional @pucp.edu.pe.";
