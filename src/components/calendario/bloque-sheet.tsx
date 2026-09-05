"use client";

import { type FormEvent, type ReactElement, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import {
  COLORES_CARPETA,
  COLOR_CARPETA_POR_DEFECTO,
  type ColorCarpeta,
} from "@/lib/carpetas/colores";
import { DIAS_SEMANA } from "@/lib/calendario/consultas";
import { cn } from "@/lib/utils";

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

type BloqueSheetProps = {
  perfilId: string;
  bloque?: {
    id: string;
    titulo: string;
    diaSemana: number;
    horaInicio: string;
    horaFin: string;
    color: string;
  };
  diaInicial?: number;
  // Opcional: page.tsx (Server Component) no puede construir JSX con
  // <Button> directamente, ver la nota de CLAUDE.md sobre Button e íconos
  // no-SSR creando contexto de React al importarse fuera de un límite "use
  // client". El trigger "Nuevo bloque" por defecto vive acá adentro en vez
  // de pasarse desde afuera, mismo patrón que CarpetaSheet.
  trigger?: ReactElement;
};

export function BloqueSheet({
  perfilId,
  bloque,
  diaInicial,
  trigger,
}: BloqueSheetProps) {
  const router = useRouter();
  const esEdicion = Boolean(bloque);

  const [open, setOpen] = useState(false);
  const [eliminarOpen, setEliminarOpen] = useState(false);
  const [titulo, setTitulo] = useState(bloque?.titulo ?? "");
  const [diaSemana, setDiaSemana] = useState(
    String(bloque?.diaSemana ?? diaInicial ?? 0),
  );
  // Los inputs type="time" nativos trabajan en "HH:MM"; hora_inicio/hora_fin
  // llegan de Postgres como "HH:MM:SS", de ahí el slice.
  const [horaInicio, setHoraInicio] = useState(
    bloque?.horaInicio.slice(0, 5) ?? "08:00",
  );
  const [horaFin, setHoraFin] = useState(bloque?.horaFin.slice(0, 5) ?? "09:00");
  const [color, setColor] = useState<ColorCarpeta>(
    (bloque?.color as ColorCarpeta) ?? COLOR_CARPETA_POR_DEFECTO,
  );
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (horaFin <= horaInicio) {
      setError("La hora de fin debe ser posterior a la hora de inicio.");
      return;
    }

    setCargando(true);
    const supabase = createClient();
    const campos = {
      titulo,
      dia_semana: Number(diaSemana),
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      color,
    };

    const { error: dbError } =
      esEdicion && bloque
        ? await supabase.from("bloques_horario").update(campos).eq("id", bloque.id)
        : await supabase
            .from("bloques_horario")
            .insert({ ...campos, perfil_id: perfilId });

    setCargando(false);

    if (dbError) {
      setError("No se pudo guardar el bloque. Intenta de nuevo.");
      return;
    }

    setOpen(false);
    toast.add({
      title: esEdicion ? "Bloque actualizado." : "Bloque creado.",
      type: "success",
    });
    router.refresh();
  }

  async function handleEliminar() {
    if (!bloque) return;
    setCargando(true);
    const supabase = createClient();
    const { error: dbError } = await supabase
      .from("bloques_horario")
      .delete()
      .eq("id", bloque.id);
    setCargando(false);
    setEliminarOpen(false);

    if (dbError) {
      toast.add({ title: "No se pudo eliminar el bloque.", type: "error" });
      return;
    }

    setOpen(false);
    toast.add({ title: "Bloque eliminado.", type: "success" });
    router.refresh();
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            trigger ?? (
              <Button type="button" size="sm">
                <PlusIcon aria-hidden />
                Nuevo bloque
              </Button>
            )
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
              {esEdicion ? "Edita el bloque" : "Nuevo bloque de horario"}
            </SheetTitle>
            <SheetDescription>
              Se repite cada semana en el día y horario que elijas.
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
              <Label htmlFor="bloque-titulo">Título</Label>
              <Input
                id="bloque-titulo"
                required
                placeholder="Cálculo 2, reunión de proyecto..."
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bloque-dia">Día</Label>
              <Select
                value={diaSemana}
                onValueChange={(valor) => setDiaSemana(valor ?? "0")}
                items={Object.fromEntries(
                  DIAS_SEMANA.map((dia, indice) => [String(indice), dia]),
                )}
              >
                <SelectTrigger id="bloque-dia" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIAS_SEMANA.map((dia, indice) => (
                    <SelectItem key={dia} value={String(indice)}>
                      {dia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="bloque-inicio">Desde</Label>
                <Input
                  id="bloque-inicio"
                  type="time"
                  required
                  value={horaInicio}
                  onChange={(event) => setHoraInicio(event.target.value)}
                />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="bloque-fin">Hasta</Label>
                <Input
                  id="bloque-fin"
                  type="time"
                  required
                  value={horaFin}
                  onChange={(event) => setHoraFin(event.target.value)}
                />
              </div>
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
                        "relative flex size-8 items-center justify-center rounded-lg outline-none transition-transform focus-visible:ring-3 focus-visible:ring-ring/50",
                        color === clave && "bg-muted",
                      )}
                    >
                      <span
                        className="size-5 rounded-full"
                        style={{ backgroundColor: COLORES_CARPETA[clave] }}
                        aria-hidden
                      />
                      {color === clave && (
                        <CheckCircleIcon
                          weight="fill"
                          className="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full bg-background text-ring"
                          aria-hidden
                        />
                      )}
                    </button>
                  ),
                )}
              </div>
            </fieldset>

            <SheetFooter className="flex-row gap-2 p-0">
              {esEdicion && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEliminarOpen(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <TrashIcon aria-hidden />
                </Button>
              )}
              <Button type="submit" loading={cargando} className="flex-1">
                {esEdicion ? "Guardar cambios" : "Crear bloque"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {esEdicion && (
        <Dialog open={eliminarOpen} onOpenChange={setEliminarOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar bloque</DialogTitle>
              <DialogDescription>
                Se quita &quot;{bloque?.titulo}&quot; de tu calendario. Esta
                acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>
                Cancelar
              </DialogClose>
              <Button
                type="button"
                variant="destructive"
                loading={cargando}
                onClick={handleEliminar}
              >
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
