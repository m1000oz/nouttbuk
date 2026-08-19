"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  BookmarkSimpleIcon,
  ChatCircleIcon,
  HeartIcon,
} from "@phosphor-icons/react";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fechaRelativa } from "@/lib/fecha/relativa";
import type { PublicacionCardData } from "@/lib/comunidad/consultas";

function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export type PublicacionCardProps = PublicacionCardData & { index: number };

export function PublicacionCard({
  id,
  titulo,
  extracto,
  createdAt,
  autor,
  conteos,
  index,
}: PublicacionCardProps) {
  const prefiereMenosMovimiento = useReducedMotion();

  return (
    <Link href={`/comunidad/${id}`} className="block">
      <motion.div
        initial={prefiereMenosMovimiento ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.2,
          ease: "easeOut",
          delay: prefiereMenosMovimiento ? 0 : index * 0.05,
        }}
        whileHover={prefiereMenosMovimiento ? undefined : { y: -2 }}
      >
        <Card className="border border-border shadow-[var(--shadow-card)] ring-0">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                {autor.avatarUrl && <AvatarImage src={autor.avatarUrl} alt="" />}
                <AvatarFallback>{iniciales(autor.nombre)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-foreground">
                  {autor.nombre}
                </span>
                <span className="text-xs text-muted-foreground">
                  {fechaRelativa(createdAt)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="line-clamp-1 text-base font-bold text-foreground">
                {titulo}
              </h3>
              {extracto && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {extracto}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <HeartIcon className="size-4" aria-hidden />
                {conteos.reacciones}
              </span>
              <span className="flex items-center gap-1">
                <ChatCircleIcon className="size-4" aria-hidden />
                {conteos.comentarios}
              </span>
              <span className="flex items-center gap-1">
                <BookmarkSimpleIcon className="size-4" aria-hidden />
                {conteos.guardados}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
