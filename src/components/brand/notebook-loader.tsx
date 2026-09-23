"use client";

import * as React from "react";
import { createTimeline, stagger, set, type Timeline } from "animejs";
import { cn } from "@/lib/utils";

export type NotebookLoaderSize = "sm" | "md" | "lg" | "xl" | number;
export type NotebookLoaderMode = "cycle" | "infinite";
export type NotebookLoaderTheme = "dark" | "light" | "atelier" | "auto";

export type NotebookLoaderProps = {
  /**
   * Si es true, se renderiza centrado ocupando toda la pantalla (fixed inset-0 z-50).
   * Si es false, se renderiza con position relative adaptado al contenedor padre.
   * @default false
   */
  fullScreen?: boolean;
  /**
   * Escala de tamaño visual de la libreta 3D.
   * "sm" (0.9x), "md" (1.15x), "lg" (1.5x - protagónica oficial), "xl" (1.85x) o número explícito.
   * @default "lg"
   */
  size?: NotebookLoaderSize;
  /**
   * Modo de animación de Anime.js:
   * - "cycle": Ciclo completo con apertura de portada, cascada de hojas, reposo, retorno y cierre.
   * - "infinite": Hojeo continuo infinito en perspectiva isométrica.
   * @default "cycle"
   */
  mode?: NotebookLoaderMode;
  /**
   * Tema visual forzado o automático: "dark" | "light" | "atelier" | "auto".
   * Si es "auto", hereda automáticamente el modo oscuro de la app (.dark) o tema del contexto.
   * @default "auto"
   */
  theme?: NotebookLoaderTheme;
  /**
   * Mensaje de texto fijo para mostrar en lugar de la rotación automática.
   */
  message?: string;
  /**
   * Lista personalizada de mensajes para rotar automáticamente.
   */
  messages?: string[];
  /**
   * Si debe mostrar la barra de progreso suiza animada.
   * @default true
   */
  showProgress?: boolean;
  /**
   * Si debe mostrar el subtítulo de marca inferior ("TUS APUNTES, TU COMUNIDAD").
   * @default true
   */
  showBrand?: boolean;
  /**
   * Texto de marca personalizado para el subtítulo inferior.
   */
  brandText?: string;
  /**
   * Clases CSS opcionales para el contenedor raíz.
   */
  className?: string;
};

const DEFAULT_MESSAGES = [
  "Organizando tus apuntes...",
  "Pasando a la siguiente página...",
  "Sincronizando con tu ciclo...",
  "Preparando tu espacio de estudio...",
  "Conectando con la comunidad...",
  "Afilando ideas...",
];

const SCALE_MAP: Record<"sm" | "md" | "lg" | "xl", number> = {
  sm: 0.9,
  md: 1.15,
  lg: 1.5,
  xl: 1.85,
};

/**
 * NotebookLoader — Componente oficial de carga realista de Nouttbuk
 *
 * Recrea con fidelidad absoluta la libreta 3D con anillado metálico Wire-O,
 * relieve sombreado, apertura de carátula con troquel 'tt' y animación
 * de hojas articuladas gobernada por Anime.js v4.
 */
