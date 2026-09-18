import { cn } from "@/lib/utils";

type RingSeamProps = {
  className?: string;
  dotClassName?: string;
};

/**
 * Costura de anillas de cuaderno (mismo motivo de ApunteTarjeta), reutilizada
 * como divisor entre franjas de temperatura distinta a lo largo del scroll.
 * El color de cada punto es el de la sección que queda "al frente" en el
 * traslape, para que se lea como un perforado real, no como una línea
 * decorativa cualquiera.
 */
export function RingSeam({ className, dotClassName }: RingSeamProps) {
  const anillas = Array.from({ length: 28 });

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 flex justify-center gap-[3.2%] px-6",
        className,
      )}
      aria-hidden
    >
      {anillas.map((_, i) => (
        <span
          key={i}
          className={cn("size-2.5 shrink-0 rounded-full border-2 sm:size-3", dotClassName)}
        />
      ))}
    </div>
  );
}
