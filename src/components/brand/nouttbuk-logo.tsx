import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NouttbukIsotipo, type NouttbukIsotipoProps } from "./nouttbuk-isotipo";

export type NouttbukLogoProps = {
  variant?: "horizontal" | "compact" | "stacked" | "symbol" | "wordmark";
  withSlogan?: boolean;
  sloganText?: string;
  size?: "sm" | "md" | "lg" | "xl";
  interactive?: boolean;
  href?: string;
  className?: string;
};

const LOGO_CONFIG = {
  sm: {
    iconSize: 24,
    wordmarkSize: "text-lg",
    sloganSize: "text-[10px]",
    gap: "gap-2",
  },
  md: {
    iconSize: 32,
    wordmarkSize: "text-2xl",
    sloganSize: "text-xs",
    gap: "gap-2.5",
  },
  lg: {
    iconSize: 44,
    wordmarkSize: "text-3xl",
    sloganSize: "text-sm",
    gap: "gap-3.5",
  },
  xl: {
    iconSize: 60,
    wordmarkSize: "text-4xl",
    sloganSize: "text-base",
    gap: "gap-4",
  },
};

/**
 * Logotipo oficial de Nouttbuk.
 * Combina el Isotipo (cuaderno anillado a 45° con troqueles 'tt') y el
 * Wordmark tipográfico ("nouttbuk") con acento cromático en el dígrafo 'tt'.
 */
export function NouttbukLogo({
  variant = "compact",
  withSlogan = false,
  sloganText = "Tus apuntes, tu comunidad",
  size = "md",
  interactive = true,
  href,
  className,
}: NouttbukLogoProps) {
  const config = LOGO_CONFIG[size] ?? LOGO_CONFIG.md;
  const isStacked = variant === "stacked";
  const isSymbol = variant === "symbol";
  const isWordmark = variant === "wordmark";
  const shouldShowSlogan =
    withSlogan || variant === "horizontal" || variant === "stacked";

  const content = (
    <div
      className={cn(
        "inline-flex select-none items-center",
        isStacked ? "flex-col text-center" : "flex-row",
        config.gap,
        interactive && "group transition-opacity hover:opacity-90",
        className,
      )}
    >
      {/* Isotipo */}
      {!isWordmark && (
        <NouttbukIsotipo
          size={config.iconSize}
          interactive={false}
          className={cn(
            "transition-transform duration-300 ease-out",
            interactive && "group-hover:scale-105 group-hover:rotate-2",
          )}
        />
      )}

      {/* Wordmark & Slogan */}
      {!isSymbol && (
        <div
          className={cn(
            "flex flex-col",
            isStacked ? "items-center" : "items-start",
          )}
        >
          <span
            className={cn(
              "font-extrabold tracking-tight text-foreground font-sans leading-none",
              config.wordmarkSize,
            )}
          >
            nou
            <span className="text-teal-500 dark:text-teal-400">tt</span>
            buk
          </span>

          {shouldShowSlogan && (
            <span
              className={cn(
                "mt-1 font-medium tracking-wide text-muted-foreground leading-none",
                config.sloganSize,
              )}
            >
              {sloganText}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex focus-visible:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
