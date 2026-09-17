import Link from "next/link";
import { NouttbukLogo } from "@/components/brand";

export function LandingFooter() {
  return (
    <footer className="border-t border-border/70 bg-card py-16">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Brand & Slogan */}
          <div className="space-y-2">
            <NouttbukLogo
              variant="horizontal"
              size="md"
              withSlogan={true}
              sloganText="Tus apuntes, tu comunidad"
            />
            <p className="text-xs text-muted-foreground max-w-md pt-1">
              Plataforma académica para estudiantes universitarios. Apuntes organizados por materia, coedición en vivo y comunidad abierta.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-xs sm:text-sm font-medium text-muted-foreground">
            <Link href="#problema" className="hover:text-foreground transition-colors">
              Por qué Nouttbuk
            </Link>
            <Link href="#estudiantes" className="hover:text-foreground transition-colors">
              Para estudiar
            </Link>
            <Link href="#equipos" className="hover:text-foreground transition-colors">
              Para tu grupo
            </Link>
            <Link href="/comunidad" className="hover:text-foreground transition-colors">
              Comunidad
            </Link>
            <Link href="/feedback" className="hover:text-foreground transition-colors">
              Sugerencias
            </Link>
            <Link href="/terminos" className="hover:text-foreground transition-colors">
              Términos
            </Link>
            <Link href="/privacidad" className="hover:text-foreground transition-colors">
              Privacidad
            </Link>
            <Link href="/creditos" className="hover:text-foreground transition-colors">
              Créditos
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Nouttbuk. Pensado para la comunidad de la Pontificia Universidad Católica del Perú.</p>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>Hecho con rigor académico</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
