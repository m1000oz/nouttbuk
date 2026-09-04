"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { UsersThreeIcon, XIcon } from "@phosphor-icons/react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  buscarPerfilPorUsuario,
  type ColaboradorRow,
} from "@/lib/colaboradores/consultas";

type CompartirSheetProps = {
  apunteId: string;
  colaboradores: ColaboradorRow[];
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

// El listado de colaboradores se recibe como prop desde el Server Component
// (fuente de verdad), sin duplicarlo en useState: cada mutación llama a
// router.refresh() y React vuelve a pasar el prop actualizado, sin el riesgo
// de estado local desincronizado que ya mordió al proyecto en otro sheet.
export function CompartirSheet({ apunteId, colaboradores }: CompartirSheetProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [puedeEditar, setPuedeEditar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitando, setInvitando] = useState(false);
  const [idsEnCurso, setIdsEnCurso] = useState<Set<string>>(new Set());

  async function handleInvitar(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInvitando(true);

    const supabase = createClient();
    const usuarioLimpio = usuario.trim();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setInvitando(false);
      setError("Tu sesión expiró. Vuelve a iniciar sesión.");
      return;
    }

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

    if (perfil.id === user.id) {
      setInvitando(false);
      setError("No puedes invitarte a ti mismo.");
      return;
    }

    const { error: dbError } = await supabase.from("colaboradores").upsert(
      {
        apunte_id: apunteId,
        perfil_id: perfil.id,
        permiso: puedeEditar ? "edit" : "read",
      },
      { onConflict: "apunte_id,perfil_id" },
    );

    setInvitando(false);

    if (dbError) {
      setError("No se pudo invitar a ese colaborador. Intenta de nuevo.");
      return;
    }

    setUsuario("");
    setPuedeEditar(false);
    toast.add({
      title: `Invitaste a ${perfil.nombre}.`,
      type: "success",
    });
    router.refresh();
  }

  async function handleCambiarPermiso(perfilId: string, editar: boolean) {
    setIdsEnCurso((actual) => new Set(actual).add(perfilId));

    const supabase = createClient();
    const { error } = await supabase
      .from("colaboradores")
      .update({ permiso: editar ? "edit" : "read" })
      .eq("apunte_id", apunteId)
      .eq("perfil_id", perfilId);

    setIdsEnCurso((actual) => {
      const siguiente = new Set(actual);
      siguiente.delete(perfilId);
      return siguiente;
    });
    if (error) {
      toast.add({ title: "No se pudo actualizar el permiso.", type: "error" });
      return;
    }
    toast.add({ title: "Permiso actualizado.", type: "success" });
    router.refresh();
  }

  async function handleQuitar(perfilId: string) {
    setIdsEnCurso((actual) => new Set(actual).add(perfilId));

    const supabase = createClient();
    const { error } = await supabase
      .from("colaboradores")
      .delete()
      .eq("apunte_id", apunteId)
      .eq("perfil_id", perfilId);

    setIdsEnCurso((actual) => {
      const siguiente = new Set(actual);
      siguiente.delete(perfilId);
      return siguiente;
    });
    if (error) {
      toast.add({ title: "No se pudo quitar al colaborador.", type: "error" });
      return;
    }
    toast.add({ title: "Colaborador eliminado.", type: "success" });
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <UsersThreeIcon aria-hidden />
            Invitar colaborador
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
          <SheetTitle>Comparte este apunte</SheetTitle>
          <SheetDescription>
            Invita a otros estudiantes por su nombre de usuario y decide si
            pueden editar.
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

          {colaboradores.length > 0 && (
            <ul className="flex flex-col gap-2">
              {colaboradores.map((colaborador) => {
                const enCurso = idsEnCurso.has(colaborador.perfil_id);
                return (
                  <li
                    key={colaborador.perfil_id}
                    className="flex items-center gap-2.5"
                  >
                    <Avatar size="sm">
                      {colaborador.perfil?.avatar_url && (
                        <AvatarImage
                          src={colaborador.perfil.avatar_url}
                          alt=""
                        />
                      )}
                      <AvatarFallback>
                        {iniciales(colaborador.perfil?.nombre ?? "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {colaborador.perfil?.nombre ?? "Usuario eliminado"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        @{colaborador.perfil?.usuario ?? "—"}
                      </span>
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Checkbox
                        checked={colaborador.permiso === "edit"}
                        disabled={enCurso}
                        onCheckedChange={(checked) =>
                          handleCambiarPermiso(colaborador.perfil_id, checked)
                        }
                      />
                      Puede editar
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Quitar colaborador"
                      disabled={enCurso}
                      onClick={() => handleQuitar(colaborador.perfil_id)}
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
              <Label htmlFor="compartir-usuario">Usuario</Label>
              <Input
                id="compartir-usuario"
                required
                placeholder="nombre.usuario"
                value={usuario}
                onChange={(event) => setUsuario(event.target.value)}
              />
            </div>

            <label className="flex items-center gap-1.5 text-sm text-foreground">
              <Checkbox
                checked={puedeEditar}
                onCheckedChange={setPuedeEditar}
              />
              Puede editar
            </label>

            <SheetFooter className="p-0">
              <Button type="submit" loading={invitando}>
                Invitar
              </Button>
            </SheetFooter>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
