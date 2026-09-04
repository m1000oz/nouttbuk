"use client";

import Link from "next/link";
import { FileTextIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";

export function CvBoton() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/50 px-3 py-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileTextIcon className="size-4" aria-hidden />
        Arma tu CV con ayuda de IA y una plantilla lista para usar.
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<Link href="/cv" />}
      >
        Ir a CV
      </Button>
    </div>
  );
}
