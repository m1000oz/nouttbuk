"use client";

import Link from "next/link";
import { UsersThreeIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { NuevoApunteButton } from "@/components/nav/fab-nuevo-apunte";

// Client Component dedicado: Button (vía @base-ui/react/button) importa el
// ícono "plano" de @phosphor-icons/react, que no es RSC-safe (crea contexto
// de React al evaluarse). Siempre se había usado desde archivos que ya eran
// "use client" (login-form.tsx, app-shell.tsx); Inicio es la primera vez que
// se necesitaría directo desde un Server Component, así que se centraliza
// aquí en vez de romper ese límite en la propia page.tsx.

export function AccesosRapidos() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
        <UsersThreeIcon aria-hidden />
        Ver comunidad
      </Button>
    </div>
  );
}

export function AccionVerApuntes() {
  return (
    <Button
      variant="outline"
      size="sm"
      nativeButton={false}
      render={<Link href="/apuntes" />}
    >
      Ver mis apuntes
    </Button>
  );
}

export function AccionNuevoApunte() {
  return <NuevoApunteButton variant="sidebar" />;
}
