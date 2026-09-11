import * as React from "react";
import { cn } from "@/lib/utils";

export type NouttbukIsotipoProps = {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  variant?: "color" | "monochrome" | "white";
  className?: string;
  interactive?: boolean;
} & React.SVGProps<SVGSVGElement>;

const SIZES: Record<"xs" | "sm" | "md" | "lg" | "xl", number> = {
  xs: 20,
  sm: 28,
  md: 36,
  lg: 48,
  xl: 64,
};

/**
 * Isotipo Minimalista Oficial de Nouttbuk:
 * Cuaderno geométrico girado a 45 grados en Índigo mate (#4F46E5) con
 * base turquesa (#14B8A6), anillas estilizadas y dos troqueles 'tt' en espacio negativo
 * con la misma inclinación de 45° de la cubierta.
 *
 * Estilo minimalista suizo / nórdico para apps de productividad estudiantil.
 * Cero reflejos plásticos, estética sobria y profesional.
 */
export function NouttbukIsotipo({
  size = "md",
  variant = "color",
  className,
  interactive = false,
  ...props
}: NouttbukIsotipoProps) {
  const dimension = typeof size === "number" ? size : SIZES[size] ?? 36;
  const isColor = variant === "color";
  const isWhite = variant === "white";

  const coverColor = isColor ? "#4F46E5" : isWhite ? "currentColor" : "currentColor";
  const tealEdge = isColor ? "#14B8A6" : isWhite ? "currentColor" : "currentColor";
  const ringColor = isColor ? "#FFFFFF" : isWhite ? "#0F172A" : "#FFFFFF";
  const cutoutColor = isColor ? "#FFFFFF" : isWhite ? "#0F172A" : "#FFFFFF";
  const punchHoleColor = isColor ? "#1E1B4B" : isWhite ? "currentColor" : "currentColor";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={dimension}
      height={dimension}
      className={cn(
        "shrink-0 select-none overflow-visible transition-transform duration-200",
        interactive && "hover:scale-105 active:scale-95",
        className,
      )}
      aria-label="Isotipo de Nouttbuk"
      role="img"
      {...props}
    >

      <g transform="translate(256, 256)">
        {/* Cuaderno girado 45 grados */}
        <g transform="rotate(45)">
          {/* Base inferior / acento turquesa */}
          <rect
            x="-120"
            y="-120"
            width="240"
            height="240"
            rx="34"
            fill={tealEdge}
            opacity={isColor ? 1 : 0.25}
            transform="translate(10, 10)"
          />

          {/* Cubierta principal del cuaderno: Índigo mate */}
          <rect
            x="-120"
            y="-120"
            width="240"
            height="240"
            rx="32"
            fill={coverColor}
          />

          {/* Anillas minimalistas en el lomo */}
          <g>
            <circle cx="-96" cy="-80" r="8" fill={punchHoleColor} opacity={isColor ? 1 : 0.3} />
            <circle cx="-96" cy="-40" r="8" fill={punchHoleColor} opacity={isColor ? 1 : 0.3} />
            <circle cx="-96" cy="0" r="8" fill={punchHoleColor} opacity={isColor ? 1 : 0.3} />
            <circle cx="-96" cy="40" r="8" fill={punchHoleColor} opacity={isColor ? 1 : 0.3} />
            <circle cx="-96" cy="80" r="8" fill={punchHoleColor} opacity={isColor ? 1 : 0.3} />

            <path d="M -136 -80 L -96 -80" stroke={ringColor} strokeWidth="12" strokeLinecap="round" />
            <path d="M -136 -40 L -96 -40" stroke={ringColor} strokeWidth="12" strokeLinecap="round" />
            <path d="M -136 0 L -96 0" stroke={ringColor} strokeWidth="12" strokeLinecap="round" />
            <path d="M -136 40 L -96 40" stroke={ringColor} strokeWidth="12" strokeLinecap="round" />
            <path d="M -136 80 L -96 80" stroke={ringColor} strokeWidth="12" strokeLinecap="round" />
          </g>

          {/* Troqueles en espacio negativo 'tt' en la orientación idéntica a la cubierta */}
          <g transform="translate(16, 0)" fill={cutoutColor}>
            {/* Letra t1 (y = -32) */}
            <path d="
              M -42 -41
              C -47 -41 -51 -37 -51 -32
              C -51 -27 -47 -23 -42 -23
              L -25 -23
              L -25 -10
              C -25 -5 -21 -1 -16 -1
              C -11 -1 -7 -5 -7 -10
              L -7 -23
              L 15 -23
              C 29 -23 37 -31 37 -43
              C 37 -48 35 -52 32 -55
              C 28 -59 28 -65 33 -68
              C 38 -71 44 -69 47 -64
              C 52 -57 54 -49 54 -41
              C 54 -19 40 -6 15 -6
              L -7 -6
              L -7 6
              C -7 11 -11 15 -16 15
              C -21 15 -25 11 -25 6
              L -25 -6
              L -42 -6
              C -47 -6 -51 -10 -51 -15
              C -51 -20 -47 -24 -42 -24
              L -25 -24
              L -25 -41
              Z
            " />

            {/* Letra t2 (y = +32) */}
            <path d="
              M -42 23
              C -47 23 -51 27 -51 32
              C -51 37 -47 41 -42 41
              L -25 41
              L -25 54
              C -25 59 -21 63 -16 63
              C -11 63 -7 59 -7 54
              L -7 41
              L 15 41
              C 29 41 37 33 37 21
              C 37 16 35 12 32 9
              C 28 5 28 -1 33 -4
              C 38 -7 44 -5 47 0
              C 52 7 54 15 54 23
              C 54 45 40 58 15 58
              L -7 58
              L -7 70
              C -7 75 -11 79 -16 79
              C -21 79 -25 75 -25 70
              L -25 58
              L -42 58
              C -47 58 -51 54 -51 49
              C -51 44 -47 40 -42 40
              L -25 40
              L -25 23
              Z
            " />
          </g>
        </g>
      </g>
    </svg>
  );
}
