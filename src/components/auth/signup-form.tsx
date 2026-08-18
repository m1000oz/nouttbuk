"use client";

import { type FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import {
  esCorreoInstitucionalValido,
  MENSAJE_DOMINIO_INVALIDO,
} from "@/lib/auth/dominio-institucional";
import { mapearErrorAuth } from "@/lib/auth/mapear-error-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignupFormProps = {
  onSuccess: () => void;
  onIrALogin: () => void;
};

export function SignupForm({ onSuccess, onIrALogin }: SignupFormProps) {
  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [carrera, setCarrera] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [correoError, setCorreoError] = useState<string | null>(null);
  const [mostrarLinkLogin, setMostrarLinkLogin] = useState(false);
  const [cargando, setCargando] = useState(false);

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
        data: { nombre, usuario, carrera: carrera || null },
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
        <Input
          id="signup-carrera"
          value={carrera}
          onChange={(event) => setCarrera(event.target.value)}
        />
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
