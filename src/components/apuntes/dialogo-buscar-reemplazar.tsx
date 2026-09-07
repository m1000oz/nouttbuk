"use client";

import { type RefObject, useEffect, useState } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DialogoBuscarReemplazarProps = {
  editor: Editor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overlayRef?: RefObject<HTMLElement | null>;
};

// El estado de coincidencias vive en editor.storage.buscarReemplazar
// (buscar-reemplazar-extension.ts), mutado directamente por los comandos:
// como cualquier otro editor.storage, no es reactivo por sí solo, así que
// useEditorState es lo que hace que el contador "3 de 12" se actualice.
export function DialogoBuscarReemplazar({
  editor,
  open,
  onOpenChange,
  overlayRef,
}: DialogoBuscarReemplazarProps) {
  const [termino, setTermino] = useState("");
  const [reemplazo, setReemplazo] = useState("");

  const estado = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      if (!ed) return { resultados: 0, indiceActual: -1 };
      const storage = ed.storage.buscarReemplazar as
        | { resultados: unknown[]; indiceActual: number }
        | undefined;
      return {
        resultados: storage?.resultados.length ?? 0,
        indiceActual: storage?.indiceActual ?? -1,
      };
    },
  }) ?? { resultados: 0, indiceActual: -1 };

  useEffect(() => {
    if (!open || !editor) return;
    editor.commands.buscarTermino(termino);
    // Solo cuando cambia el término o se abre el diálogo: no queremos
    // reescanear en cada transacción del editor mientras el diálogo está
    // abierto pero el usuario todavía no tocó el campo de búsqueda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termino, open]);

  useEffect(() => {
    if (!open && editor) {
      editor.commands.limpiarBusqueda();
    }
  }, [open, editor]);

  if (!editor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent container={overlayRef} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buscar y reemplazar</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              placeholder="Buscar"
              value={termino}
              onChange={(event) => setTermino(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  editor.commands.irResultadoSiguiente();
                }
              }}
            />
            <span className="w-16 shrink-0 text-center text-xs text-muted-foreground">
              {estado.resultados > 0
                ? `${estado.indiceActual + 1} de ${estado.resultados}`
                : "0 de 0"}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Resultado anterior"
              disabled={estado.resultados === 0}
              onClick={() => editor.commands.irResultadoAnterior()}
            >
              <CaretUpIcon aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Resultado siguiente"
              disabled={estado.resultados === 0}
              onClick={() => editor.commands.irResultadoSiguiente()}
            >
              <CaretDownIcon aria-hidden />
            </Button>
          </div>

          <Input
            placeholder="Reemplazar con"
            value={reemplazo}
            onChange={(event) => setReemplazo(event.target.value)}
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={estado.resultados === 0}
              onClick={() => editor.commands.reemplazarActual(reemplazo)}
            >
              Reemplazar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={estado.resultados === 0}
              onClick={() => editor.commands.reemplazarTodos(reemplazo)}
            >
              Reemplazar todos
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
