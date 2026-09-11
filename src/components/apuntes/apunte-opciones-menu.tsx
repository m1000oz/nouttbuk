"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DotsThreeVerticalIcon,
  FolderIcon,
  ShareNetworkIcon,
  TrashIcon,
} from "@phosphor-icons/react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DialogoCompartirApunte } from "@/components/apuntes/dialogo-compartir-apunte";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { resolverColorCarpeta } from "@/lib/carpetas/colores";
import { cn } from "@/lib/utils";
import type { ApunteVisibilidad, PermisoColaborador } from "@/lib/types/enums";

type CarpetaOpcion = { id: string; nombre: string; color: string };

type ApunteOpcionesMenuProps = {
  apunteId: string;
  titulo: string;
  esPropio: boolean;
  carpetaIdActual: string | null;
  visibilidadActual: ApunteVisibilidad;
  enlaceToken: string | null;
  enlacePermiso: PermisoColaborador;
  carpetas: CarpetaOpcion[];
};

const VISIBILIDAD_LABEL: Record<ApunteVisibilidad, string> = {
  private: "Privado",
  group: "Grupo",
  community: "Comunidad",
};

// Menú plano (sin submenús anidados, para no depender de que el primitivo de
// Base UI los soporte bien) con 3 acciones: mover a carpeta, compartir
// rápido, eliminar. Oculto para apuntes de la pestaña Compartidos (esPropio
// = false): RLS ya bloquearía las mutaciones igual, pero no tiene sentido
// mostrar la opción.
export function ApunteOpcionesMenu({
  apunteId,
  titulo,
  esPropio,
  carpetaIdActual,
  visibilidadActual,
  enlaceToken,
  enlacePermiso,
  carpetas,
}: ApunteOpcionesMenuProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moverOpen, setMoverOpen] = useState(false);
  const [compartirDialogOpen, setCompartirDialogOpen] = useState(false);
  const [eliminarOpen, setEliminarOpen] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function moverACarpeta(carpetaId: string | null) {
    setCargando(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("apuntes")
      .update({ carpeta_id: carpetaId })
      .eq("id", apunteId);
    setCargando(false);
    setMoverOpen(false);
    if (error) {
      toast.add({ title: "No se pudo mover el apunte.", type: "error" });
      return;
    }
    toast.add({ title: "Apunte movido.", type: "success" });
    router.refresh();
  }

  async function eliminar() {
    setCargando(true);
    const supabase = createClient();
    const { error } = await supabase.from("apuntes").delete().eq("id", apunteId);
    setCargando(false);
    setEliminarOpen(false);
    if (error) {
      toast.add({ title: "No se pudo eliminar el apunte.", type: "error" });
      return;
    }
    toast.add({ title: "Apunte eliminado.", type: "success" });
    router.refresh();
  }

  if (!esPropio) return null;

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Opciones del apunte"
              className="bg-background/80 backdrop-blur-xs hover:bg-muted"
            />
          }
        >
          <DotsThreeVerticalIcon weight="bold" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setMoverOpen(true)}>
            <FolderIcon aria-hidden />
            Mover a carpeta
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCompartirDialogOpen(true)}>
            <ShareNetworkIcon aria-hidden />
            Compartir
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setEliminarOpen(true)}
          >
            <TrashIcon aria-hidden />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet open={moverOpen} onOpenChange={setMoverOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto w-full rounded-t-xl border-t border-border sm:max-w-sm"
        >
          <div
            className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border"
            aria-hidden
          />
          <SheetHeader>
            <SheetTitle>Mover a carpeta</SheetTitle>
            <SheetDescription>
              Elige la carpeta donde quieres guardar este apunte.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4 pb-4">
            <button
              type="button"
              disabled={cargando}
              onClick={() => moverACarpeta(null)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted",
                carpetaIdActual === null && "bg-muted font-medium",
              )}
            >
              Sin carpeta
            </button>
            {carpetas.map((carpeta) => (
              <button
                key={carpeta.id}
                type="button"
                disabled={cargando}
                onClick={() => moverACarpeta(carpeta.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted",
                  carpetaIdActual === carpeta.id && "bg-muted font-medium",
                )}
              >
                <FolderIcon
                  weight="fill"
                  className="size-4 shrink-0"
                  style={{ color: resolverColorCarpeta(carpeta.color) }}
                  aria-hidden
                />
                {carpeta.nombre}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <DialogoCompartirApunte
        apunteId={apunteId}
        titulo={titulo}
        enlaceToken={enlaceToken}
        enlacePermiso={enlacePermiso}
        visibilidad={visibilidadActual}
        open={compartirDialogOpen}
        onOpenChange={setCompartirDialogOpen}
      />

      <Dialog open={eliminarOpen} onOpenChange={setEliminarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar apunte</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El apunte se elimina para
              siempre.
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
              onClick={eliminar}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
