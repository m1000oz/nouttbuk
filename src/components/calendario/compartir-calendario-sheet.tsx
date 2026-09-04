"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ShareNetworkIcon, XIcon } from "@phosphor-icons/react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { buscarPerfilPorUsuario } from "@/lib/colaboradores/consultas";
import type { ConQuienComparoRow } from "@/lib/calendario/consultas";

type CompartirCalendarioSheetProps = {
  perfilId: string;
  conQuienComparto: ConQuienComparoRow[];
};

function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Mismo patrón de invitar-por-usuario que CompartirSheet de apuntes
// (src/components/apuntes/compartir-sheet.tsx), sin niveles de permiso: acá
// solo existe "puede ver mis bloques para calcular cruces de horario" o no.
export function CompartirCalendarioSheet({
  perfilId,
  conQuienComparto,
}: CompartirCalendarioSheetProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [invitando, setInvitando] = useState(false);
  const [idsEnCurso, setIdsEnCurso] = useState<Set<string>>(new Set());

  async function handleInvitar(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInvitando(true);

    const supabase = createClient();
    const usuarioLimpio = usuario.trim();

    const { data: perfil, error: buscarError } = await buscarPerfilPorUsuario(
      supabase,
      usuarioLimpio,
    );

    if (buscarError) {
      setInvitando(false);
      setError("No se pudo buscar ese usuario. Intenta de nuevo.");
      return;
    }

    if (!perfil) {
      setInvitando(false);
      setError("No se encontró ningún estudiante con ese usuario.");
      return;
    }

    if (perfil.id === perfilId) {
      setInvitando(false);
      setError("No puedes compartir tu calendario contigo mismo.");
      return;
    }

    const { error: dbError } = await supabase
      .from("calendario_colaboradores")
      .upsert(
        { propietario_id: perfilId, colaborador_id: perfil.id },
        { onConflict: "propietario_id,colaborador_id" },
      );

    setInvitando(false);

    if (dbError) {
      setError("No se pudo compartir tu calendario. Intenta de nuevo.");
      return;
    }

    setUsuario("");
    toast.add({
      title: `Compartiste tu calendario con ${perfil.nombre}.`,
      type: "success",
    });
    router.refresh();
  }

  async function handleQuitar(colaboradorId: string) {
    setIdsEnCurso((actual) => new Set(actual).add(colaboradorId));

    const supabase = createClient();
    const { error: dbError } = await supabase
      .from("calendario_colaboradores")
      .delete()
      .eq("propietario_id", perfilId)
      .eq("colaborador_id", colaboradorId);

    setIdsEnCurso((actual) => {
      const siguiente = new Set(actual);
      siguiente.delete(colaboradorId);
      return siguiente;
    });

    if (dbError) {
      toast.add({ title: "No se pudo quitar el acceso.", type: "error" });
      return;
    }

    toast.add({ title: "Acceso revocado.", type: "success" });
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button type="button" variant="outline">
            <ShareNetworkIcon aria-hidden />
            Compartir mi calendario
          </Button>
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
          <SheetTitle>Comparte tu calendario</SheetTitle>
          <SheetDescription>
            Invita a otros estudiantes por su nombre de usuario para calcular
            en qué horarios pueden reunirse.
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

          {conQuienComparto.length > 0 && (
            <ul className="flex flex-col gap-2">
              {conQuienComparto.map((fila) => {
                const enCurso = idsEnCurso.has(fila.colaborador_id);
                return (
                  <li
                    key={fila.colaborador_id}
                    className="flex items-center gap-2.5"
                  >
                    <Avatar size="sm">
                      {fila.colaborador?.avatar_url && (
                        <AvatarImage src={fila.colaborador.avatar_url} alt="" />
                      )}
                      <AvatarFallback>
                        {iniciales(fila.colaborador?.nombre ?? "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {fila.colaborador?.nombre ?? "Usuario eliminado"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        @{fila.colaborador?.usuario ?? "—"}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Quitar acceso"
                      disabled={enCurso}
                      onClick={() => handleQuitar(fila.colaborador_id)}
                    >
                      <XIcon aria-hidden />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}

          <form
            onSubmit={handleInvitar}
            className="flex flex-col gap-3 border-t border-border pt-3"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="calendario-usuario">Usuario</Label>
              <Input
                id="calendario-usuario"
                required
                placeholder="nombre.usuario"
                value={usuario}
                onChange={(event) => setUsuario(event.target.value)}
              />
            </div>
            <SheetFooter className="p-0">
              <Button type="submit" loading={invitando}>
                Compartir
              </Button>
            </SheetFooter>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
