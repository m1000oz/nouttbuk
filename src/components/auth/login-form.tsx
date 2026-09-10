"use client";

import { type FormEvent, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { mapearErrorAuth } from "@/lib/auth/mapear-error-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CampoContrasena } from "@/components/auth/campo-contrasena";
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@/components/auth/turnstile-widget";

type LoginFormProps = {
  onSuccess: () => void;
  onIrARecuperar: () => void;
};

export function LoginForm({ onSuccess, onIrARecuperar }: LoginFormProps) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  // Mientras no haya un site key configurado (CAPTCHA todavía apagado en
  // supabase/config.toml, ver esa nota), el widget ni siquiera se renderiza,
  // así que no tiene sentido bloquear el submit esperando un token que
  // nunca va a llegar. Una vez activado el CAPTCHA de verdad, esto empieza
  // a exigirlo.
  const captchaRequerido = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setCargando(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: correo,
      password: contrasena,
      options: { captchaToken: captchaToken ?? undefined },
    });

    setCargando(false);

    if (authError) {
      setError(mapearErrorAuth(authError).mensaje);
      // El token de Turnstile es de un solo uso: sin resetear el widget,
      // un segundo intento reenviaría un token ya consumido y GoTrue lo
      // rechazaría aunque la persona haya vuelto a resolver el desafío.
      turnstileRef.current?.reset();
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
          disabled={cargando}
          value={correo}
          onChange={(event) => setCorreo(event.target.value)}
        />
      </div>
      <CampoContrasena
        id="login-contrasena"
        label="Contraseña"
        value={contrasena}
        onChange={setContrasena}
        autoComplete="current-password"
        required
        disabled={cargando}
      />
      <button
        type="button"
        onClick={onIrARecuperar}
        className="cursor-pointer self-start text-sm text-primary hover:underline"
      >
        ¿Olvidaste tu contraseña?
      </button>
      <TurnstileWidget ref={turnstileRef} onTokenChange={setCaptchaToken} />
      <Button
        type="submit"
        loading={cargando}
        disabled={captchaRequerido && !captchaToken}
        className="mt-2"
      >
        Iniciar sesión
      </Button>
    </form>
  );
}
