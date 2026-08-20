import type { MetadataRoute } from "next";

// Genera /manifest.webmanifest; Next.js enlaza el <link rel="manifest">
// automáticamente, no hace falta declararlo a mano en layout.tsx.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nouttbuk",
    short_name: "Nouttbuk",
    description:
      "Apuntes universitarios en privado, en grupo o abiertos a la comunidad.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#4f46e5",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
