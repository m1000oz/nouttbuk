import { cn } from "@/lib/utils";

// Replica el logotipo real de pandatomic.com (icono + wordmark con el átomo
// verde reemplazando la "O" de "ATOMIC"), extraído en vivo de su página para
// mantener su identidad de marca intacta en vez de aproximarla a mano.
// El verde (#39ff97) y el SVG del átomo son exactamente los suyos, "Pand"
// usa `text-foreground` por defecto para seguir el tema claro/oscuro de esta
// app, con un `textClassName` opcional para superficies con fondo fijo (como
// el footer, siempre oscuro sin importar el tema ambiente) donde depender de
// `text-foreground` mostraría texto oscuro sobre oscuro.
export function PandatomicLogo({
  className,
  textClassName = "text-foreground",
}: {
  className?: string;
  textClassName?: string;
}) {
  return (
    <a
      href="https://pandatomic.com"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 align-middle font-semibold no-underline",
        className,
      )}
    >
      <img
        src="/pandatomic-logo.webp"
        alt="PandAtomic"
        className="h-4 w-4 rounded-full"
      />
      <span className={cn("inline-flex items-center", textClassName)}>
        Pand
        <span className="inline-flex items-center text-[#39ff97]">
          AT
          <svg
            className="mx-0.5 h-3 w-3"
            viewBox="0 0 18 18"
            aria-hidden="true"
          >
            <circle cx="9" cy="9" r="1.8" fill="#39ff97" />
            <ellipse
              cx="9"
              cy="9"
              rx="8"
              ry="3.2"
              stroke="#39ff97"
              strokeWidth="1.2"
              fill="none"
            />
            <ellipse
              cx="9"
              cy="9"
              rx="8"
              ry="3.2"
              stroke="#39ff97"
              strokeWidth="1.2"
              fill="none"
              transform="rotate(60 9 9)"
            />
            <ellipse
              cx="9"
              cy="9"
              rx="8"
              ry="3.2"
              stroke="#39ff97"
              strokeWidth="1.2"
              fill="none"
              transform="rotate(120 9 9)"
            />
          </svg>
          MIC
        </span>
      </span>
    </a>
  );
}
