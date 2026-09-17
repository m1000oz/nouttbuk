"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import {
  esCorreoInstitucionalValido,
  MENSAJE_DOMINIO_INVALIDO,
} from "@/lib/auth/dominio-institucional";
import { mapearErrorAuth, MENSAJE_CUENTA_DUPLICADA } from "@/lib/auth/mapear-error-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CampoContrasena } from "@/components/auth/campo-contrasena";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@/components/auth/turnstile-widget";

type SignupFormProps = {
  onSuccess: () => void;
  onIrALogin: () => void;
};

type Carrera = { id: string; nombre: string };

export function SignupForm({ onSuccess, onIrALogin }: SignupFormProps) {
  const [paso, setPaso] = useState<"datos" | "verificar">("datos");
  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [carreraId, setCarreraId] = useState<string | null>(null);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [correoError, setCorreoError] = useState<string | null>(null);
  const [contrasenaError, setContrasenaError] = useState<string | null>(null);
  const [mostrarLinkLogin, setMostrarLinkLogin] = useState(false);
  const [cargando, setCargando] = useState(false);

  // Estado del paso de verificación: distinto código/error/loading del
  // formulario de datos, porque conviven en la misma sesión del componente
  // (volver de "verificar" a "datos" no debe perder lo que la persona ya
  // escribió arriba, ver handleVolver).
  const [codigo, setCodigo] = useState("");
  const [codigoError, setCodigoError] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [reenvioMensaje, setReenvioMensaje] = useState<string | null>(null);

  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const captchaRequerido = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

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
    setContrasenaError(null);
    setMostrarLinkLogin(false);

    if (!esCorreoInstitucionalValido(correo)) {
      setCorreoError(MENSAJE_DOMINIO_INVALIDO);
      return;
    }

    if (contrasena.length < 8) {
      setContrasenaError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setCargando(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email: correo,
      password: contrasena,
      options: {
        data: { nombre, usuario, carrera_id: carreraId },
        captchaToken: captchaToken ?? undefined,
      },
    });

    setCargando(false);
    turnstileRef.current?.reset();

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

    // Para una cuenta ya existente y confirmada, GoTrue no devuelve un
    // error: por diseño (evitar que alguien enumere correos registrados)
    // responde con un usuario "ofuscado", sin sesión, pero con
    // `identities: []` (ninguna identidad real asociada). Sin este chequeo,
    // el código de abajo trataba esa respuesta igual que un registro nuevo
    // y avanzaba a "verificar código" aunque GoTrue nunca envió nada,
    // exactamente el bug reportado: sin alerta y sin correo.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setCorreoError(MENSAJE_CUENTA_DUPLICADA);
      setMostrarLinkLogin(true);
      return;
    }

    // A diferencia de Google (donde PUCP/Google Workspace ya verificó la
    // cuenta), un registro con correo/contraseña nunca prueba que la
    // persona controla esa casilla, solo que el dominio coincide con
    // @pucp.edu.pe. Con `enable_confirmations = true`, signUp() no
    // devuelve sesión hasta que se confirme el código de 6 dígitos que
    // GoTrue ya envió por correo (confirmation.html): se pasa al paso de
    // verificación en vez de cerrar el modal.
    if (!data.session) {
      setPaso("verificar");
      return;
    }

    onSuccess();
  }

  async function handleVerificarCodigo(event: FormEvent) {
    event.preventDefault();
    setCodigoError(null);
    setReenvioMensaje(null);
    setVerificando(true);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: correo,
      token: codigo,
      type: "signup",
    });

    setVerificando(false);

    if (verifyError) {
      setCodigoError(mapearErrorAuth(verifyError).mensaje);
      return;
    }

    onSuccess();
  }

  async function handleReenviarCodigo() {
    setCodigoError(null);
    setReenvioMensaje(null);
    setReenviando(true);

    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: correo,
      options: { captchaToken: captchaToken ?? undefined },
    });

    setReenviando(false);
    turnstileRef.current?.reset();

    if (resendError) {
      setCodigoError(mapearErrorAuth(resendError).mensaje);
      return;
    }

    setReenvioMensaje("Te enviamos un nuevo código a tu correo.");
  }

  function handleVolver() {
    setPaso("datos");
    setCodigo("");
    setCodigoError(null);
    setReenvioMensaje(null);
  }

  if (paso === "verificar") {
    return (
      <form onSubmit={handleVerificarCodigo} className="flex flex-col gap-4">
        <p className="text-sm text-foreground">
          Te enviamos un código de 6 dígitos a <strong>{correo}</strong>.
          Ingrésalo para activar tu cuenta.
        </p>
        {codigoError && (
          <p role="alert" className="text-sm text-destructive">
            {codigoError}
          </p>
        )}
        {reenvioMensaje && (
          <p className="text-sm text-muted-foreground">{reenvioMensaje}</p>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="signup-codigo">Código de verificación</Label>
          <Input
            id="signup-codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            disabled={verificando}
            value={codigo}
            onChange={(event) =>
              setCodigo(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            aria-invalid={Boolean(codigoError)}
            className="text-center text-lg tracking-[0.3em]"
          />
        </div>
        <TurnstileWidget ref={turnstileRef} onTokenChange={setCaptchaToken} />
        <Button
          type="submit"
          loading={verificando}
          disabled={codigo.length !== 6}
        >
          Verificar
        </Button>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <button
            type="button"
            onClick={handleVolver}
            className="cursor-pointer underline hover:text-foreground"
          >
            Usar otro correo
          </button>
          <button
            type="button"
            onClick={handleReenviarCodigo}
            disabled={reenviando || (captchaRequerido && !captchaToken)}
            className="cursor-pointer underline hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reenviando ? "Reenviando…" : "Reenviar código"}
          </button>
        </div>
      </form>
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
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-nombre">Nombre</Label>
        <Input
          id="signup-nombre"
          required
          disabled={cargando}
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-usuario">Usuario</Label>
        <Input
          id="signup-usuario"
          required
          disabled={cargando}
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
          disabled={cargando}
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
          disabled={cargando}
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
                  className="cursor-pointer underline hover:text-foreground"
                >
                  Inicia sesión
                </button>
              </>
            )}
          </p>
        )}
      </div>
      <CampoContrasena
        id="signup-contrasena"
        label="Contraseña"
        value={contrasena}
        onChange={(valor) => {
          setContrasena(valor);
          setContrasenaError(null);
        }}
        autoComplete="new-password"
        required
        disabled={cargando}
        error={contrasenaError}
      />
      <TurnstileWidget ref={turnstileRef} onTokenChange={setCaptchaToken} />
      <Button
        type="submit"
        loading={cargando}
        disabled={captchaRequerido && !captchaToken}
        className="mt-2"
      >
        Crear cuenta
      </Button>
    </form>
  );
}
