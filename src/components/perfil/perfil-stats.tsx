import {
  BookOpenIcon,
  HeartIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";

type PerfilStatsProps = {
  apuntes: number;
  aportes: number;
  contactos: number;
};

const STATS: {
  clave: keyof PerfilStatsProps;
  etiqueta: string;
  icon: typeof BookOpenIcon;
}[] = [
  { clave: "apuntes", etiqueta: "Apuntes", icon: BookOpenIcon },
  { clave: "aportes", etiqueta: "Aportes", icon: HeartIcon },
  { clave: "contactos", etiqueta: "Contactos", icon: UsersThreeIcon },
];

// Números estáticos, sin motion: a diferencia de las tarjetas de Inicio/
// Comunidad, esto es un resumen de solo lectura sin nada que "entre" en
// pantalla más que el resto del texto de la página.
export function PerfilStats(props: PerfilStatsProps) {
  return (
    <dl className="grid w-full grid-cols-3 gap-2">
      {STATS.map(({ clave, etiqueta, icon: Icon }) => (
        <div
          key={clave}
          className="flex flex-col items-center gap-1 rounded-xl border border-border px-3 py-4"
        >
          <Icon className="size-5 text-primary" aria-hidden />
          <dd className="text-xl font-bold text-foreground">
            {props[clave]}
          </dd>
          <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
        </div>
      ))}
    </dl>
  );
}
