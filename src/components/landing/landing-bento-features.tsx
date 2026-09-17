import {
  SlidersHorizontalIcon,
  TextAaIcon,
  TimerIcon,
  GlobeHemisphereWestIcon,
  DeviceMobileIcon,
  LockKeyIcon,
  UsersIcon,
  FunctionIcon,
  CodeBlockIcon,
} from "@phosphor-icons/react/dist/ssr";

export function LandingBentoFeatures() {
  return (
    <section id="caracteristicas" className="py-20 sm:py-28 bg-muted/20 border-y border-border/70">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-12">
        {/* Section Header (No eyebrow/kicker) */}
        <div className="max-w-3xl mb-14 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Cada función resuelve una necesidad real en tus cursos.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Sin herramientas accesorias que nadie usa. Solo lo indispensable para escribir con claridad, concentrarte y coordinar con tus compañeros.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Card 1: 3-Level Visibility (Spans 2 columns) */}
          <div className="md:col-span-2 rounded-3xl border border-border/80 bg-card p-7 sm:p-9 flex flex-col justify-between shadow-xs">
            <div>
              <SlidersHorizontalIcon weight="fill" className="size-6 text-foreground mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                Tres niveles de visibilidad para cada apunte
              </h3>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                Tú decides quién puede ver cada nota sin tener que moverla de carpeta ni configurar permisos complicados:
              </p>
            </div>

            {/* Visual Pills Demo (Clean layout, no middle dots) */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 text-center">
                <div className="mx-auto flex size-8 items-center justify-center rounded-full bg-card text-muted-foreground mb-2 shadow-xs">
                  <LockKeyIcon className="size-4" />
                </div>
                <div className="text-xs font-bold text-foreground">Privado</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Solo tú puedes verlo</div>
              </div>

              <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-4 text-center">
                <div className="mx-auto flex size-8 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-2">
                  <UsersIcon className="size-4" />
                </div>
                <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Grupo</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Coedición en vivo</div>
              </div>

              <div className="rounded-2xl border border-teal-500/30 bg-teal-500/5 p-4 text-center">
                <div className="mx-auto flex size-8 items-center justify-center rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 mb-2">
                  <GlobeHemisphereWestIcon className="size-4" />
                </div>
                <div className="text-xs font-bold text-teal-700 dark:text-teal-300">Comunidad</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Abierto a tu facultad</div>
              </div>
            </div>
          </div>

          {/* Card 2: Editor (Spans 2 columns) */}
          <div className="md:col-span-1 lg:col-span-2 rounded-3xl border border-border/80 bg-card p-7 sm:p-9 flex flex-col justify-between shadow-xs">
            <div>
              <TextAaIcon weight="fill" className="size-6 text-foreground mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                Editor tipográfico para lectura prolongada
              </h3>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                Diseñado para no cansar la vista en sesiones largas de estudio, con herramientas académicas integradas:
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3.5 py-1.5 text-xs font-medium text-foreground">
                <FunctionIcon className="size-4 text-muted-foreground" />
                Fórmulas matemáticas claras
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3.5 py-1.5 text-xs font-medium text-foreground">
                <CodeBlockIcon className="size-4 text-muted-foreground" />
                Bloques de código con color
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3.5 py-1.5 text-xs font-medium text-foreground">
                Tablas y listas de verificación
              </span>
            </div>
          </div>

          {/* Card 3: Pomodoro & Sounds (Spans 2 columns) */}
          <div className="md:col-span-1 lg:col-span-2 rounded-3xl border border-border/80 bg-card p-7 sm:p-9 flex flex-col justify-between shadow-xs">
            <div>
              <TimerIcon weight="fill" className="size-6 text-foreground mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                Temporizador con sonidos ambientales
              </h3>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                Activa sesiones de estudio de 25 minutos con sonidos de fondo para aislar el ruido exterior: lluvia suave, cafetería o música tranquila, sin abrir pestañas adicionales.
              </p>
            </div>

            <div className="mt-8 rounded-2xl bg-muted/50 p-3.5 text-xs text-muted-foreground font-medium flex items-center justify-between border border-border/60">
              <span>Lluvia, café, lofi y sintetizadores</span>
              <span className="font-mono text-foreground font-bold">25 minutos</span>
            </div>
          </div>

          {/* Card 4: Open Community (Spans 1 col) */}
          <div className="md:col-span-1 rounded-3xl border border-border/80 bg-card p-7 sm:p-9 flex flex-col justify-between shadow-xs">
            <div>
              <GlobeHemisphereWestIcon weight="fill" className="size-6 text-foreground mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Lectura sin barreras
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Cualquier persona puede leer apuntes públicos libremente sin necesidad de iniciar sesión.
              </p>
            </div>
          </div>

          {/* Card 5: App for computer and mobile (Spans 1 col) */}
          <div className="md:col-span-1 rounded-3xl border border-border/80 bg-card p-7 sm:p-9 flex flex-col justify-between shadow-xs">
            <div>
              <DeviceMobileIcon weight="fill" className="size-6 text-foreground mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                App para laptop y celular
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Se abre al instante desde tu navegador y puedes agregarla a tu pantalla de inicio para usarla como una app instalada.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
