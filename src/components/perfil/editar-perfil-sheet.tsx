"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PencilSimpleIcon } from "@phosphor-icons/react";

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

type EditarPerfilSheetProps = {
  perfilId: string;
  perfil: { nombre: string; usuario: string; carrera: string | null };
};

export function EditarPerfilSheet({
  perfilId,
  perfil,
}: EditarPerfilSheetProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState(perfil.nombre);
  const [usuario, setUsuario] = useState(perfil.usuario);
  const [carrera, setCarrera] = useState(perfil.carrera ?? "");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setCargando(true);

    const supabase = createClient();
    const { error: dbError } = await supabase
      .from("profiles")
      .update({ nombre, usuario, carrera: carrera || null })
      .eq("id", perfilId);

    setCargando(false);

    if (dbError) {
      setError(
        dbError.code === "23505"
          ? "Ese nombre de usuario ya está en uso."
          : "No se pudo guardar los cambios. Intenta de nuevo.",
      );
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline">
            <PencilSimpleIcon aria-hidden />
            Editar perfil
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
          <SheetTitle>Edita tu perfil</SheetTitle>
          <SheetDescription>
            La universidad queda fija, no se puede cambiar.
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
            <Label htmlFor="perfil-nombre">Nombre</Label>
            <Input
              id="perfil-nombre"
              required
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="perfil-usuario">Usuario</Label>
            <Input
              id="perfil-usuario"
              required
              value={usuario}
              onChange={(event) => setUsuario(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="perfil-carrera">Carrera</Label>
            <Input
              id="perfil-carrera"
              value={carrera}
              onChange={(event) => setCarrera(event.target.value)}
            />
          </div>

          <SheetFooter className="p-0">
            <Button type="submit" loading={cargando}>
              Guardar cambios
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
