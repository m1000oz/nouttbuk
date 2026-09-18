import Link from "next/link";
import {
  HeartIcon,
  BookmarkSimpleIcon,
  ChatCircleTextIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

const APUNTES_DESTACADOS = [
  {
    titulo: "Ecuaciones de Maxwell y Ondas Electromagnéticas",
    carrera: "Telecomunicaciones",
    curso: "Campos Electromagnéticos",
    colorCurso: "border-folder-blue/40 bg-folder-blue/10 text-folder-blue",
    autor: "Mateo S.",
    avatar: "MS",
    reacciones: 34,
    guardados: 19,
    comentarios: 6,
    resumen: "Forma diferencial e integral de las ecuaciones de Maxwell, deducción de la ecuación de onda en el vacío y vector de Poynting con ejercicios resueltos.",
    tiempo: "Hace 2 días",
  },
  {
    titulo: "Control Difuso vs. Control Concentrado en el Perú",
    carrera: "Derecho",
    curso: "Derecho Constitucional",
    colorCurso: "border-folder-violet/40 bg-folder-violet/10 text-folder-violet",
    autor: "Camila V.",
    avatar: "CV",
    reacciones: 48,
    guardados: 27,
    comentarios: 12,
    resumen: "Análisis comparativo de precedentes vinculantes del Tribunal Constitucional, facultades de jueces ordinarios y jurisprudencia clave para finales.",
    tiempo: "Hace 4 días",
  },
  {
    titulo: "Equilibrio en el Mercado de Bienes y Dinero: Modelo IS-LM",
    carrera: "Economía y Gestión",
    curso: "Macroeconomía",
    colorCurso: "border-folder-amber/40 bg-folder-amber/10 text-folder-amber",
    autor: "Rodrigo A.",
    avatar: "RA",
    reacciones: 29,
    guardados: 15,
    comentarios: 4,
    resumen: "Efectos de la política fiscal y monetaria expansiva con tipo de cambio fijo y flexible bajo la trampa de la liquidez.",
    tiempo: "Hace 1 semana",
  },
];

export function LandingCommunityPreview() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-12">
        {/* Header (No eyebrow/kicker) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Apuntes reales compartidos por estudiantes de tu universidad
            </h2>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              Sin cobros ni suscripciones. Puedes leer todo el material público libremente o iniciar sesión para guardar tus notas preferidas.
            </p>
          </div>

          <div className="w-full sm:w-auto shrink-0">
            <Button
              nativeButton={false}
              render={<Link href="/comunidad" />}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto max-w-full font-medium px-6 text-center whitespace-normal sm:whitespace-nowrap"
            >
              Ver apuntes públicos
            </Button>
          </div>
        </div>

        {/* 3 Featured Community Notes Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {APUNTES_DESTACADOS.map((item, index) => (
            <Link
              key={index}
              href="/comunidad"
              className="group flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-7 sm:p-8 shadow-xs hover:border-border transition-colors cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className={`rounded-xl border px-3 py-1 text-xs font-semibold ${item.colorCurso}`}>
                    {item.curso}
                  </span>
                  <span className="text-xs text-muted-foreground">{item.tiempo}</span>
                </div>

                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                  {item.titulo}
                </h3>

                <p className="mt-3 text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                  {item.resumen}
                </p>
              </div>

              <div className="mt-8 pt-5 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-full bg-muted text-foreground text-xs font-bold">
                    {item.avatar}
                  </span>
                  <span className="font-semibold text-foreground">{item.autor}</span>
                </div>

                <div className="flex items-center gap-3.5">
                  <span className="flex items-center gap-1">
                    <HeartIcon weight="fill" className="size-4 text-rose-500" />
                    {item.reacciones}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookmarkSimpleIcon weight="fill" className="size-4 text-indigo-500" />
                    {item.guardados}
                  </span>
                  <span className="flex items-center gap-1">
                    <ChatCircleTextIcon className="size-4 text-teal-500" />
                    {item.comentarios}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
