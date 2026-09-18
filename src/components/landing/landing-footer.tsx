"use client";

import Link from "next/link";
import { NouttbukIsotipo } from "@/components/brand";
import { PandatomicLogo } from "@/components/shared/pandatomic-logo";
import { RingSeam } from "@/components/landing/ring-seam";
import { useLandingAuth } from "@/components/landing/landing-auth-context";

export function LandingFooter() {
  const { abrirAuth } = useLandingAuth();

  const columnas = [
    {
      titulo: "Producto",
      enlaces: [
        { label: "Comunidad", href: "/comunidad" },
        { label: "Preguntas frecuentes", href: "#faq" },
      ],
    },
    {
      titulo: "Empieza",
      enlaces: [
        { label: "Crear cuenta", onClick: () => abrirAuth("signup") },
        { label: "Iniciar sesión", onClick: () => abrirAuth("login") },
      ],
    },
    {
      titulo: "Legal",
      enlaces: [
        { label: "Términos de uso", href: "/terminos" },
        { label: "Privacidad", href: "/privacidad" },
        { label: "Créditos", href: "/creditos" },
      ],
    },
  ];

  return (
    <footer className="relative bg-slate-900 text-slate-100">
      <RingSeam className="top-0 -translate-y-1/2" dotClassName="border-slate-500 bg-slate-900" />

      <div className="mx-auto w-full max-w-7xl px-6 pt-16 pb-10 sm:px-10 sm:pt-20 lg:px-12">
        <p className="max-w-2xl font-serif text-3xl italic leading-[1.2] text-slate-100 sm:text-5xl" style={{ fontFamily: "var(--font-manuscrito), Georgia, serif" }}>
          Tus apuntes, tu comunidad.
        </p>

        <div className="mt-14 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3">
          {columnas.map((columna) => (
            <div key={columna.titulo}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-400">
                {columna.titulo}
              </h3>
              <ul className="mt-4 space-y-3">
                {columna.enlaces.map((enlace) => (
                  <li key={enlace.label}>
                    {"href" in enlace ? (
                      <Link
                        href={enlace.href}
                        className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
                      >
                        {enlace.label}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={enlace.onClick}
                        className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
                      >
                        {enlace.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Colofón: la marca baja de tamaño y se vuelve un sello, no repite
            el lockup grande del navbar. */}
        <div className="mt-16 flex flex-col gap-4 border-t border-slate-800 pt-8 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <NouttbukIsotipo size="xs" />
            <span>© {new Date().getFullYear()} Nouttbuk, un producto de Pandatomic.</span>
          </div>
          <span className="inline-flex items-center gap-1.5">
            Hecho por <PandatomicLogo textClassName="text-slate-300" />
          </span>
        </div>
      </div>
    </footer>
  );
}
