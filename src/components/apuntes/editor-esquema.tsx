"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";

import { cn } from "@/lib/utils";

type Encabezado = {
  pos: number;
  nivel: 1 | 2 | 3;
  texto: string;
};

const RETRASO_RECALCULO_MS = 300;

// Lista simple, no Tabs: Tabs (@base-ui/react/tabs) conmuta un panel a la
// vez, y acá un clic hace un side-effect (mover el cursor) sin cambiar de
// panel. Forzar Tabs para eso no gana nada visual y confundiría a lectores
// de pantalla, que anunciarían pestañas que en realidad no controlan nada.
export function EditorEsquema({ editor }: { editor: Editor | null }) {
  const [encabezados, setEncabezados] = useState<Encabezado[]>([]);

  useEffect(() => {
    // Si no hay editor todavía, no hay nada que suscribir: el render de más
    // abajo ya devuelve null en ese caso, así que un `encabezados` stale acá
    // nunca llega a mostrarse.
    if (!editor) return;

    let temporizador: ReturnType<typeof setTimeout> | null = null;

    function recalcular() {
      const lista: Encabezado[] = [];
      editor!.state.doc.descendants((nodo, pos) => {
        if (nodo.type.name === "heading") {
          lista.push({
            pos,
            nivel: nodo.attrs.level as 1 | 2 | 3,
            texto: nodo.textContent || "(sin texto)",
          });
        }
      });
      setEncabezados(lista);
    }

    function programarRecalculo() {
      if (temporizador) clearTimeout(temporizador);
      temporizador = setTimeout(recalcular, RETRASO_RECALCULO_MS);
    }

    recalcular();
    editor.on("update", programarRecalculo);
    return () => {
      if (temporizador) clearTimeout(temporizador);
      editor.off("update", programarRecalculo);
    };
  }, [editor]);

  if (!editor) return null;

  if (encabezados.length === 0) {
    return (
      <p className="px-1 text-xs text-muted-foreground">
        No hay encabezados todavía. Usa Encabezado 1/2/3 en Formato para armar
        un esquema.
      </p>
    );
  }

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Esquema del documento">
      {encabezados.map((encabezado) => (
        <button
          key={encabezado.pos}
          type="button"
          className={cn(
            "truncate rounded-md px-2 py-1 text-left text-sm text-foreground hover:bg-muted",
            encabezado.nivel === 1 && "font-semibold",
            encabezado.nivel === 2 && "pl-3 text-sm",
            encabezado.nivel === 3 && "pl-6 text-xs text-muted-foreground",
          )}
          onClick={() =>
            editor
              .chain()
              .focus()
              .setTextSelection(encabezado.pos + 1)
              .scrollIntoView()
              .run()
          }
        >
          {encabezado.texto}
        </button>
      ))}
    </nav>
  );
}
