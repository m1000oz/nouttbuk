"use client";

import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import {
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircleIcon,
  EyeIcon,
  GraduationCapIcon,
  HeadphonesIcon,
  SparkleIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NouttbukLogo, NouttbukIsotipo } from "@/components/brand";
import { cn } from "@/lib/utils";
import { fechaRelativa } from "@/lib/fecha/relativa";
import { crearExtensionesEsquema } from "@/lib/tiptap/extensiones-documento";
import { Paginacion } from "@/lib/tiptap/pagination-extension";
import { obtenerGeometriaConfiguracionPagina } from "@/lib/tiptap/configuracion-pagina";
import { HojasEditor } from "@/components/apuntes/hojas-editor";
import { useAuthGate } from "@/components/nav/auth-gate";
import type { Json } from "@/lib/types/database.types";
import type { PermisoColaborador } from "@/lib/types/enums";

const EXTENSIONES = [
  ...crearExtensionesEsquema({ enlaceClicable: true }),
  Paginacion.configure({ obtenerGeometria: obtenerGeometriaConfiguracionPagina }),
];

function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type Autor = { nombre: string; usuario: string; avatarUrl: string | null };

type ApunteCompartidoViewProps = {
  apunte: {
    titulo: string;
    contenido: Json;
    createdAt: string;
    cursoNombre: string | null;
    enlacePermiso: PermisoColaborador;
    autor: Autor;
  };
};

