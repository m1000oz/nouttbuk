"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "auto" | "light" | "dark";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

export type TurnstileWidgetHandle = {
  // Un token de Turnstile es de un solo uso: tras un intento fallido de
  // login/signup/recuperar, el formulario dueño de este widget llama a esto
  // para pedir un token nuevo, en vez de reenviar uno ya consumido.
  reset: () => void;
};

type TurnstileWidgetProps = {
  onTokenChange: (token: string | null) => void;
};

// Cargado solo dentro del formulario que realmente lo necesita (login,
// signup, recuperar contraseña), no en el layout raíz: no tiene sentido
// que el feed público de Comunidad (anon, sin ningún flujo de auth activo)
// cargue el script de Cloudflare en cada visita.
export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ onTokenChange }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    function renderWidget() {
      if (!containerRef.current || !window.turnstile || !siteKey) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onTokenChange,
        "expired-callback": () => onTokenChange(null),
        "error-callback": () => onTokenChange(null),
        theme: "auto",
      });
    }

    useImperativeHandle(ref, () => ({
      reset() {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
        onTokenChange(null);
      },
    }));

    useEffect(() => {
      // El script puede llegar a estar listo antes de que este efecto corra
      // (navegación entre login/signup dentro del mismo modal, script ya en
      // caché), por eso se intenta renderizar también acá, no solo en
      // onLoad del <Script>.
      if (window.turnstile) renderWidget();

      return () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps -- renderWidget cierra sobre refs estables y onTokenChange; solo debe correr al montar/desmontar el widget.
    }, []);

    if (!siteKey) {
      return null;
    }

    return (
      <>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="lazyOnload"
          onLoad={renderWidget}
        />
        <div ref={containerRef} />
      </>
    );
  },
);
