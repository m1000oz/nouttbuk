"use client";

import { type FormEvent, type ReactElement, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  CheckCircleIcon,
  FolderIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  COLORES_CARPETA,
  COLOR_CARPETA_POR_DEFECTO,
  type ColorCarpeta,
} from "@/lib/carpetas/colores";
import { cn } from "@/lib/utils";

type CarpetaSheetProps = {
  carpeta?: { id: string; nombre: string; color: string };
  trigger?: ReactElement;
};

const NOMBRES_COLOR: Record<ColorCarpeta, string> = {
  coral: "Coral",
  amber: "Ámbar",
  lime: "Lima",
  cyan: "Cian",
  blue: "Azul",
  violet: "Violeta",
  fuchsia: "Fucsia",
  pink: "Rosa",
};

export function CarpetaSheet({ carpeta, trigger }: CarpetaSheetProps) {
  const router = useRouter();
  const esEdicion = Boolean(carpeta);

  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState(carpeta?.nombre ?? "");
  const [color, setColor] = useState<ColorCarpeta>(
    (carpeta?.color as ColorCarpeta) ?? COLOR_CARPETA_POR_DEFECTO,
  );
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setCargando(true);

    const supabase = createClient();

    if (esEdicion && carpeta) {
      const { error: dbError } = await supabase
        .from("carpetas")
        .update({ nombre, color })
        .eq("id", carpeta.id);

      setCargando(false);
      if (dbError) {
        setError("No se pudo guardar los cambios. Intenta de nuevo.");
        return;
      }
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCargando(false);
        setError("Tu sesión expiró. Vuelve a iniciar sesión.");
        return;
      }

      const { error: dbError } = await supabase
        .from("carpetas")
        .insert({ nombre, color, propietario_id: user.id });

      setCargando(false);
      if (dbError) {
        setError("No se pudo crear la carpeta. Intenta de nuevo.");
        return;
      }
    }

    setOpen(false);
    toast.add({
      title: esEdicion ? "Carpeta actualizada." : "Carpeta creada.",
      type: "success",
    });
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          trigger ??
          (esEdicion ? (
            <Button variant="outline">
              <PencilSimpleIcon aria-hidden />
              Editar carpeta
            </Button>
          ) : (
            <Button variant="default">
              <PlusIcon aria-hidden />
              Nueva carpeta
            </Button>
          ))
        }
      />
      <SheetContent
        side="bottom"
        className="mx-auto w-full rounded-t-xl border-t border-border sm:max-w-sm"
      >
        <div
          className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border"
          aria-hidden
        />
        <SheetHeader>
          <SheetTitle>
            {esEdicion ? "Edita la carpeta" : "Crea una carpeta"}
          </SheetTitle>
          <SheetDescription>
            Elige un nombre y un color para organizar tus apuntes por
            materia.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 px-4 pb-4"
        >
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="carpeta-nombre">Nombre de la materia</Label>
            <Input
              id="carpeta-nombre"
              required
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
            />
          </div>

          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-sm font-medium text-foreground">
              Color
            </legend>
            <div className="flex flex-wrap gap-1">
              {(Object.keys(COLORES_CARPETA) as ColorCarpeta[]).map(
                (clave) => (
                  <button
                    key={clave}
                    type="button"
                    onClick={() => setColor(clave)}
                    aria-pressed={color === clave}
                    aria-label={NOMBRES_COLOR[clave]}
                    className={cn(
                      "relative flex size-11 items-center justify-center rounded-lg outline-none transition-transform focus-visible:ring-3 focus-visible:ring-ring/50",
                      color === clave && "bg-muted",
                    )}
                  >
                    <FolderIcon
                      weight="fill"
                      className="size-7"
                      style={{ color: COLORES_CARPETA[clave] }}
                      aria-hidden
                    />
                    {color === clave && (
                      <CheckCircleIcon
                        weight="fill"
                        className="absolute -right-0.5 -bottom-0.5 size-4 rounded-full bg-background text-ring"
                        aria-hidden
                      />
                    )}
                  </button>
                ),
              )}
            </div>
          </fieldset>

          <SheetFooter className="p-0">
            <Button type="submit" loading={cargando}>
              {esEdicion ? "Guardar cambios" : "Crear carpeta"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
