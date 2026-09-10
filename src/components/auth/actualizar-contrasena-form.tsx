"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { CampoContrasena } from "@/components/auth/campo-contrasena";
import { Button } from "@/components/ui/button";

export function ActualizarContrasenaForm() {
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [listo, setListo] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (contrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (contrasena !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({
      password: contrasena,
    });
    setCargando(false);

    if (authError) {
      setError(
        "No pudimos actualizar tu contraseña. Vuelve a solicitar el enlace de recuperación e inténtalo de nuevo.",
      );
      return;
    }

    setListo(true);
  }

  if (listo) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-sm text-foreground">
          Tu contraseña se actualizó correctamente.
        </p>
        <Button nativeButton={false} render={<Link href="/perfil" />}>
          Ir a mi perfil
        </Button>
      </div>
    );
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
      <CampoContrasena
        id="nueva-contrasena"
        label="Nueva contraseña"
        value={contrasena}
        onChange={(valor) => {
          setContrasena(valor);
          setError(null);
        }}
        autoComplete="new-password"
        required
        disabled={cargando}
      />
      <CampoContrasena
        id="confirmar-contrasena"
        label="Confirma tu nueva contraseña"
        value={confirmar}
        onChange={(valor) => {
          setConfirmar(valor);
          setError(null);
        }}
        autoComplete="new-password"
        required
        disabled={cargando}
      />
      <Button type="submit" loading={cargando}>
        Guardar nueva contraseña
      </Button>
    </form>
  );
}
