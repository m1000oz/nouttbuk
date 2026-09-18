import type { Metadata } from "next";
import { PandatomicLogo } from "@/components/shared/pandatomic-logo";

export const metadata: Metadata = {
  title: "Créditos, Nouttbuk",
  description: "Quién está detrás de Nouttbuk.",
};

// Página estática, pública, accesible sin sesión (mismo criterio que
// Comunidad y las páginas legales: es contenido de consulta, no una pantalla
// gated). Mismo patrón estructural que /terminos y /privacidad (max-w-2xl,
// secciones planas), con contenido real sobre quién hizo la app en vez del
// placeholder genérico anterior.
export default function CreditosPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Créditos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quién está detrás de Nouttbuk.
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">Creado por</h2>
        <p className="text-sm text-foreground">
          <strong className="font-semibold">Jharol Obregón</strong>. Nouttbuk
          nació de un problema real y cotidiano: apuntes dispersos entre
          grupos de WhatsApp, versiones duplicadas de un mismo resumen y
          ningún lugar limpio donde una clase entera pudiera estudiar junta
          para un examen.
        </p>
        <p className="text-sm text-muted-foreground">
          Diseño, producto y desarrollo de principio a fin, desde la idea
          hasta la infraestructura que hoy sirve a miles de estudiantes.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">Estudio</h2>
        <p className="text-sm text-foreground">
          Nouttbuk es un producto de <PandatomicLogo />, sin fines
          comerciales. Es, y seguirá siendo, gratuito para toda la comunidad
          universitaria.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          Construido con
        </h2>
        <p className="text-sm text-muted-foreground">
          Next.js, Supabase, Tailwind CSS, Tiptap, Liveblocks y Phosphor
          Icons. El detalle técnico completo está documentado en el
          repositorio del proyecto.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">Contacto</h2>
        <p className="text-sm text-muted-foreground">
          ¿Ideas, errores o algo que no cuadra? Escribe a{" "}
          <a
            href="mailto:contacto@pandatomic.com"
            className="text-primary underline"
          >
            contacto@pandatomic.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
