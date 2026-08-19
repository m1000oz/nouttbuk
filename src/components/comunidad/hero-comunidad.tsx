"use client";

import { useEffect, useRef } from "react";
import { animate, createScope, stagger, type Scope } from "animejs";
import { useReducedMotion } from "motion/react";

// Único uso de anime.js del proyecto (DESIGN-SYSTEM.md lo reserva para el
// hero de Comunidad y la primera entrada del feed público); todo lo demás
// usa Motion (motion/react). createScope liga la animación al ciclo de vida
// de este componente para poder revertirla limpiamente al desmontar.
export function HeroComunidad() {
  const raizRef = useRef<HTMLDivElement>(null);
  const scopeRef = useRef<Scope | null>(null);
  const prefiereMenosMovimiento = useReducedMotion();

  useEffect(() => {
    if (!raizRef.current || prefiereMenosMovimiento) return;

    scopeRef.current = createScope({ root: raizRef }).add(() => {
      animate("[data-hero-entrada]", {
        opacity: [0, 1],
        translateY: [16, 0],
        delay: stagger(90),
        duration: 500,
        ease: "outQuad",
      });
    });

    return () => scopeRef.current?.revert();
  }, [prefiereMenosMovimiento]);

  return (
    <div
      ref={raizRef}
      className="flex flex-col gap-2 px-6 pt-8 pb-2 text-center sm:text-left"
    >
      <h1 data-hero-entrada className="text-3xl font-bold text-foreground">
        Comunidad
      </h1>
      <p
        data-hero-entrada
        className="max-w-xl text-sm text-muted-foreground sm:text-base"
      >
        Apuntes que estudiantes de la PUCP decidieron compartir, listos para
        explorar sin necesidad de iniciar sesión.
      </p>
    </div>
  );
}
