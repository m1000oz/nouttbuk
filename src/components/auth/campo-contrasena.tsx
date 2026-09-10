"use client";

import { useId, useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CampoContrasenaProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  required?: boolean;
  disabled?: boolean;
  error?: string | null;
};

export function CampoContrasena({
  id,
  label,
  value,
  onChange,
  autoComplete,
  required,
  disabled,
  error,
}: CampoContrasenaProps) {
  const [mostrar, setMostrar] = useState(false);
  const errorId = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={mostrar ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="pr-9"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={disabled}
          onClick={() => setMostrar((valor) => !valor)}
          aria-label={mostrar ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={mostrar}
          className="absolute top-1/2 right-1 -translate-y-1/2"
        >
          {mostrar ? <EyeSlashIcon aria-hidden /> : <EyeIcon aria-hidden />}
        </Button>
      </div>
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
