"use client";

import { type FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { mapearErrorAuth } from "@/lib/auth/mapear-error-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginFormProps = {
  onSuccess: () => void;
  onIrARecuperar: () => void;
};

export function LoginForm({ onSuccess, onIrARecuperar }: LoginFormProps) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setCargando(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: correo,
      password: contrasena,
    });

    setCargando(false);

    if (authError) {
      setError(mapearErrorAuth(authError).mensaje);
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
        <Label htmlFor="login-correo">Correo institucional</Label>
        <Input
          id="login-correo"
          type="email"
          autoComplete="email"
          required
          value={correo}
          onChange={(event) => setCorreo(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-contrasena">Contraseña</Label>
        <Input
          id="login-contrasena"
          type="password"
          autoComplete="current-password"
          required
          value={contrasena}
          onChange={(event) => setContrasena(event.target.value)}
        />
      </div>
      <button
        type="button"
        onClick={onIrARecuperar}
        className="self-start text-sm text-primary hover:underline"
      >
        ¿Olvidaste tu contraseña?
      </button>
      <Button type="submit" loading={cargando} className="mt-2">
        Iniciar sesión
      </Button>
    </form>
  );
}
