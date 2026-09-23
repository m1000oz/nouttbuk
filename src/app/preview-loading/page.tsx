"use client";

import * as React from "react";
import Link from "next/link";
import {
  NotebookLoader,
  type NotebookLoaderMode,
  type NotebookLoaderTheme,
} from "@/components/brand/notebook-loader";
import { ArrowLeftIcon } from "@phosphor-icons/react";

export default function PreviewLoadingPage() {
  const [theme, setTheme] = React.useState<NotebookLoaderTheme>("dark");
  const [scale, setScale] = React.useState<number>(1.5);
  const [mode, setMode] = React.useState<NotebookLoaderMode>("cycle");

  return (
    <div
      className="relative flex min-h-screen w-full flex-col items-center justify-center transition-colors duration-300"
      style={{
        backgroundColor:
          theme === "dark"
            ? "#0f172a"
            : theme === "light"
              ? "#f8fafc"
              : "#1c1712",
      }}
    >
      {/* Botón para volver al inicio */}
      <div className="fixed top-6 left-6 z-50">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-xs font-semibold text-foreground backdrop-blur-md transition-all hover:bg-muted"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver a Nouttbuk
        </Link>
      </div>

      {/* Componente React NotebookLoader */}
      <NotebookLoader
        key={`${mode}-${theme}-${scale}`}
        fullScreen={false}
        theme={theme}
        size={scale}
        mode={mode}
      />

      {/* Barra de herramientas interactiva de pruebas (idéntica a preview-loading.html) */}
      <div className="fixed bottom-6 z-50 flex flex-col items-center gap-2.5">
        {/* Selector de tema */}
        <div className="flex gap-1.5 rounded-full border border-border bg-card/90 p-1.5 shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              theme === "dark"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Modo Oscuro
          </button>
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              theme === "light"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Modo Claro
          </button>
          <button
            type="button"
            onClick={() => setTheme("atelier")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              theme === "atelier"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Atelier (Editor)
          </button>
        </div>

        {/* Selector de escala */}
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-card/90 p-1.5 shadow-2xl backdrop-blur-md">
          <span className="px-2 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            Escala:
          </span>
          <button
            type="button"
            onClick={() => setScale(1.0)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              scale === 1.0
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mediano (1x)
          </button>
          <button
            type="button"
            onClick={() => setScale(1.5)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              scale === 1.5
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Grande (1.5x)
          </button>
          <button
            type="button"
            onClick={() => setScale(1.85)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              scale === 1.85
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            XL (1.85x)
          </button>
        </div>

        {/* Selector de modo */}
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-card/90 p-1.5 shadow-2xl backdrop-blur-md">
          <span className="px-2 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            Modo:
          </span>
          <button
            type="button"
            onClick={() => setMode("cycle")}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
              mode === "cycle"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Ciclo Completo
          </button>
          <button
            type="button"
            onClick={() => setMode("infinite")}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
              mode === "infinite"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Hojeo Continuo
          </button>
        </div>
      </div>
    </div>
  );
}
