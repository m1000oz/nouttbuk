"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./gooey-nav.module.css";

type GooeyNavItem = {
  label: string;
  href: string;
};

type GooeyNavProps = {
  items: GooeyNavItem[];
  onNavigate?: (href: string) => void;
};

const COLORS = ["#4F46E5", "#14B8A6", "#818CF8", "#5EEAD4"];
const PARTICLE_COUNT = 8;
const PARTICLE_DISTANCES: [number, number] = [46, 6];
const PARTICLE_R = 90;
const ANIMATION_TIME = 380;
const TIME_VARIANCE = 200;

const noise = (n = 1) => n / 2 - Math.random() * n;

const getXY = (distance: number, pointIndex: number, totalPoints: number) => {
  const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
  return [distance * Math.cos(angle), distance * Math.sin(angle)];
};

function crearParticula(i: number) {
  const rotate = noise(PARTICLE_R / 10);
  return {
    start: getXY(PARTICLE_DISTANCES[0], PARTICLE_COUNT - i, PARTICLE_COUNT),
    end: getXY(PARTICLE_DISTANCES[1] + noise(7), PARTICLE_COUNT - i, PARTICLE_COUNT),
    time: ANIMATION_TIME * 2 + noise(TIME_VARIANCE * 2),
    scale: 1 + noise(0.2),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotate: rotate > 0 ? (rotate + PARTICLE_R / 20) * 10 : (rotate - PARTICLE_R / 20) * 10,
  };
}

/**
 * Indicador de pestaña activa con un pequeño estallido de partículas al
 * cambiar de link, adaptado de la animación "gooey" de React Bits (blob
 * líquido vía filter: blur + contrast) a la paleta índigo/teal de Nouttbuk.
 * Se omite el efecto por completo si el visitante prefiere menos movimiento.
 */
export function GooeyNav({ items, onNavigate }: GooeyNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const filterRef = useRef<HTMLSpanElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const posicionarEfecto = (elemento: HTMLElement) => {
    if (!containerRef.current || !filterRef.current) return;
    const contenedor = containerRef.current.getBoundingClientRect();
    const pos = elemento.getBoundingClientRect();
    Object.assign(filterRef.current.style, {
      left: `${pos.x - contenedor.x}px`,
      top: `${pos.y - contenedor.y}px`,
      width: `${pos.width}px`,
      height: `${pos.height}px`,
    });
  };

  const lanzarParticulas = () => {
    const filtro = filterRef.current;
    if (!filtro) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    filtro.classList.remove(styles.active);
    filtro.querySelectorAll(`.${styles.particle}`).forEach((p) => p.remove());

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = crearParticula(i);
      setTimeout(() => {
        const particula = document.createElement("span");
        const punto = document.createElement("span");
        particula.className = styles.particle;
        particula.style.setProperty("--start-x", `${p.start[0]}px`);
        particula.style.setProperty("--start-y", `${p.start[1]}px`);
        particula.style.setProperty("--end-x", `${p.end[0]}px`);
        particula.style.setProperty("--end-y", `${p.end[1]}px`);
        particula.style.setProperty("--time", `${p.time}ms`);
        particula.style.setProperty("--scale", `${p.scale}`);
        particula.style.setProperty("--color", p.color);
        particula.style.setProperty("--rotate", `${p.rotate}deg`);
        punto.className = styles.point;
        particula.appendChild(punto);
        filtro.appendChild(particula);
        requestAnimationFrame(() => filtro.classList.add(styles.active));
        setTimeout(() => particula.remove(), p.time);
      }, 20);
    }
  };

  const activar = (index: number, elemento: HTMLElement) => {
    if (activeIndex === index) return;
    setActiveIndex(index);
    posicionarEfecto(elemento);
    lanzarParticulas();
  };

  useEffect(() => {
    const handleResize = () => {
      if (activeIndex === null || !navRef.current) return;
      const activo = navRef.current.querySelectorAll("li")[activeIndex];
      if (activo) posicionarEfecto(activo);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeIndex]);

  return (
    <div className={styles.container} ref={containerRef}>
      <nav aria-label="Navegación principal">
        <ul ref={navRef}>
          {items.map((item, index) => (
            <li key={item.href} className={activeIndex === index ? styles.active : undefined}>
              <Link
                href={item.href}
                onClick={(e) => {
                  activar(index, e.currentTarget.parentElement as HTMLElement);
                  onNavigate?.(item.href);
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <span className={`${styles.effect} ${styles.filter}`} ref={filterRef} />
    </div>
  );
}
