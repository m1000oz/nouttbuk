import Link from "next/link";
import { CompassIcon } from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Página no encontrada, Nouttbuk",
};

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl border border-dashed border-border bg-muted text-primary">
        <CompassIcon className="size-7" aria-hidden />
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">
          Página no encontrada
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          El enlace que seguiste no existe o el contenido ya no está
          disponible.
        </p>
      </div>
      <Button nativeButton={false} render={<Link href="/" />}>
        Volver al inicio
      </Button>
    </div>
  );
}
