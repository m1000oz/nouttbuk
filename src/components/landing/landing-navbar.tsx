"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ListIcon, XIcon } from "@phosphor-icons/react";

import { NouttbukLogo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { useLandingAuth } from "@/components/landing/landing-auth-context";
import { cn } from "@/lib/utils";

type LandingNavbarProps = {
  usuarioAutenticado?: boolean;
};

export function LandingNavbar({ usuarioAutenticado = false }: LandingNavbarProps) {
  const { abrirAuth } = useLandingAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Por qué Nouttbuk", href: "#problema" },
    { label: "Para estudiar", href: "#estudiantes" },
    { label: "Para tu grupo", href: "#equipos" },
    { label: "Comunidad", href: "/comunidad" },
    { label: "Preguntas frecuentes", href: "#faq" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200",
        scrolled
          ? "border-b border-border/80 bg-background/90 backdrop-blur-md"
          : "border-b border-transparent bg-background/70 backdrop-blur-xs"
      )}
    >
      <div className="mx-auto flex h-20 sm:h-24 w-full max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-12">
        {/* Brand Logo & Campus Indicator */}
        <div className="flex items-center gap-4 lg:gap-6">
          <NouttbukLogo
            href="/"
            variant="horizontal"
            size="md"
            withSlogan={true}
            sloganText="Tus apuntes, tu comunidad"
            className="scale-100 sm:scale-105 origin-left"
          />

          <div className="hidden xl:flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-teal-500"></span>
            </span>
            <span>Comunidad PUCP</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-1 xl:gap-2 lg:flex" aria-label="Navegación principal">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl px-3.5 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="hidden items-center gap-3 sm:flex">
          {usuarioAutenticado ? (
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/inicio" />}
              className="font-medium px-5"
            >
              Ir a mi espacio
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={() => abrirAuth("login")}
                className="text-sm font-medium text-muted-foreground hover:text-foreground px-4"
              >
                Iniciar sesión
              </Button>
              <Button
                type="button"
                size="lg"
                onClick={() => abrirAuth("signup")}
                className="font-medium bg-primary hover:bg-primary/90 text-primary-foreground px-5 shadow-xs whitespace-normal sm:whitespace-nowrap text-center"
              >
                Crear cuenta gratis
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          {usuarioAutenticado ? (
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href="/inicio" />}
              className="text-xs font-medium whitespace-normal sm:whitespace-nowrap"
            >
              Ir a la app
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => abrirAuth("signup")}
              className="text-xs font-medium whitespace-normal sm:whitespace-nowrap"
            >
              Crear cuenta
            </Button>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-foreground"
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileMenuOpen ? <XIcon className="size-5" /> : <ListIcon className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-background px-6 pt-3 pb-6 lg:hidden">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {!usuarioAutenticado && (
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMobileMenuOpen(false);
                  abrirAuth("login");
                }}
                className="w-full justify-center text-sm font-medium whitespace-normal sm:whitespace-nowrap text-center"
              >
                Iniciar sesión
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  abrirAuth("signup");
                }}
                className="w-full justify-center text-sm font-medium whitespace-normal sm:whitespace-nowrap text-center"
              >
                Crear cuenta gratis
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
