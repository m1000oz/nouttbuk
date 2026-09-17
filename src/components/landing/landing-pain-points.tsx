export function LandingPainPoints() {
  const situaciones = [
    {
      titulo: "El desorden antes del examen parcial",
      problema:
        "Notas en el teléfono, resúmenes en Word, fotos de pizarra en WhatsApp y diapositivas dispersas. Cuando llega la semana de parciales, pasas más tiempo buscando los temas que repasando.",
      solucion:
        "En Nouttbuk cada materia tiene su carpeta con color e icono propio. Tus apuntes quedan ordenados por curso para que encuentres cualquier concepto en tres segundos.",
    },
    {
      titulo: "El caos en los informes grupales",
      problema:
        "Pasarse archivos por correo produce versiones duplicadas y desactualizadas. En herramientas de oficina genéricas, los permisos son engorrosos o alguien borra párrafos por descuido.",
      solucion:
        "Agregas a tus compañeros con su usuario de la universidad. Todos redactan en la misma hoja al mismo tiempo viendo quién escribe cada parte, con permisos claros.",
    },
    {
      titulo: "El conocimiento que se queda olvidado",
      problema:
        "Cada ciclo cientos de estudiantes cursan las mismas materias. Muchos tienen resúmenes excelentes que se quedan archivados en su computadora sin que nadie más los pueda aprovechar.",
      solucion:
        "Una comunidad universitaria abierta donde puedes publicar tus mejores apuntes para apoyar a tus compañeros y consultar guías preparadas por estudiantes de ciclos superiores.",
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
            Las herramientas genéricas fueron hechas para oficinas y corporaciones, no para semanas de exámenes ni para redactar informes con compañeros de ciclo.
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

              <div className="mt-8 pt-5 border-t border-border/60">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  La solución en Nouttbuk:
                </span>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {item.solucion}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
