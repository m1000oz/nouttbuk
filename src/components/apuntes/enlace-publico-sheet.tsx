"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowsClockwiseIcon,
  CopySimpleIcon,
  LinkBreakIcon,
  LinkIcon,
} from "@phosphor-icons/react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { ApunteVisibilidad, PermisoColaborador } from "@/lib/types/enums";

type EnlacePublicoSheetProps = {
  apunteId: string;
  titulo: string;
  token: string | null;
  permiso: PermisoColaborador;
  visibilidad: ApunteVisibilidad;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Ausente en ApunteOpcionesMenu (la lista de Mis apuntes no tiene estado
  // local de visibilidad que sincronizar, router.refresh() ya le alcanza).
  // Presente en ApunteEditor: sin esto, el <Select> de visibilidad del
  // encabezado se quedaría mostrando "Privado" en memoria mientras la base
  // de datos ya dice "Grupo" (ver el mismo problema documentado para
  // CompartirSheet en CLAUDE.md), y un "Guardar" posterior lo revertiría.
  onVisibilidadCambiada?: (visibilidad: ApunteVisibilidad) => void;
};

const PERMISO_LABEL: Record<PermisoColaborador, string> = {
  read: "Lector",
  edit: "Editor",
};

// `ApunteOpcionesMenu`/`ApunteTarjeta` renderizan este Sheet sin gatearlo
// detrás de un `open`, así que su render corre en el server (Next.js
// renderiza los Client Components en el server para el HTML inicial, no solo
// en el navegador) apenas cualquier apunte tenga `enlace_token`, y `window`
// no existe ahí: `window.location.origin` leído directo en el cuerpo del
// render revienta con "window is not defined" en cuanto hay algún enlace
// activo (bug real, encontrado en producción tras generar un enlace).
// `useSyncExternalStore` (no un useState+useEffect a mano) es la forma
// correcta de leer algo externo como `window.location` de forma segura entre
// server y cliente: `getServerSnapshot` devuelve "" en el server, el primer
// render del cliente coincide (sin mismatch de hidratación), y React re-
// renderiza solo una vez con el valor real después de montar, sin caer en el
// antipatrón de llamar setState directo dentro de un efecto.
function subscribirOrigin() {
  return () => {};
}

function useOrigin(): string {
  return useSyncExternalStore(
    subscribirOrigin,
    () => window.location.origin,
    () => "",
  );
}

// Igual que CompartirSheet: `token`/`permiso` llegan como props desde el
// Server Component (fuente de verdad), cada mutación llama a
// router.refresh() y React vuelve a pasar los props actualizados, sin
// duplicar estado local que se desincronice. A diferencia de CompartirSheet,
// no tiene SheetTrigger propio: se abre desde el botón "Compartir" del
// encabezado del editor o desde ApunteOpcionesMenu (la lista de Mis
// apuntes), así que `open`/`onOpenChange` los controla el padre.
export function EnlacePublicoSheet({
  apunteId,
  titulo,
  token,
  permiso,
  visibilidad,
  open,
  onOpenChange,
  onVisibilidadCambiada,
}: EnlacePublicoSheetProps) {
  const router = useRouter();
  const origin = useOrigin();

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permisoNuevo, setPermisoNuevo] = useState<PermisoColaborador>(permiso);

  function construirUrl(token: string): string {
    return `${origin}/compartido/${token}`;
  }

  // Un colaborador (por enlace o por invitación) solo tiene acceso real vía
  // RLS cuando visibilidad = 'group' (private.can_read_group_apunte), así
  // que habilitar o cambiar el permiso del enlace sube la visibilidad de
  // 'private' a 'group' de una vez, en vez de esperar a que unirse_por_enlace
  // la suba recién cuando alguien lo abra (mismo respaldo del lado del
  // servidor sigue existiendo ahí, esto es solo para que el dueño vea el
  // cambio reflejado de inmediato, sin sorpresas).
  async function actualizarEnlace(
    cambios: { enlace_token?: string | null; enlace_permiso?: PermisoColaborador },
    mensajeExito: string,
  ) {
    setError(null);
    setCargando(true);

    const subeVisibilidad = visibilidad === "private" && cambios.enlace_token !== null;
    const supabase = createClient();
    const { error: dbError } = await supabase
      .from("apuntes")
      .update({
        ...cambios,
        ...(subeVisibilidad ? { visibilidad: "group" as const } : {}),
      })
      .eq("id", apunteId);

    setCargando(false);

    if (dbError) {
      setError("No se pudo actualizar el enlace. Intenta de nuevo.");
      return;
    }

    if (subeVisibilidad) {
      onVisibilidadCambiada?.("group");
      toast.add({
        title: `${mensajeExito} Este apunte ahora es de grupo para que quien entre por el enlace pueda acceder.`,
        type: "success",
      });
    } else {
      toast.add({ title: mensajeExito, type: "success" });
    }
    router.refresh();
  }

  async function handleGenerar() {
    await actualizarEnlace(
      { enlace_token: crypto.randomUUID(), enlace_permiso: permisoNuevo },
      "Enlace generado.",
    );
  }

  async function handleRegenerar() {
    await actualizarEnlace(
      { enlace_token: crypto.randomUUID() },
      "Se generó un enlace nuevo. El anterior dejó de funcionar.",
    );
  }

  async function handleCambiarPermiso(valor: PermisoColaborador | null) {
    if (!valor) return;
    setPermisoNuevo(valor);
    if (token) {
      await actualizarEnlace(
        { enlace_permiso: valor },
        `Ahora el enlace da acceso de ${PERMISO_LABEL[valor].toLowerCase()}.`,
      );
    }
  }

  async function handleRevocar() {
    await actualizarEnlace({ enlace_token: null }, "Dejaste de compartir este apunte por enlace.");
  }

  async function handleCopiar() {
    if (!token) return;
    const url = construirUrl(token);

    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, url });
        return;
      } catch {
        // El usuario canceló el diálogo nativo de compartir: no es un error.
        return;
      }
    }
    await navigator.clipboard.writeText(url);
    toast.add({ title: "Enlace copiado.", type: "success" });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto w-full rounded-t-xl border-t border-border sm:max-w-sm"
      >
        <div
          className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border"
          aria-hidden
        />
        <SheetHeader>
          <SheetTitle>Compartir por enlace</SheetTitle>
          <SheetDescription>
            Cualquier persona con el enlace puede ver este apunte sin
            necesidad de iniciar sesión. Si además inicia sesión, entra con
            el acceso que elijas abajo.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-4">
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <Select
            value={permisoNuevo}
            onValueChange={handleCambiarPermiso}
            items={PERMISO_LABEL}
          >
            <SelectTrigger size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PERMISO_LABEL) as PermisoColaborador[]).map((clave) => (
                <SelectItem key={clave} value={clave}>
                  {PERMISO_LABEL[clave]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {token ? (
            <>
              <div className="flex items-center gap-2">
                <Input readOnly value={construirUrl(token)} />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Copiar enlace"
                  onClick={handleCopiar}
                >
                  <CopySimpleIcon aria-hidden />
                </Button>
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={cargando}
                  onClick={handleRegenerar}
                >
                  <ArrowsClockwiseIcon aria-hidden />
                  Generar un enlace nuevo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  loading={cargando}
                  onClick={handleRevocar}
                >
                  <LinkBreakIcon aria-hidden />
                  Dejar de compartir
                </Button>
              </div>
            </>
          ) : (
            <Button type="button" loading={cargando} onClick={handleGenerar}>
              <LinkIcon aria-hidden />
              Generar enlace
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