export function ApunteCompartidoView({ apunte }: ApunteCompartidoViewProps) {
  const { abrirLogin } = useAuthGate();

  const editor = useEditor({
    extensions: EXTENSIONES,
    content: apunte.contenido as object,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-content",
      },
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background selection:bg-teal-500/20">
      {/* Header Superior con Branding Oficial y Call-to-Actions */}
      <header className="flex items-center justify-between gap-3 border-b border-border/80 bg-background/95 px-4 py-2.5 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <NouttbukLogo href="/" variant="compact" size="sm" interactive />
          <span className="hidden h-4 w-px bg-border sm:inline-block" aria-hidden />
          <Badge
            variant="outline"
            className="hidden items-center gap-1.5 border-teal-500/30 bg-teal-500/10 px-2.5 py-0.5 text-xs font-semibold text-teal-700 dark:text-teal-300 sm:inline-flex"
          >
            <EyeIcon className="size-3.5" />
            Modo Lector
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={abrirLogin}
          >
            Iniciar sesión
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1.5 text-xs font-semibold shadow-sm bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white border-0"
            onClick={abrirLogin}
          >
            <SparkleIcon weight="fill" className="size-3.5" />
            Crear cuenta gratis
          </Button>
        </div>
      </header>

      {/* Contenido principal con scroll */}
      <div className="flex flex-1 flex-col overflow-y-auto pb-24">
        {/* Banner Publicitario y de Bienvenida Superior */}
        <div className="mx-auto w-full max-w-[840px] px-4 pt-6 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-indigo-500/10 via-teal-500/5 to-transparent p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 shadow-inner">
                  <NouttbukIsotipo size={26} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold tracking-wider uppercase text-primary">
                      Nouttbuk
                    </span>
                    <span className="text-[10px] rounded-full bg-teal-500/20 px-2 py-0.5 font-bold text-teal-700 dark:text-teal-300">
                      100% Gratis
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-foreground">
                    El cuaderno digital inteligente para estudiantes universitarios
                  </h2>
                  <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                    Estás visualizando este apunte en modo solo lectura. Crea tu cuenta gratuita para tomar apuntes estructurados por páginas, fórmulas matemáticas, música focus y coedición en tiempo real.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                className="shrink-0 text-xs font-semibold gap-1.5 self-stretch sm:self-auto"
                onClick={abrirLogin}
              >
                Registrarme ahora
                <ArrowRightIcon className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Encabezado del apunte */}
        <div className="mx-auto flex w-full max-w-[794px] flex-col gap-3 px-6 pt-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Avatar className="size-10 border border-border/80 shadow-xs">
                {apunte.autor.avatarUrl && (
                  <AvatarImage src={apunte.autor.avatarUrl} alt={apunte.autor.nombre} />
                )}
                <AvatarFallback className="bg-muted font-bold text-xs">
                  {iniciales(apunte.autor.nombre)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                  {apunte.autor.nombre}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>@{apunte.autor.usuario}</span>
                  <span>•</span>
                  <span>{fechaRelativa(apunte.createdAt)}</span>
                </div>
              </div>
            </div>

            {apunte.cursoNombre && (
              <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
                <GraduationCapIcon className="size-3.5 text-primary" />
                {apunte.cursoNombre}
              </Badge>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground pt-2">
            {apunte.titulo}
          </h1>
        </div>

        {/* Hojas del apunte con diseño Atelier */}
        <div className="lienzo-editor mt-4 flex flex-1 items-start justify-center px-4 py-8 sm:px-8">
          <HojasEditor editor={editor}>
            <EditorContent editor={editor} />
          </HojasEditor>
        </div>

        {/* Sección Publicitaria Masiva y de Branding Nouttbuk */}
        <section className="mx-auto w-full max-w-[840px] px-4 pt-12 pb-8 sm:px-6">
          <div className="border-t border-border/80 pt-10 space-y-10">
            {/* Encabezado de la publicidad */}
            <div className="text-center space-y-2 max-w-lg mx-auto">
              <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-primary/10 mb-2">
                <NouttbukIsotipo size={36} />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                Tus apuntes merecen un mejor lugar
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Nouttbuk combina la estructura de un cuaderno universitario físico con la potencia de la colaboración en tiempo real.
              </p>
            </div>

            {/* 4 Tarjetas de funcionalidades destacadas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-2">
                <div className="size-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                  <BookOpenIcon className="size-4.5" />
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  Hojas Reales y Fórmulas LaTeX
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Escribe en hojas A4 y Carta reales con saltos de página inteligentes, imágenes, tablas y ecuaciones matemáticas impecables.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-2">
                <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <HeadphonesIcon className="size-4.5" />
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  Modo Atelier con Sonido Focus
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ambiente de estudio con música lofi, lluvia suave, cafetería y ondas binaurales diseñadas para no perder la concentración.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-2">
                <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <UsersThreeIcon className="size-4.5" />
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  Coedición en Vivo y Compartir
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Invita a compañeros con roles de editor o lector con enlaces protegidos, cursores en tiempo real y comentarios como en Google Docs.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-2">
                <div className="size-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                  <GraduationCapIcon className="size-4.5" />
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  Comunidad Universitaria Abierta
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Descubre apuntes y resúmenes compartidos por estudiantes de tu misma carrera y universidad sin suscripciones costosas.
                </p>
              </div>
            </div>

            {/* Banner de Conversión Final */}
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/10 via-background to-card p-6 sm:p-8 text-center space-y-4">
              <div className="flex justify-center">
                <NouttbukLogo variant="compact" size="lg" interactive={false} />
              </div>

              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="text-lg font-bold text-foreground">
                  Empieza a organizar tus materias hoy mismo
                </h4>
                <p className="text-xs text-muted-foreground">
                  Regístrate gratis en menos de 30 segundos con Google o tu correo universitario.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button
                  type="button"
                  size="lg"
                  className="w-full sm:w-auto px-8 font-bold shadow-md bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white"
                  onClick={abrirLogin}
                >
                  Crear mi cuenta gratis
                </Button>
                <Link
                  href="/comunidad"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full sm:w-auto",
                  )}
                >
                  Explorar la comunidad
                </Link>
              </div>

              <div className="flex items-center justify-center gap-4 pt-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircleIcon weight="fill" className="size-3.5 text-teal-500" />
                  Sin tarjeta de crédito
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircleIcon weight="fill" className="size-3.5 text-teal-500" />
                  Gratuito para estudiantes
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Barra fija inferior sticky para conversión constante al leer */}
      <aside aria-label="Invitación a unirse a Nouttbuk" className="fixed bottom-0 inset-x-0 z-30 border-t border-border/80 bg-background/90 px-4 py-2.5 backdrop-blur-md shadow-lg">
        <div className="mx-auto flex max-w-[840px] items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <NouttbukIsotipo size={22} className="shrink-0" />
            <p className="text-xs text-muted-foreground truncate">
              {apunte.enlacePermiso === "edit" ? (
                <span>¿Quieres coeditar este apunte? <strong>Inicia sesión o regístrate en Nouttbuk</strong>.</span>
              ) : (
                <span>¿Te gustaría tomar apuntes así? <strong>Únete gratis a Nouttbuk</strong>.</span>
              )}
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            className="h-7.5 px-3.5 text-xs font-semibold shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={abrirLogin}
          >
            Registrarme gratis
          </Button>
        </div>
      </aside>
    </div>
  );
}
