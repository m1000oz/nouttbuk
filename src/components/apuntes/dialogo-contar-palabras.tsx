"use client";

import type { RefObject } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEstadoEditor } from "@/components/apuntes/editor-controles-formato";
import type { Editor } from "@tiptap/react";

type DialogoContarPalabrasProps = {
  editor: Editor | null;
  paginas: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overlayRef?: RefObject<HTMLElement | null>;
};

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{etiqueta}</span>
      <span className="font-medium tabular-nums">{valor}</span>
    </div>
  );
}

// Contador detallado, distinto de la píldora fija de siempre visible
// (EditorContadorPalabras en editor-toolbar.tsx, que se queda como vista
// rápida): acá vive lo que esa píldora no tiene espacio para mostrar
// (páginas, caracteres sin espacios, tiempo de lectura estimado).
export function DialogoContarPalabras({
  editor,
  paginas,
  open,
  onOpenChange,
  overlayRef,
}: DialogoContarPalabrasProps) {
  const estado = useEstadoEditor(editor);
  if (!editor || !estado) return null;

  const caracteresSinEspacios = editor.state.doc.textContent.replace(/\s/g, "").length;
  const minutosLectura = Math.max(1, Math.round(estado.palabras / 200));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent container={overlayRef} className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Contar palabras</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col">
          <Fila etiqueta="Palabras" valor={estado.palabras} />
          <Fila etiqueta="Caracteres" valor={estado.caracteres} />
          <Fila etiqueta="Caracteres sin espacios" valor={caracteresSinEspacios} />
          <Fila etiqueta="Páginas" valor={paginas} />
          <Fila
            etiqueta="Tiempo de lectura estimado"
            valor={`${minutosLectura} min`}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
