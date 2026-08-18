import { MENSAJE_DOMINIO_INVALIDO } from "@/lib/auth/dominio-institucional";

export type ResultadoErrorAuth = {
  tipo: "dominio" | "credenciales" | "duplicado" | "red";
  mensaje: string;
};

export function mapearErrorAuth(error: unknown): ResultadoErrorAuth {
  const mensaje = error instanceof Error ? error.message : String(error);
  const mensajeNormalizado = mensaje.toLowerCase();

  if (mensajeNormalizado.includes("correo institucional")) {
    return { tipo: "dominio", mensaje: MENSAJE_DOMINIO_INVALIDO };
  }

  if (
    mensajeNormalizado.includes("invalid login credentials") ||
    mensajeNormalizado.includes("invalid_credentials")
  ) {
    return {
      tipo: "credenciales",
      mensaje: "Correo o contraseña incorrectos.",
    };
  }

  if (
    mensajeNormalizado.includes("already registered") ||
    mensajeNormalizado.includes("already exists") ||
    mensajeNormalizado.includes("already been registered")
  ) {
    return {
      tipo: "duplicado",
      mensaje: "Ya existe una cuenta con este correo.",
    };
  }

  return {
    tipo: "red",
    mensaje: "Ocurrió un problema. Inténtalo de nuevo en unos segundos.",
  };
}
