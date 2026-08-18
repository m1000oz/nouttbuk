"use client";

import { type FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import {
  esCorreoInstitucionalValido,
  MENSAJE_DOMINIO_INVALIDO,
} from "@/lib/auth/dominio-institucional";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RecuperarFormProps = {
  onVolver: () => void;
};

export function RecuperarForm({ onVolver }: RecuperarFormProps) {
  const [correo, setCorreo] = useState("");
  const [correoError, setCorreoError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!esCorreoInstitucionalValido(correo)) {
      setCorreoError(MENSAJE_DOMINIO_INVALIDO);
      return;
    }
    setCorreoError(null);
    setCargando(true);

    const supabase = createClient();
    // El resultado de esta llamada no se usa para decidir qué mostrar: la
    // confirmación es siempre la misma, exista o no la cuenta.
    await supabase.auth.resetPasswordForEmail(correo, {
      redirectTo: `${window.location.origin}/actualizar-contrasena`,
    });

    setCargando(false);
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-foreground">
          Si el correo está registrado, te enviamos un enlace para
          restablecer tu contraseña.
        </p>
        <Button type="button" variant="outline" onClick={onVolver}>
          Volver a iniciar sesión
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="recuperar-correo">Correo institucional</Label>
        <Input
          id="recuperar-correo"
          type="email"
          autoComplete="email"
          required
          value={correo}
          onChange={(event) => {
            setCorreo(event.target.value);
            setCorreoError(null);
          }}
          aria-invalid={Boolean(correoError)}
        />
        {correoError && (
          <p className="text-sm text-destructive">{correoError}</p>
        )}
      </div>
      <Button type="submit" loading={cargando} className="mt-2">
        Enviar enlace
      </Button>
      <button
        type="button"
        onClick={onVolver}
        className="text-sm text-primary hover:underline"
      >
        Volver a iniciar sesión
      </button>
    </form>
  );
}
