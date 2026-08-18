import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr";

export default function ComunidadPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl border border-dashed border-border bg-muted text-community">
        <UsersThreeIcon className="size-7" aria-hidden />
      </div>
      <h1 className="text-2xl font-bold text-foreground">
        Todavía no hay apuntes en la comunidad
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Cuando alguien publique un apunte como comunidad, aparece aquí,
        visible para cualquier persona, sin necesidad de iniciar sesión.
      </p>
    </div>
  );
}
