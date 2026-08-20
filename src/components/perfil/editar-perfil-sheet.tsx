"use client";

import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraIcon, PencilSimpleIcon } from "@phosphor-icons/react";

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
import { buscarPerfilPorUsuario } from "@/lib/colaboradores/consultas";
import { cn } from "@/lib/utils";

const TAMANO_MAXIMO_AVATAR = 5 * 1024 * 1024;
const DIAS_ESPERA_CAMBIO_USUARIO = 7;

function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function diasRestantes(usuarioActualizadoEn: string | null): number {
  if (!usuarioActualizadoEn) return 0;
  const transcurridoMs = Date.now() - new Date(usuarioActualizadoEn).getTime();
  const restanteMs =
    DIAS_ESPERA_CAMBIO_USUARIO * 24 * 60 * 60 * 1000 - transcurridoMs;
  return Math.max(0, Math.ceil(restanteMs / (24 * 60 * 60 * 1000)));
}

type EditarPerfilSheetProps = {
  perfilId: string;
  perfil: {
    nombre: string;
    usuario: string;
    carrera: string | null;
    avatarUrl: string | null;
    usuarioActualizadoEn: string | null;
  };
};

export function EditarPerfilSheet({
  perfilId,
  perfil,
}: EditarPerfilSheetProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState(perfil.nombre);
  const [usuario, setUsuario] = useState(perfil.usuario);
  const [carrera, setCarrera] = useState(perfil.carrera ?? "");
  const [avatarUrl, setAvatarUrl] = useState(perfil.avatarUrl);
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  // Guarda el resultado del último chequeo async junto con el valor que se
  // consultó, en vez de un estado "verificando/disponible/en_uso" propio:
  // así el efecto nunca llama a setState de forma síncrona en su cuerpo (eso
  // dispara un render en cascada), solo dentro del callback async del
  // debounce. "disponibilidad" más abajo se deriva comparando el valor
  // actual del input contra el valor consultado.
  const [resultado, setResultado] = useState<{
    usuario: string;
    disponible: boolean;
  } | null>(null);

  const restantes = diasRestantes(perfil.usuarioActualizadoEn);
  const usuarioBloqueado = restantes > 0;
  const valorUsuario = usuario.trim();
  const mostrarChequeo =
    !usuarioBloqueado && valorUsuario !== "" && valorUsuario !== perfil.usuario;
  const chequeoListo = resultado?.usuario === valorUsuario;
  const disponibilidad: "verificando" | "disponible" | "en_uso" | null =
    !mostrarChequeo
      ? null
      : !chequeoListo
        ? "verificando"
        : resultado.disponible
          ? "disponible"
          : "en_uso";

  // Chequeo de disponibilidad en vivo con debounce: solo tiene sentido si el
  // usuario realmente cambió el campo (si no, buscarPerfilPorUsuario siempre
  // lo encontraría a él mismo).
  useEffect(() => {
    if (!mostrarChequeo) return;

    debounceRef.current = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await buscarPerfilPorUsuario(supabase, valorUsuario);
      setResultado({
        usuario: valorUsuario,
        disponible: !data || data.id === perfilId,
      });
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [valorUsuario, mostrarChequeo, perfilId]);

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0];
    event.target.value = "";
    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      setError("La foto debe ser una imagen.");
      return;
    }
    if (archivo.size > TAMANO_MAXIMO_AVATAR) {
      setError("La imagen no puede pesar más de 5 MB.");
      return;
    }

    setError(null);
    setSubiendoAvatar(true);

    const supabase = createClient();
    const extension = archivo.name.split(".").pop() ?? "jpg";
    const ruta = `${perfilId}/avatar.${extension}`;

    const { error: subidaError } = await supabase.storage
      .from("avatars")
      .upload(ruta, archivo, { upsert: true });

    if (subidaError) {
      setSubiendoAvatar(false);
      setError("No se pudo subir la foto. Intenta de nuevo.");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(ruta);
    // Cache-buster: la ruta del objeto es siempre la misma
    // ({perfilId}/avatar.ext), así que sin esto el navegador podría seguir
    // mostrando la imagen anterior servida desde caché tras un re-upload.
    const urlConVersion = `${publicUrl}?v=${Date.now()}`;

    const { error: dbError } = await supabase
      .from("profiles")
      .update({ avatar_url: urlConVersion })
      .eq("id", perfilId);

    setSubiendoAvatar(false);

    if (dbError) {
      setError("No se pudo guardar la foto. Intenta de nuevo.");
      return;
    }

    setAvatarUrl(urlConVersion);
    router.refresh();
  }

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
      if (dbError.code === "23505") {
        setError("Ese nombre de usuario ya está en uso.");
      } else if (dbError.code === "23514") {
        setError("Solo puedes cambiar tu usuario una vez cada 7 días.");
      } else {
        setError("No se pudo guardar los cambios. Intenta de nuevo.");
      }
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

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={subiendoAvatar}
              aria-label="Cambiar foto de perfil"
              className="group relative rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Avatar size="lg">
                {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
                <AvatarFallback>{iniciales(nombre)}</AvatarFallback>
              </Avatar>
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <CameraIcon className="size-4 text-white" aria-hidden />
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

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
              disabled={usuarioBloqueado}
              value={usuario}
              onChange={(event) => setUsuario(event.target.value)}
            />
            {usuarioBloqueado ? (
              <p className="text-xs text-muted-foreground">
                Podrás cambiar tu usuario en{" "}
                {restantes === 1 ? "1 día" : `${restantes} días`}.
              </p>
            ) : (
              disponibilidad && (
                <p
                  className={cn(
                    "text-xs",
                    disponibilidad === "en_uso"
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {disponibilidad === "verificando" && "Verificando disponibilidad…"}
                  {disponibilidad === "disponible" && "Usuario disponible."}
                  {disponibilidad === "en_uso" && "Ese usuario ya está en uso."}
                </p>
              )
            )}
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
            <Button
              type="submit"
              loading={cargando}
              disabled={disponibilidad === "en_uso"}
            >
              Guardar cambios
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