export function NotebookLoader({
  fullScreen = false,
  size = "lg",
  mode = "cycle",
  theme = "auto",
  message,
  messages = DEFAULT_MESSAGES,
  showProgress = true,
  showBrand = true,
  brandText = "Tus apuntes, tu comunidad",
  className,
}: NotebookLoaderProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);

  // Escala numérica calculada
  const numericScale = typeof size === "number" ? size : SCALE_MAP[size] ?? 1.5;

  // IDs únicos por instancia para definiciones de gradientes y filtros SVG
  const rawId = React.useId();
  const uid = React.useMemo(() => rawId.replace(/[^a-zA-Z0-9_-]/g, "_"), [rawId]);
  const wireCylinderId = `nb-wire-cyl-${uid}`;
  const wireTealGlowId = `nb-wire-glow-${uid}`;
  const ringShadowId = `nb-ring-shadow-${uid}`;

  // Rotador de micro-mensajes
  const [msgIndex, setMsgIndex] = React.useState(0);
  const [isMsgActive, setIsMsgActive] = React.useState(true);

  React.useEffect(() => {
    if (message) return; // Mensaje fijo proporcionado, no rotar

    const activeList = messages.length > 0 ? messages : DEFAULT_MESSAGES;
    const interval = setInterval(() => {
      setIsMsgActive(false);
      setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % activeList.length);
        setIsMsgActive(true);
      }, 350);
    }, 2800);

    return () => clearInterval(interval);
  }, [message, messages]);

  const displayedMessage =
    message ?? (messages.length > 0 ? messages[msgIndex % messages.length] : DEFAULT_MESSAGES[0]);

  // Orquestación Anime.js v4
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Respetar preferencias de reducción de movimiento del sistema
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    const q = <T extends Element = HTMLElement>(sel: string): T | null =>
      root.querySelector<T>(sel);
    const qAll = <T extends Element = HTMLElement>(sel: string): T[] =>
      Array.from(root.querySelectorAll<T>(sel));

    const frontCover = q(".nb-loader-front-cover");
    const leaf1 = q(".nb-loader-leaf-1");
    const leaf2 = q(".nb-loader-leaf-2");
    const leaf3 = q(".nb-loader-leaf-3");
    const leafBody1 = q(".nb-loader-leaf-body-1");
    const leafBody2 = q(".nb-loader-leaf-body-2");
    const leafBody3 = q(".nb-loader-leaf-body-3");
    const curlShadow1 = q(".nb-loader-curl-shadow-1");
    const curlShadow2 = q(".nb-loader-curl-shadow-2");
    const curlShadow3 = q(".nb-loader-curl-shadow-3");
    const tealBase = q(".nb-loader-teal-base");
    const underShadowRight = q(".nb-loader-under-page-shadow-right");
    const underShadowLeft = q(".nb-loader-under-page-shadow-left");
    const wireArches = qAll(".nb-loader-wire-arch-path");
    const wireRings = qAll(".nb-loader-wire-ring-group");
    const punchHolesLeft = qAll(".nb-loader-punch-hole-left");

    if (!frontCover || !leaf1 || !leaf2 || !leaf3) return;

    let tl: Timeline | null = null;

    if (mode === "cycle") {
      // 1. Estado inicial estricto: portada arriba (Z: 8px), hojas ordenadas debajo (Z: 6, 4, 2)
      set(frontCover, { rotateY: 0, translateZ: 8, opacity: 1 });
      set(leaf1, { rotateY: 0, translateZ: 6, opacity: 1 });
      set(leaf2, { rotateY: 0, translateZ: 4, opacity: 1 });
      set(leaf3, { rotateY: 0, translateZ: 2, opacity: 1 });
      if (leafBody1 && leafBody2 && leafBody3) {
        set([leafBody1, leafBody2, leafBody3], { rotateY: 0, rotateZ: 0 });
      }
      if (curlShadow1 && curlShadow2 && curlShadow3) {
        set([curlShadow1, curlShadow2, curlShadow3], { opacity: 0 });
      }
      if (punchHolesLeft.length) set(punchHolesLeft, { opacity: 0 });
      if (underShadowRight) set(underShadowRight, { opacity: 0 });
      if (underShadowLeft) set(underShadowLeft, { opacity: 0 });
      if (wireArches.length) set(wireArches, { stroke: `url(#${wireCylinderId})` });

      tl = createTimeline({
        loop: true,
        defaults: { ease: "inOutCubic" },
      });

      // 1. REPOSO INICIAL CERRADO (0ms - 450ms)
      if (tealBase) {
        tl.add(
          tealBase,
          {
            opacity: [0.85, 1],
            boxShadow: [
              "0 0 18px rgba(20, 184, 166, 0.35)",
              "0 0 28px rgba(20, 184, 166, 0.6)",
            ],
            duration: 450,
            ease: "outQuad",
          },
          0
        );
      }

      // 2. LA PORTADA PASA PRIMERO Y 100% SOLA (450ms - 1250ms)
      tl.add(
        frontCover,
        {
          rotateY: [0, -180],
          translateZ: [
            { value: 18, duration: 400, ease: "outQuad" },
            { value: -8, duration: 400, ease: "inQuad" },
          ],
          duration: 800,
          ease: "inOutCubic",
        },
        450
      );

      // Reacción de destello metálico de las anillas cilíndricas al abrir la portada
      if (wireArches.length) {
        tl.add(
          wireArches,
          {
            stroke: [
              `url(#${wireCylinderId})`,
              `url(#${wireTealGlowId})`,
              `url(#${wireCylinderId})`,
            ],
            delay: stagger(15),
            duration: 340,
          },
          750
        );
      }

      if (wireRings.length) {
        tl.add(
          wireRings,
          {
            keyframes: [
              { translateY: -0.6, duration: 140, ease: "outQuad" },
              { translateY: 0, duration: 160, ease: "inOutQuad" },
            ],
            delay: stagger(12),
          },
          750
        );
      }

      // Los orificios troquelados del lado izquierdo se revelan al pasar la portada
      if (punchHolesLeft.length) {
        tl.add(
          punchHolesLeft,
          {
            opacity: [0, 1],
            duration: 320,
            ease: "outQuad",
          },
          850
        );
      }

      // 3. HOJAS INTERIORES EN CASCADA (1450ms - 2850ms)
      const addPageCascade = (
        leafEl: Element,
        bodyEl: Element | null,
        shadowEl: Element | null,
        landingZ: number,
        startTime: number
      ) => {
        tl!.add(
          leafEl,
          {
            rotateY: [0, -180],
            translateZ: [
              { value: 14, duration: 350, ease: "outQuad" },
              { value: landingZ, duration: 350, ease: "inQuad" },
            ],
            duration: 700,
            ease: "inOutCubic",
          },
          startTime
        );

        if (bodyEl) {
          tl!.add(
            bodyEl,
            {
              keyframes: [
                { rotateY: 18, rotateZ: -2, duration: 290, ease: "outQuad" },
                { rotateY: -10, rotateZ: 1.5, duration: 260, ease: "inQuad" },
                { rotateY: 0, rotateZ: 0, duration: 150, ease: "outQuad" },
              ],
            },
            startTime
          );
        }

        if (shadowEl) {
          tl!.add(
            shadowEl,
            {
              keyframes: [
                { opacity: 0, duration: 40 },
                { opacity: 0.5, duration: 280, ease: "outQuad" },
                { opacity: 0, duration: 340, ease: "inQuad" },
              ],
            },
            startTime
          );
        }

        if (wireArches.length) {
          tl!.add(
            wireArches,
            {
              stroke: [
                `url(#${wireCylinderId})`,
                `url(#${wireTealGlowId})`,
                `url(#${wireCylinderId})`,
              ],
              delay: stagger(12),
              duration: 200,
            },
            startTime + 220
          );
        }

        if (wireRings.length) {
          tl!.add(
            wireRings,
            {
              keyframes: [
                { translateY: -0.5, duration: 110, ease: "outQuad" },
                { translateY: 0, duration: 130, ease: "outQuad" },
              ],
              delay: stagger(12),
            },
            startTime + 220
          );
        }
      };

      addPageCascade(leaf1, leafBody1, curlShadow1, -5, 1450);
      addPageCascade(leaf2, leafBody2, curlShadow2, -2, 1800);
      addPageCascade(leaf3, leafBody3, curlShadow3, 1, 2150);

      if (underShadowRight) {
        tl.add(
          underShadowRight,
          {
            keyframes: [
              { opacity: 0.35, duration: 300, ease: "outQuad" },
              { opacity: 0, duration: 400, ease: "inQuad" },
            ],
          },
          1500
        );
      }

      // 4. REPOSO CON TRANSICIÓN COMPLETADA AL 100% (2850ms - 3700ms)
      tl.add({}, { duration: 850 });

      // 5. RETORNO ORDENADO: HOJAS VUELVEN PRIMERO A LA DERECHA (3700ms - 4650ms)
      const addPageReturn = (
        leafEl: Element,
        bodyEl: Element | null,
        finalZ: number,
        startTime: number
      ) => {
        tl!.add(
          leafEl,
          {
            rotateY: [-180, 0],
            translateZ: [
              { value: 14, duration: 280, ease: "outQuad" },
              { value: finalZ, duration: 260, ease: "inQuad" },
            ],
            duration: 540,
            ease: "inOutCubic",
          },
          startTime
        );

        if (bodyEl) {
          tl!.add(
            bodyEl,
            {
              keyframes: [
                { rotateY: -16, rotateZ: 2, duration: 220, ease: "outQuad" },
                { rotateY: 10, rotateZ: -1, duration: 200, ease: "inQuad" },
                { rotateY: 0, rotateZ: 0, duration: 120, ease: "outQuad" },
              ],
            },
            startTime
          );
        }
      };

      addPageReturn(leaf3, leafBody3, 2, 3700);
      addPageReturn(leaf2, leafBody2, 4, 3900);
      addPageReturn(leaf1, leafBody1, 6, 4100);

      if (punchHolesLeft.length) {
        tl.add(
          punchHolesLeft,
          {
            opacity: [1, 0],
            duration: 300,
            ease: "outQuad",
          },
          4300
        );
      }

      // 6. LA PORTADA CIERRA SOBRE TODAS LAS HOJAS (4750ms - 5450ms)
      tl.add(
        frontCover,
        {
          rotateY: [-180, 0],
          translateZ: [
            { value: 18, duration: 360, ease: "outQuad" },
            { value: 8, duration: 340, ease: "inQuad" },
          ],
          duration: 700,
          ease: "inOutCubic",
        },
        4750
      );

      if (wireRings.length) {
        tl.add(
          wireRings,
          {
            keyframes: [
              { translateY: -0.6, duration: 140, ease: "outQuad" },
              { translateY: 0, duration: 160, ease: "outQuad" },
            ],
            delay: stagger(15),
          },
          5050
        );
      }

      if (wireArches.length) {
        tl.add(
          wireArches,
          {
            stroke: [
              `url(#${wireCylinderId})`,
              `url(#${wireTealGlowId})`,
              `url(#${wireCylinderId})`,
            ],
            delay: stagger(15),
            duration: 260,
          },
          5050
        );
      }

      // 7. REPOSO CON LIBRETA CERRADA Y LOGO ILUMINADO (5450ms - 6200ms)
      if (tealBase) {
        tl.add(
          tealBase,
          {
            opacity: [1, 0.85],
            boxShadow: [
              "0 0 28px rgba(20, 184, 166, 0.65)",
              "0 0 16px rgba(20, 184, 166, 0.35)",
            ],
            duration: 750,
            ease: "outQuad",
          },
          5450
        );
      }

      tl.add({}, { duration: 400 });
    } else {
      // Modo 2: Hojeo Continuo Infinito
      set(frontCover, { rotateY: -180, translateZ: -8, opacity: 1 });
      if (punchHolesLeft.length) set(punchHolesLeft, { opacity: 1 });
      set([leaf1, leaf2, leaf3], { rotateY: 0, translateZ: 0, opacity: 1 });
      if (leafBody1 && leafBody2 && leafBody3) {
        set([leafBody1, leafBody2, leafBody3], { rotateY: 0, rotateZ: 0 });
      }
      if (curlShadow1 && curlShadow2 && curlShadow3) {
        set([curlShadow1, curlShadow2, curlShadow3], { opacity: 0 });
      }
      if (wireArches.length) set(wireArches, { stroke: `url(#${wireCylinderId})` });

      tl = createTimeline({
        loop: true,
        defaults: { ease: "inOutCubic" },
      });

      const addContinuousFlip = (
        leafEl: Element,
        bodyEl: Element | null,
        shadowEl: Element | null,
        landingZ: number,
        startTime: number
      ) => {
        tl!.add(
          leafEl,
          {
            rotateY: [0, -180],
            translateZ: [
              { value: 15, duration: 380, ease: "outQuad" },
              { value: landingZ, duration: 380, ease: "inQuad" },
            ],
            duration: 760,
            ease: "inOutCubic",
          },
          startTime
        );

        if (bodyEl) {
          tl!.add(
            bodyEl,
            {
              keyframes: [
                { rotateY: 18, rotateZ: -2, duration: 320, ease: "outQuad" },
                { rotateY: -10, rotateZ: 1.5, duration: 280, ease: "inQuad" },
                { rotateY: 0, rotateZ: 0, duration: 160, ease: "outQuad" },
              ],
            },
            startTime
          );
        }

        if (shadowEl) {
          tl!.add(
            shadowEl,
            {
              keyframes: [
                { opacity: 0, duration: 40 },
                { opacity: 0.5, duration: 300, ease: "outQuad" },
                { opacity: 0, duration: 380, ease: "inQuad" },
              ],
            },
            startTime
          );
        }

        if (wireArches.length) {
          tl!.add(
            wireArches,
            {
              stroke: [
                `url(#${wireCylinderId})`,
                `url(#${wireTealGlowId})`,
                `url(#${wireCylinderId})`,
              ],
              delay: stagger(12),
              duration: 180,
            },
            startTime + 220
          );
        }

        if (wireRings.length) {
          tl!.add(
            wireRings,
            {
              keyframes: [
                { translateY: -0.5, duration: 110, ease: "outQuad" },
                { translateY: 0, duration: 140, ease: "outQuad" },
              ],
              delay: stagger(12),
            },
            startTime + 220
          );
        }

        tl!.add(
          leafEl,
          {
            opacity: [1, 0],
            duration: 80,
          },
          startTime + 1100
        );

        tl!.add(
          leafEl,
          {
            rotateY: 0,
            translateZ: 0,
            duration: 10,
          },
          startTime + 1200
        );

        tl!.add(
          leafEl,
          {
            opacity: [0, 1],
            duration: 100,
          },
          startTime + 1220
        );
      };

      addContinuousFlip(leaf1, leafBody1, curlShadow1, -5, 0);
      addContinuousFlip(leaf2, leafBody2, curlShadow2, -2, 700);
      addContinuousFlip(leaf3, leafBody3, curlShadow3, 1, 1400);

      tl.add({}, { duration: 350 });
    }

    return () => {
      if (tl) {
        tl.revert();
        tl.cancel();
      }
    };
  }, [mode, wireCylinderId, wireTealGlowId]);

  const themeAttribute = theme !== "auto" ? theme : undefined;

  return (
    <div
      ref={rootRef}
      data-theme={themeAttribute}
      className={cn(
        "nb-loader-root",
        fullScreen && "fixed inset-0 z-50 min-h-screen w-screen",
        !fullScreen && "relative w-full py-12",
        className
      )}
      style={{ "--nb-scale": numericScale } as React.CSSProperties}
      aria-live="polite"
      aria-label="Cargando contenido de Nouttbuk"
      role="status"
    >
      {/* Resplandor ambiental turquesa de fondo */}
      <div className="nb-loader-ambient-glow" aria-hidden />

      <div className="nb-loader-stage">
        {/* Escena 3D de la Libreta */}
        <div className="nb-loader-book-scene">
          <div className="nb-loader-book-rig">
            {/* Base turquesa con resplandor característico de Nouttbuk */}
            <div className="nb-loader-teal-base" />

            {/* Contraportada sólida */}
            <div className="nb-loader-book-back-cover" />

            {/* Pila estática de hojas derecha */}
            <div className="nb-loader-page-stack-right">
              <div className="nb-loader-page-ruled-lines">
                <div className="nb-loader-p-line nb-loader-w-short" />
                <div className="nb-loader-p-line" />
                <div className="nb-loader-p-line nb-loader-w-mid nb-loader-accent" />
                <div className="nb-loader-p-line" />
                <div className="nb-loader-p-line nb-loader-w-mid" />
                <div className="nb-loader-p-line nb-loader-w-short" />
              </div>
              <div className="nb-loader-under-page-shadow-right" />
            </div>

            {/* Hoja articulada 3 (Base de las 3 hojas móviles) */}
            <div className="nb-loader-paper-leaf nb-loader-leaf-3" style={{ zIndex: 21 }}>
              <div className="nb-loader-paper-body nb-loader-leaf-body-3">
                <div className="nb-loader-paper-ruled-lines">
                  <div className="nb-loader-p-line nb-loader-w-mid" />
                  <div className="nb-loader-p-line" />
                  <div className="nb-loader-p-line nb-loader-w-short" />
                  <div className="nb-loader-p-line" />
                </div>
                <div className="nb-loader-paper-curl-shadow nb-loader-curl-shadow-3" />
                <div className="nb-loader-paper-backface">
                  <div className="nb-loader-page-ruled-lines">
                    <div className="nb-loader-p-line nb-loader-w-mid" />
                    <div className="nb-loader-p-line" />
                    <div className="nb-loader-p-line nb-loader-w-short nb-loader-accent" />
                  </div>
                </div>
              </div>
            </div>

            {/* Hoja articulada 2 (Hoja intermedia) */}
            <div className="nb-loader-paper-leaf nb-loader-leaf-2" style={{ zIndex: 32 }}>
              <div className="nb-loader-paper-body nb-loader-leaf-body-2">
                <div className="nb-loader-paper-ruled-lines">
                  <div className="nb-loader-p-line" />
                  <div className="nb-loader-p-line nb-loader-w-mid nb-loader-accent" />
                  <div className="nb-loader-p-line nb-loader-w-short" />
                  <div className="nb-loader-p-line" />
                </div>
                <div className="nb-loader-paper-curl-shadow nb-loader-curl-shadow-2" />
                <div className="nb-loader-paper-backface">
                  <div className="nb-loader-page-ruled-lines">
                    <div className="nb-loader-p-line nb-loader-w-short" />
                    <div className="nb-loader-p-line" />
                    <div className="nb-loader-p-line nb-loader-w-mid" />
                  </div>
                </div>
              </div>
            </div>

            {/* Hoja articulada 1 (Hoja superior de las 3) */}
            <div className="nb-loader-paper-leaf nb-loader-leaf-1" style={{ zIndex: 33 }}>
              <div className="nb-loader-paper-body nb-loader-leaf-body-1">
                <div className="nb-loader-paper-ruled-lines">
                  <div className="nb-loader-p-line nb-loader-w-mid" />
                  <div className="nb-loader-p-line" />
                  <div className="nb-loader-p-line nb-loader-w-mid" />
                  <div className="nb-loader-p-line nb-loader-w-short" />
                </div>
                <div className="nb-loader-paper-curl-shadow nb-loader-curl-shadow-1" />
                <div className="nb-loader-paper-backface">
                  <div className="nb-loader-page-ruled-lines">
                    <div className="nb-loader-p-line" />
                    <div className="nb-loader-p-line nb-loader-w-mid" />
                    <div className="nb-loader-p-line nb-loader-w-short" />
                  </div>
                </div>
              </div>
            </div>

            {/* Portada frontal con troquel oficial "tt" */}
            <div className="nb-loader-front-cover" style={{ zIndex: 40 }}>
              <div className="nb-loader-cover-frontface">
                <svg viewBox="0 0 120 120" width="58" height="58" fill="#FFFFFF" aria-hidden>
                  <g transform="translate(60, 60) rotate(45)">
                    <path d="
                      M -21 -20.5 C -23.5 -20.5 -25.5 -18.5 -25.5 -16 C -25.5 -13.5 -23.5 -11.5 -21 -11.5 L -12.5 -11.5 L -12.5 -5 C -12.5 -2.5 -10.5 -0.5 -8 -0.5 C -5.5 -0.5 -3.5 -2.5 -3.5 -5 L -3.5 -11.5 L 7.5 -11.5 C 14.5 -11.5 18.5 -15.5 18.5 -21.5 C 18.5 -24 17.5 -26 16 -27.5 C 14 -29.5 14 -32.5 16.5 -34 C 19 -35.5 22 -34.5 23.5 -32 C 26 -28.5 27 -24.5 27 -20.5 C 27 -9.5 20 -3 7.5 -3 L -3.5 -3 L -3.5 3 C -3.5 5.5 -5.5 7.5 -8 7.5 C -10.5 7.5 -12.5 5.5 -12.5 3 L -12.5 -3 L -21 -3 C -23.5 -3 -25.5 -5 -25.5 -7.5 C -25.5 -10 -23.5 -12 -21 -12 L -12.5 -12 L -12.5 -20.5 Z
                    " />
                    <path d="
                      M -21 11.5 C -23.5 11.5 -25.5 13.5 -25.5 16 C -25.5 18.5 -23.5 20.5 -21 20.5 L -12.5 20.5 L -12.5 27 C -12.5 29.5 -10.5 31.5 -8 31.5 C -5.5 31.5 -3.5 29.5 -3.5 27 L -3.5 20.5 L 7.5 20.5 C 14.5 20.5 18.5 16.5 18.5 10.5 C 18.5 8 17.5 6 16 4.5 C 14 2.5 14 -0.5 16.5 -2 C 19 -3.5 22 -2.5 23.5 0 C 26 3.5 27 7.5 27 11.5 C 27 22.5 20 29 7.5 29 L -3.5 29 L -3.5 35 C -3.5 37.5 -5.5 39.5 -8 39.5 C -10.5 39.5 -12.5 37.5 -12.5 35 L -12.5 29 L -21 29 C -23.5 29 -25.5 27 -25.5 24.5 C -25.5 22 -23.5 20 -21 20 L -12.5 20 L -12.5 11.5 Z
                    " />
                  </g>
                </svg>
              </div>
              <div className="nb-loader-cover-backface" />
            </div>

            {/* 6 Anillas metálicas realistas Wire-O con perforaciones troqueladas */}
            <div className="nb-loader-binder-spine-3d" style={{ zIndex: 100 }}>
              <svg
                className="nb-loader-binder-spine-svg"
                viewBox="0 0 26 116"
                width="26"
                height="116"
                aria-hidden
              >
                <defs>
                  {/* Gradiente cilíndrico de acero cromado */}
                  <linearGradient id={wireCylinderId} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="25%" stopColor="#f8fafc" />
                    <stop offset="60%" stopColor="#cbd5e1" />
                    <stop offset="85%" stopColor="#94a3b8" />
                    <stop offset="100%" stopColor="#64748b" />
                  </linearGradient>

                  {/* Destello turquesa de interacción */}
                  <linearGradient id={wireTealGlowId} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="35%" stopColor="#5eead4" />
                    <stop offset="70%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#0f766e" />
                  </linearGradient>

                  {/* Sombra de relieve de anillas */}
                  <filter id={ringShadowId} x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow
                      dx="0.5"
                      dy="1.5"
                      stdDeviation="0.8"
                      floodColor="#0f172a"
                      floodOpacity="0.45"
                    />
                  </filter>
                </defs>

                {/* 6 Anillas con perforaciones de precisión */}
                {[
                  { y: 8, holeY: 5, rightHoleY: 6.5 },
                  { y: 26, holeY: 23, rightHoleY: 24.5 },
                  { y: 44, holeY: 41, rightHoleY: 42.5 },
                  { y: 62, holeY: 59, rightHoleY: 60.5 },
                  { y: 80, holeY: 77, rightHoleY: 78.5 },
                  { y: 98, holeY: 95, rightHoleY: 96.5 },
                ].map((ring, idx) => (
                  <g key={idx} className="nb-loader-wire-ring-group">
                    <rect
                      className="nb-loader-punch-hole-left"
                      x="2"
                      y={ring.holeY}
                      width="4.5"
                      height="7"
                      rx="2.2"
                      fill="#090d16"
                      opacity="0"
                    />
                    <rect
                      className="nb-loader-punch-hole-right"
                      x="19.5"
                      y={ring.rightHoleY}
                      width="4.5"
                      height="7"
                      rx="2.2"
                      fill="#090d16"
                    />
                    <path
                      className="nb-loader-wire-shadow-path"
                      d={`M 4.25 ${ring.y} C 7 ${ring.y - 4.5}, 19 ${ring.y - 3}, 21.75 ${ring.y + 2}`}
                      stroke="rgba(15,23,42,0.4)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      className="nb-loader-wire-arch-path"
                      d={`M 4.25 ${ring.y} C 7 ${ring.y - 5.2}, 19 ${ring.y - 3.7}, 21.75 ${ring.y + 1.5}`}
                      stroke={`url(#${wireCylinderId})`}
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      fill="none"
                      filter={`url(#${ringShadowId})`}
                    />
                    <path
                      className="nb-loader-wire-gleam-path"
                      d={`M 5 ${ring.y - 1} C 7.5 ${ring.y - 4.8}, 17.5 ${ring.y - 3.5}, 20.5 ${ring.y + 0.5}`}
                      stroke="#ffffff"
                      strokeWidth="0.8"
                      strokeLinecap="round"
                      opacity="0.9"
                      fill="none"
                    />
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* Barra de progreso suiza animada */}
        {showProgress && (
          <div className="nb-loader-progress-bar-container">
            <div className="nb-loader-progress-bar-indicator" />
          </div>
        )}

        {/* Mensaje de estado dinámico */}
        <div className="nb-loader-message-container">
          <div className={cn("nb-loader-status-text", isMsgActive && "active")}>
            {displayedMessage}
          </div>
        </div>

        {/* Subtítulo de marca */}
        {showBrand && brandText && (
          <div className="nb-loader-sub-brand">{brandText}</div>
        )}
      </div>
    </div>
  );
}
