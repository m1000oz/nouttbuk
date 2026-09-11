import { MENSAJE_DOMINIO_INVALIDO } from "@/lib/auth/dominio-institucional";

export type ResultadoErrorAuth = {
  tipo: "dominio" | "credenciales" | "duplicado" | "codigo" | "red";
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

  // Mensaje real devuelto por GoTrue para verifyOtp/resend con un código de
  // 6 dígitos incorrecto, ya usado, o vencido (confirmado contra el stack
  // local: mismo `error_code: otp_expired` que el enlace de recuperación,
  // pero acá se muestra dentro del paso de "verificar código" del signup,
  // no como un enlace roto).
  if (mensajeNormalizado.includes("token has expired or is invalid")) {
    return {
      tipo: "codigo",
      mensaje: "El código no es válido o ya venció. Solicita uno nuevo.",
    };
  }

  return {
    tipo: "red",
    mensaje: "Ocurrió un problema. Inténtalo de nuevo en unos segundos.",
  };
}
