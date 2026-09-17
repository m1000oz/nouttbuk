"use client";

import {
  FolderSimpleIcon,
  TimerIcon,
  GlobeHemisphereWestIcon,
  DeviceMobileIcon,
  CursorIcon,
  UserCheckIcon,
  FileTextIcon,
  ShareFatIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useLandingAuth } from "@/components/landing/landing-auth-context";

export function LandingAudiences() {
  const { abrirAuth } = useLandingAuth();

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-12">
        {/* Section Header (No eyebrow/kicker) */}
        <div className="max-w-3xl mb-14 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Para tus horas de estudio individual y para tus proyectos grupales.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Ya sea que estés repasando de noche para un examen o redactando un trabajo en clase con tus compañeros, Nouttbuk se adapta a cada momento.
          </p>
        </div>

        {/* The Two Pillars Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Pillar 1: Estudiantes */}
          <div
            id="estudiantes"
            className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-8 sm:p-10 shadow-xs"
          >
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                Para estudiar solo
              </h3>
              <p className="mt-2.5 text-sm sm:text-base text-muted-foreground leading-relaxed">
                Guarda tus notas de clase, formula resúmenes y estudia con tranquilidad durante todo el ciclo.
              </p>

              <div className="mt-8 space-y-6">
                <div className="flex items-start gap-4">
                  <FolderSimpleIcon className="size-5 shrink-0 text-folder-coral mt-0.5" weight="fill" />
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-foreground">Carpetas por materia con colores</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Organiza tus cursos para distinguir cada materia a simple vista.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <TimerIcon className="size-5 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" weight="fill" />
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-foreground">Temporizador con sonido ambiental</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Sonidos de lluvia suave, cafetería o música relajante para estudiar sin distracciones.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <GlobeHemisphereWestIcon className="size-5 shrink-0 text-teal-600 dark:text-teal-400 mt-0.5" weight="fill" />
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-foreground">Apuntes de compañeros de tu carrera</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Consulta resúmenes compartidos por otros estudiantes para complementar tus lecturas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <DeviceMobileIcon className="size-5 shrink-0 text-foreground mt-0.5" weight="bold" />
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-foreground">Disponible en computadora y celular</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Ábrelo en cualquier navegador y agrégalo a tu pantalla de inicio como una app.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-border/70">
              <Button
                size="lg"
                type="button"
                onClick={() => abrirAuth("signup")}
                className="w-full justify-center font-medium bg-primary hover:bg-primary/90 text-primary-foreground max-w-full text-center whitespace-normal sm:whitespace-nowrap"
              >
                Comenzar gratis
              </Button>
            </div>
          </div>

          {/* Pillar 2: Equipos */}
          <div
            id="equipos"
            className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-8 sm:p-10 shadow-xs"
          >
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                Para tu grupo de estudio
              </h3>
              <p className="mt-2.5 text-sm sm:text-base text-muted-foreground leading-relaxed">
                Invita a tus compañeros de equipo con su nombre de usuario y redacten informes juntos en tiempo real.
              </p>

              <div className="mt-8 space-y-6">
                <div className="flex items-start gap-4">
                  <CursorIcon className="size-5 shrink-0 text-teal-600 dark:text-teal-400 mt-0.5" weight="fill" />
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-foreground">Edición en vivo al mismo tiempo</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Cada integrante escribe en su sección sin sobrescribir los cambios de los demás.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <UserCheckIcon className="size-5 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" weight="fill" />
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-foreground">Permisos de lectura o edición</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Tú decides quién puede modificar el contenido y quién solo puede revisarlo.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <FileTextIcon className="size-5 shrink-0 text-amber-500 mt-0.5" weight="fill" />
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-foreground">Una sola versión siempre al día</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Todo el grupo accede siempre a la versión más reciente sin duplicar archivos.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <ShareFatIcon className="size-5 shrink-0 text-teal-600 dark:text-teal-400 mt-0.5" weight="fill" />
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-foreground">Opción de compartir con la facultad</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Al terminar el trabajo, pueden elegir si lo publican en la comunidad o lo mantienen en privado.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-border/70">
              <Button
                size="lg"
                type="button"
                variant="outline"
                onClick={() => abrirAuth("signup")}
                className="w-full justify-center font-medium max-w-full text-center whitespace-normal sm:whitespace-nowrap"
              >
                Crear grupo de estudio
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
