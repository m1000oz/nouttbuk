"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { buscarPerfilPorUsuario } from "@/lib/colaboradores/consultas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { toast } from "@/components/ui/toast";

type CompletarPerfilFormProps = {
  perfilId: string;
  nombreInicial: string;
  usuarioInicial: string;
  carreras: { id: string; nombre: string }[];
};

export function CompletarPerfilForm({
  perfilId,
  nombreInicial,
  usuarioInicial,
  carreras,
}: CompletarPerfilFormProps) {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [nombre, setNombre] = useState(nombreInicial);
  const [usuario, setUsuario] = useState(usuarioInicial);
  const [carreraId, setCarreraId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  // Mismo patrón que editar-perfil-sheet.tsx: se guarda el resultado del
  // último chequeo async junto con el valor consultado, en vez de un estado
  // "verificando/disponible/en_uso" propio, para que el efecto nunca llame a
  // setState de forma síncrona en su cuerpo.
  const [resultado, setResultado] = useState<{
    usuario: string;
    disponible: boolean;
  } | null>(null);

  const valorUsuario = usuario.trim();
  // Si `usuarioInicial` ya venía precargado (el caso "solo falta el
  // nombre"), no tiene sentido chequear disponibilidad contra uno mismo, ni
  // mostrar "verificando" con el campo intacto.
  const mostrarChequeo = valorUsuario !== "" && valorUsuario !== usuarioInicial;
  const chequeoListo = resultado?.usuario === valorUsuario;
  const disponibilidad: "verificando" | "disponible" | "en_uso" | null =
    !mostrarChequeo
      ? null
      : !chequeoListo
        ? "verificando"
        : resultado.disponible
          ? "disponible"
          : "en_uso";

  useEffect(() => {
    if (!mostrarChequeo) return;

    debounceRef.current = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await buscarPerfilPorUsuario(supabase, valorUsuario);
      setResultado({
        usuario: valorUsuario,
        // Excluye al propio perfil: alguien que vuelve a escribir su propio
        // usuario ya asignado no debería chocar contra sí mismo.
        disponible: !data || data.id === perfilId,
      });
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [valorUsuario, mostrarChequeo, perfilId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setCargando(true);

    const supabase = createClient();
    const { error: dbError } = await supabase
      .from("profiles")
      .update({ nombre, usuario: valorUsuario, carrera_id: carreraId })
      .eq("id", perfilId);

    setCargando(false);

    if (dbError) {
      if (dbError.code === "23505") {
        setError("Ese nombre de usuario ya está en uso.");
      } else {
        setError("No se pudo guardar tu perfil. Intenta de nuevo.");
      }
      return;
    }

    toast.add({ title: "Perfil actualizado.", type: "success" });
    router.push("/perfil");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="completar-nombre">Nombre</Label>
        <Input
          id="completar-nombre"
          required
          placeholder="Tu nombre completo"
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="completar-usuario">Usuario</Label>
        <Input
          id="completar-usuario"
          required
          placeholder="Elige un nombre de usuario"
          value={usuario}
          onChange={(event) => setUsuario(event.target.value)}
        />
        {disponibilidad && (
          <p
            className={
              disponibilidad === "en_uso"
                ? "text-xs text-destructive"
                : "text-xs text-muted-foreground"
            }
          >
            {disponibilidad === "verificando" && "Verificando disponibilidad…"}
            {disponibilidad === "disponible" && "Usuario disponible."}
            {disponibilidad === "en_uso" && "Ese usuario ya está en uso."}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="completar-carrera">Carrera</Label>
        <Select
          value={carreraId ?? "__ninguna__"}
          onValueChange={(valor) =>
            setCarreraId(valor === "__ninguna__" ? null : valor)
          }
          items={{
            __ninguna__: "Sin especificar",
            ...Object.fromEntries(
              carreras.map((carreraOpcion) => [
                carreraOpcion.id,
                carreraOpcion.nombre,
              ]),
            ),
          }}
        >
          <SelectTrigger id="completar-carrera" className="w-full">
            <SelectValue placeholder="Carrera" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__ninguna__">Sin especificar</SelectItem>
            {carreras.map((carreraOpcion) => (
              <SelectItem key={carreraOpcion.id} value={carreraOpcion.id}>
                {carreraOpcion.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        loading={cargando}
        disabled={disponibilidad === "en_uso" || disponibilidad === "verificando"}
      >
        Guardar y continuar
      </Button>

      <SignOutButton variant="ghost" size="sm" className="self-center" />
    </form>
  );
}
