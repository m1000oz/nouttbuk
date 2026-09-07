"use client";

import type { Editor } from "@tiptap/react";

import { useEstadoEditor } from "@/components/apuntes/editor-controles-formato";

type EditorContadorPalabrasProps = {
  editor: Editor | null;
};

// Píldora fija en la esquina de la pantalla, no dentro de la hoja del
// editor — el pedido explícito era "herramientas que no están en la hoja".
// La barra de formato en sí (antes el BubbleMenu de esta misma función) se
// reemplazó por la barra persistente + el menú superior (ver
// editor-barra-persistente.tsx / editor-menu-bar.tsx): Google Docs no tiene
// una burbuja flotante al seleccionar texto, solo la barra fija, así que
// mantener las dos hubiera duplicado quince botones en dos lugares.
export function EditorContadorPalabras({ editor }: EditorContadorPalabrasProps) {
  const estado = useEstadoEditor(editor);
  if (!estado) return null;

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-10 flex items-center gap-2 rounded-full bg-popover px-3 py-1 text-xs text-muted-foreground shadow-md ring-1 ring-foreground/10">
      <span>
        {estado.palabras} {estado.palabras === 1 ? "palabra" : "palabras"}
      </span>
      <span className="h-3 w-px bg-border" aria-hidden />
      <span>
        {estado.caracteres}{" "}
        {estado.caracteres === 1 ? "carácter" : "caracteres"}
      </span>
    </div>
  );
}
