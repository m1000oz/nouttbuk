"use client";

import { XIcon } from "@phosphor-icons/react";

import { crearItemsComando } from "@/components/apuntes/menu-comandos";

const ATAJOS = [
  { teclas: "Ctrl/⌘ + B", accion: "Negrita" },
  { teclas: "Ctrl/⌘ + I", accion: "Cursiva" },
  { teclas: "Ctrl/⌘ + U", accion: "Subrayado" },
  { teclas: "Ctrl/⌘ + Shift + S", accion: "Tachado" },
  { teclas: "Ctrl/⌘ + Alt + 1/2/3", accion: "Encabezado 1/2/3" },
  { teclas: "Ctrl/⌘ + Shift + 8", accion: "Lista con viñetas" },
  { teclas: "Ctrl/⌘ + Shift + 7", accion: "Lista numerada" },
  { teclas: "Ctrl/⌘ + Z", accion: "Deshacer" },
];

// Panel de baja opacidad, siempre visible salvo que el usuario lo cierre: no
// enseña los comandos con un tutorial que se ve una vez y se olvida, los deja
// a la vista todo el tiempo mientras se escribe. Reutiliza la misma lista de
// crearItemsComando() que ya alimenta el menú "/" (menu-comandos.tsx), para
// que nunca queden desincronizados si se agrega o quita un comando.
export function EditorGuia({ onCerrar }: { onCerrar: () => void }) {
  const comandos = crearItemsComando();

  return (
    <aside className="guia-flotante print:hidden fixed top-24 right-4 z-10 w-56">
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
        <span className="text-[11px] font-medium tracking-wide uppercase opacity-70">
          Guía rápida
        </span>
        <button
          type="button"
          aria-label="Ocultar guía rápida"
          onClick={onCerrar}
          className="guia-flotante-cerrar"
        >
          <XIcon className="size-3" aria-hidden />
        </button>
      </div>

      <div className="px-3 pb-1.5">
        <p className="mb-1 text-[11px] opacity-60">
          Escribe <span className="font-mono">/</span> y elige:
        </p>
        <ul className="flex flex-wrap gap-1">
          {comandos.map((item) => (
            <li key={item.titulo} className="guia-flotante-chip">
              {item.titulo}
            </li>
          ))}
        </ul>
      </div>

      <div className="px-3 pt-1.5 pb-3">
        <p className="mb-1 text-[11px] opacity-60">Con texto seleccionado:</p>
        <ul className="flex flex-col gap-0.5">
          {ATAJOS.map((atajo) => (
            <li
              key={atajo.accion}
              className="flex items-center justify-between gap-2 text-[11px]"
            >
              <span className="opacity-70">{atajo.accion}</span>
              <span className="guia-flotante-tecla">{atajo.teclas}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
