import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // No anunciar el framework en cada respuesta (X-Powered-By: Next.js),
  // información gratuita para cualquier escaneo automatizado.
  poweredByHeader: false,
  // Cabeceras de seguridad de bajo riesgo (no incluye CSP: una CSP mal
  // calibrada rompería Turnstile, el redirect de Google OAuth o el
  // WebSocket de Liveblocks, así que queda fuera de este pase a propósito).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
