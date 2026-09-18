"use client";

import { useState } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    pregunta: "¿Nouttbuk es realmente gratis?",
    respuesta:
      "Sí, Nouttbuk es completamente gratuito para todos los estudiantes y miembros de la comunidad universitaria. No hay límites en la cantidad de apuntes, carpetas de cursos o sesiones de estudio que puedes crear.",
  },
  {
    pregunta: "¿Por qué el registro requiere un correo institucional de la universidad?",
    respuesta:
      "Para asegurar un espacio académico de confianza, libre de publicidad, cuentas falsas y mensajes no deseados. De este modo, los apuntes y comentarios de la comunidad provienen de compañeros reales de tu universidad.",
  },
  {
    pregunta: "¿Quién puede ver mis apuntes personales?",
    respuesta:
      "Solo tú. Todo apunte que creas es privado de forma predeterminada. Nadie más tiene acceso a tus notas a menos que decidas expresamente invitar a compañeros a un grupo o compartir el apunte de forma voluntaria en la comunidad.",
  },
  {
    pregunta: "¿Cómo funciona la edición en vivo con mi grupo?",
    respuesta:
      "Cuando invitas a compañeros a un apunte con permiso de edición, todos pueden redactar en el mismo documento al mismo tiempo. Cada cambio se guarda de inmediato en la nube y puedes ver en pantalla qué parte está editando cada integrante.",
  },
  {
    pregunta: "¿Puedo usar Nouttbuk en mi teléfono o tablet?",
    respuesta:
      "Sí. Nouttbuk funciona de manera fluida en cualquier navegador de computadora, teléfono o tablet. También puedes agregarla a la pantalla de inicio de tu dispositivo móvil para acceder a tus apuntes con un solo toque, igual que una app instalada.",
  },
  {
    pregunta: "¿Puedo leer apuntes de la comunidad sin haber creado una cuenta?",
    respuesta:
      "Sí. Los apuntes que los estudiantes deciden compartir con la comunidad son de lectura abierta. Solo necesitas crear una cuenta si deseas redactar tus propios apuntes, guardar favoritos, comentar o reaccionar a publicaciones.",
  },
];

export function LandingFAQ() {
  const [abierto, setAbierto] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 sm:py-24 border-t border-border/70 bg-muted/20">
      <div className="mx-auto max-w-3xl px-6 sm:px-8">
        {/* Header (No eyebrow/kicker) */}
        <div className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Preguntas frecuentes
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Información sobre privacidad, acceso y uso de la plataforma.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const estaAbierto = abierto === index;

            return (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-border/80 bg-card transition-all"
              >
                <button
                  type="button"
                  onClick={() => setAbierto(estaAbierto ? null : index)}
                  className="flex w-full items-center justify-between p-5 text-left font-bold text-foreground hover:bg-muted/40 transition-colors"
                >
                  <span className="text-base">{faq.pregunta}</span>
                  <CaretDownIcon
                    className={cn(
                      "size-5 text-muted-foreground transition-transform duration-200 shrink-0 ml-4",
                      estaAbierto && "rotate-180 text-foreground"
                    )}
                  />
                </button>

                {estaAbierto && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/60 pt-3">
                    {faq.respuesta}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
