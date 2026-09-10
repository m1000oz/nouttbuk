"use client";

import { useEffect } from "react";

import "./globals.css";

// A diferencia de error.tsx (que captura errores dentro del layout normal),
// este archivo reemplaza TODO el layout raíz, incluido <html>/<body>, así
// que solo se activa para errores catastróficos que rompen el propio
// RootLayout. Por eso necesita su propio <html>/<body> y su propio import
// de globals.css, no hereda nada de layout.tsx.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center font-sans text-foreground">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Algo salió mal</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Ocurrió un problema inesperado y no pudimos cargar la página.
            Intenta recargar.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
