"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { FolderIcon, StarIcon } from "@phosphor-icons/react";

import { Card, CardContent } from "@/components/ui/card";
import { ApunteOpcionesMenu } from "@/components/apuntes/apunte-opciones-menu";
import { fechaRelativa } from "@/lib/fecha/relativa";
import { extraerTextoPlano } from "@/lib/tiptap/extraer-texto-plano";
import { resolverColorCarpeta } from "@/lib/carpetas/colores";
import type { Json } from "@/lib/types/database.types";
import type { ApunteVisibilidad } from "@/lib/types/enums";

type CarpetaOpcion = { id: string; nombre: string; color: string };

type ApunteTarjetaProps = {
  id: string;
  titulo: string;
  contenido: Json;
  updatedAt: string;
  carpetaId: string | null;
  carpeta?: { nombre: string; color: string } | null;
  favorito: boolean;
  visibilidad: ApunteVisibilidad;
  propietario?: string;
  carpetas: CarpetaOpcion[];
  index: number;
  // Tile más grande para "el apunte más reciente" en Inicio ("Continuar
  // donde lo dejaste"): mismo componente, no una tarjeta paralela, así
  // Inicio y Mis apuntes comparten el mismo diseño de tile. Ninguna pantalla
  // existente pasa este prop hoy, así que su render queda igual que antes.
  destacado?: boolean;
};

// Grid de galería en vez de barras horizontales (design.md ya pedía "grid de
// apuntes" para esta pantalla, el bar-style anterior era una desviación del
// propio spec). El botón de opciones vive fuera del <Link> (hermano, no
// descendiente) para no pelear con la navegación de la tarjeta al hacer
// click: al ser un nodo del DOM aparte, un click en el botón nunca hace
// bubbling hacia el <a> de al lado.
export function ApunteTarjeta({
  id,
  titulo,
  contenido,
  updatedAt,
  carpetaId,
  carpeta,
  favorito,
  visibilidad,
  propietario,
  carpetas,
  index,
  destacado = false,
}: ApunteTarjetaProps) {
  const prefiereMenosMovimiento = useReducedMotion();
  const esPropio = !propietario;
  const extracto = extraerTextoPlano(contenido, destacado ? 220 : 120);

  return (
    <div className="relative">
      <Link href={`/apuntes/${id}/editar`} className="block h-full">
        <motion.div
          className="h-full"
          initial={prefiereMenosMovimiento ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.2,
            ease: "easeOut",
            delay: prefiereMenosMovimiento ? 0 : index * 0.05,
          }}
          whileHover={prefiereMenosMovimiento ? undefined : { y: -2 }}
        >
          <Card className="relative h-full border border-border shadow-[var(--shadow-card)] ring-0">
            {/* Lomo de cuaderno anillado: color de la carpeta (o el color por
                defecto si no tiene carpeta, resolverColorCarpeta ya cubre
                ese caso) más anillas metálicas realistas. */}
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-3 border-r border-black/10 shadow-[inset_-1px_0_2px_rgba(0,0,0,0.1)]"
              style={{ backgroundColor: resolverColorCarpeta(carpeta?.color ?? null) }}
              aria-hidden
            >
              <div className="absolute inset-y-0 right-0 flex flex-col justify-evenly py-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="relative flex w-[14px] items-center">
                    {/* Hueco perforado en el lomo/hoja */}
                    <div className="absolute left-[4px] z-10 size-2.5 rounded-full bg-background shadow-[inset_0_2px_3px_rgba(0,0,0,0.5)]" />
                    {/* Anilla metálica que pasa por el hueco */}
                    <div className="absolute left-0 z-20 h-[4px] w-[13px] rounded-full border border-black/20 bg-gradient-to-b from-zinc-200 via-zinc-100 to-zinc-400 shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
                  </div>
                ))}
              </div>
            </div>

            <CardContent className="flex h-full flex-col gap-2 pl-7">
              {destacado && (
                <span className="text-xs font-medium text-primary">
                  Continuar donde lo dejaste
                </span>
              )}
              <div className="flex items-start justify-between gap-2 pr-6">
                <h3
                  className={
                    destacado
                      ? "line-clamp-2 text-base font-bold text-foreground"
                      : "line-clamp-2 text-sm font-semibold text-foreground"
                  }
                >
                  {titulo}
                </h3>
                {favorito && (
                  <StarIcon
                    weight="fill"
                    className="size-4 shrink-0 text-warning"
                    aria-hidden
                  />
                )}
              </div>

              {extracto && (
                <p
                  className={
                    destacado
                      ? "line-clamp-5 flex-1 text-xs text-muted-foreground"
                      : "line-clamp-3 flex-1 text-xs text-muted-foreground"
                  }
                >
                  {extracto}
                </p>
              )}

              <div className="flex items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
                {carpeta ? (
                  <span className="flex min-w-0 items-center gap-1">
                    <FolderIcon
                      weight="fill"
                      className="size-3.5 shrink-0"
                      style={{ color: resolverColorCarpeta(carpeta.color) }}
                      aria-hidden
                    />
                    <span className="truncate">{carpeta.nombre}</span>
                  </span>
                ) : (
                  <span />
                )}
                <span className="shrink-0">{fechaRelativa(updatedAt)}</span>
              </div>

              {propietario && (
                <span className="truncate text-xs text-muted-foreground">
                  Compartido por {propietario}
                </span>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </Link>

      <div className="absolute top-2 right-2">
        <ApunteOpcionesMenu
          apunteId={id}
          esPropio={esPropio}
          carpetaIdActual={carpetaId}
          visibilidadActual={visibilidad}
          carpetas={carpetas}
        />
      </div>
    </div>
  );
}
