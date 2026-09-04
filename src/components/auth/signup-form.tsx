"use client";

import { type FormEvent, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import {
  esCorreoInstitucionalValido,
  MENSAJE_DOMINIO_INVALIDO,
} from "@/lib/auth/dominio-institucional";
import { mapearErrorAuth } from "@/lib/auth/mapear-error-auth";
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

type SignupFormProps = {
  onSuccess: () => void;
  onIrALogin: () => void;
};

type Carrera = { id: string; nombre: string };

export function SignupForm({ onSuccess, onIrALogin }: SignupFormProps) {
  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [carreraId, setCarreraId] = useState<string | null>(null);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [correoError, setCorreoError] = useState<string | null>(null);
  const [mostrarLinkLogin, setMostrarLinkLogin] = useState(false);
  const [cargando, setCargando] = useState(false);

  // Catálogo real de carreras PUCP, público (RLS anon), se carga al montar el
  // formulario en vez de pasarse como prop: el modal de auth no tiene un
  // punto de entrada Server Component desde donde traerlo.
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("carreras")
      .select("id, nombre")
      .order("nombre")
      .then(({ data }) => setCarreras(data ?? []));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setCorreoError(null);
    setMostrarLinkLogin(false);

    if (!esCorreoInstitucionalValido(correo)) {
      setCorreoError(MENSAJE_DOMINIO_INVALIDO);
      return;
    }

    setCargando(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email: correo,
      password: contrasena,
      options: {
        data: { nombre, usuario, carrera_id: carreraId },
      },
    });

    setCargando(false);

    if (authError) {
      const resultado = mapearErrorAuth(authError);
      if (resultado.tipo === "dominio") {
        setCorreoError(resultado.mensaje);
      } else if (resultado.tipo === "duplicado") {
        setCorreoError(resultado.mensaje);
        setMostrarLinkLogin(true);
      } else {
        setError(resultado.mensaje);
      }
      return;
    }

    onSuccess();
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
        <Label htmlFor="signup-nombre">Nombre</Label>
        <Input
          id="signup-nombre"
          required
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-usuario">Usuario</Label>
        <Input
          id="signup-usuario"
          required
          value={usuario}
          onChange={(event) => setUsuario(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-carrera">Carrera</Label>
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
          <SelectTrigger id="signup-carrera" className="w-full">
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
        <p className="text-xs text-muted-foreground">
          Podrás cambiar tu carrera una vez cada 30 días desde tu perfil.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-universidad">Universidad</Label>
        <Input
          id="signup-universidad"
          value="Pontificia Universidad Católica del Perú"
          disabled
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-correo">Correo institucional</Label>
        <Input
          id="signup-correo"
          type="email"
          autoComplete="email"
          required
          value={correo}
          onChange={(event) => {
            setCorreo(event.target.value);
            setCorreoError(null);
            setMostrarLinkLogin(false);
          }}
          aria-invalid={Boolean(correoError)}
        />
        {correoError && (
          <p className="text-sm text-destructive">
            {correoError}
            {mostrarLinkLogin && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={onIrALogin}
                  className="underline hover:text-foreground"
                >
                  Inicia sesión
                </button>
              </>
            )}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-contrasena">Contraseña</Label>
        <Input
          id="signup-contrasena"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={contrasena}
          onChange={(event) => setContrasena(event.target.value)}
        />
      </div>
      <Button type="submit" loading={cargando} className="mt-2">
        Crear cuenta
      </Button>
    </form>
  );
}
