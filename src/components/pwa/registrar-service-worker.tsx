"use client";

import { useEffect } from "react";

// Componente sin salida visual, solo registra el service worker (public/sw.js)
// una vez montado el layout raíz. serviceWorker no existe en navegadores
// viejos ni en contextos no seguros (http sin ser localhost), por eso el
// chequeo antes de llamar a .register().
export function RegistrarServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Instalar la PWA sigue funcionando sin service worker en iOS Safari
      // (no lo requiere); en el resto, un fallo acá no debe romper la app.
    });
  }, []);

  return null;
}
