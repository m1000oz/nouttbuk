import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr";

export function LandingPainPoints() {
  const situaciones = [
    {
      titulo: "El desorden antes de un parcial",
      problema:
        "Apuntes en el chat, resúmenes en Word, fotos de la pizarra. Llega el parcial y pierdes media hora buscando antes de repasar.",
      cura: "Una carpeta por curso, con color. Todo en su lugar, siempre.",
    },
    {
      titulo: "El caos de los informes en grupo",
      problema:
        "Alguien edita la versión vieja, otro pierde el archivo. Terminan con tres “informe_final” distintos.",
      cura: "Un solo documento. Todos escriben a la vez, viendo quién hace qué.",
    },
    {
      titulo: "El conocimiento que nadie más ve",
      problema:
        "Cientos de compañeros cursan lo mismo que tú, cada ciclo. Sus mejores resúmenes se quedan guardados en su laptop.",
      cura: "Publica el tuyo, encuentra los de otros. Una comunidad, no una carpeta perdida.",
    },
  ];

  return (
    <section id="problema" className="py-20 sm:py-28 border-y border-border/70 bg-muted/20">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-12">
        {/* Section Header (Widescreen editorial layout) */}
        <div className="max-w-3xl">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            El problema no es tomar notas. Es lo que pasa cuando intentas estudiar o trabajar con otros.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
            WhatsApp, Word y una carpeta de Drive no fueron pensados para esto.
          </p>
        </div>

        {/* Editorial Divided Columns across widescreen */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-y border-border/70 divide-border/70">
          {situaciones.map((item, index) => (
            <div
              key={index}
              className={`py-10 md:py-8 flex flex-col justify-between ${
                index === 0 ? "md:pr-10" : index === 1 ? "md:px-10" : "md:pl-10"
              }`}
            >
              <div>
                <h3 className="text-xl font-bold text-foreground leading-snug">
                  {item.titulo}
                </h3>
                <p className="mt-3.5 text-sm text-muted-foreground leading-relaxed">
                  {item.problema}
                </p>
              </div>

              <div className="mt-6 flex items-start gap-2.5">
                <CheckCircleIcon
                  weight="fill"
                  className="size-5 shrink-0 text-teal-600 dark:text-teal-400 mt-0.5"
                  aria-hidden
                />
                <p className="text-sm font-semibold text-foreground leading-relaxed">
                  {item.cura}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
