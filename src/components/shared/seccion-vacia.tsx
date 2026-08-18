import type { ComponentType, ReactNode } from "react";

type SeccionVaciaProps = {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  titulo: string;
  descripcion: string;
  accion: ReactNode;
};

// Versión a escala de sección (no de página completa) del patrón de estado
// vacío que ya usan apuntes/page.tsx y (shell)/page.tsx: mismo ícono en caja
// punteada + mensaje + acción, pero más chico para vivir dentro de Inicio,
// que ya tiene su propio <h1> en el saludo.
export function SeccionVacia({
  icon: Icon,
  titulo,
  descripcion,
  accion,
}: SeccionVaciaProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl border border-dashed border-border bg-muted text-primary">
        <Icon className="size-5" aria-hidden />
      </div>
      <p className="text-base font-bold text-foreground">{titulo}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{descripcion}</p>
      {accion}
    </div>
  );
}
