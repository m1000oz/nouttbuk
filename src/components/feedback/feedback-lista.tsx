"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fechaRelativa } from "@/lib/fecha/relativa";
import { VotoBoton } from "@/components/feedback/voto-boton";
import type { FeedbackEstado } from "@/lib/types/enums";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/toast";
import { DotsThreeIcon, PencilIcon, TrashIcon } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type FeedbackIdea = {
  id: string;
  texto: string;
  estado: FeedbackEstado;
  createdAt: string;
  autorId: string;
  autor: { nombre: string; usuario: string; avatarUrl: string | null };
  votos: number;
  yaVote: boolean;
};

const ESTADO_LABEL: Record<FeedbackEstado, string> = {
  nueva: "Nueva",
  en_revision: "En revisión",
  hecho: "Hecho",
};

const ESTADO_CLASSNAME: Record<FeedbackEstado, string> = {
  nueva: "",
  en_revision: "border-transparent bg-warning/10 text-warning",
  hecho: "border-transparent bg-success/10 text-success",
};

function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type FeedbackListaProps = {
  usuarioId: string;
  ideas: FeedbackIdea[];
  onEditarIdea: (id: string, nuevoTexto: string) => void;
  onEliminarIdea: (id: string) => void;
};

export function FeedbackLista({
  usuarioId,
  ideas,
  onEditarIdea,
  onEliminarIdea,
}: FeedbackListaProps) {
  if (ideas.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
        Todavía no hay ideas propuestas. ¡Anímate a escribir la primera!
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {ideas.map((idea) => (
        <FeedbackItem
          key={idea.id}
          idea={idea}
          usuarioId={usuarioId}
          onEditarIdea={onEditarIdea}
          onEliminarIdea={onEliminarIdea}
        />
      ))}
    </ul>
  );
}

function FeedbackItem({
  idea,
  usuarioId,
  onEditarIdea,
  onEliminarIdea,
}: {
  idea: FeedbackIdea;
  usuarioId: string;
  onEditarIdea: (id: string, nuevoTexto: string) => void;
  onEliminarIdea: (id: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [texto, setTexto] = useState(idea.texto);
  const [cargando, setCargando] = useState(false);
  const esAutor = idea.autorId === usuarioId;

  async function handleGuardar() {
    if (!texto.trim() || texto === idea.texto) {
      setEditando(false);
      return;
    }
    setCargando(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("feedback")
      .update({ texto: texto.trim() })
      .eq("id", idea.id);
    
    setCargando(false);
    if (error) {
      toast.add({ title: "Error al editar", type: "error" });
      return;
    }
    onEditarIdea(idea.id, texto.trim());
    setEditando(false);
    toast.add({ title: "Idea actualizada", type: "success" });
  }

  async function handleConfirmEliminar() {
    setCargando(true);
    const supabase = createClient();
    const { error } = await supabase.from("feedback").delete().eq("id", idea.id);
    setCargando(false);
    if (error) {
      toast.add({ title: "Error al eliminar", type: "error" });
      setShowConfirm(false);
      return;
    }
    setShowConfirm(false);
    onEliminarIdea(idea.id);
    toast.add({ title: "Idea eliminada", type: "success" });
  }

  return (
    <li className="flex items-start gap-3 rounded-lg border border-border px-3 py-3">
      <VotoBoton
        feedbackId={idea.id}
        usuarioId={usuarioId}
        activo={idea.yaVote}
        count={idea.votos}
      />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              {idea.autor.avatarUrl && <AvatarImage src={idea.autor.avatarUrl} alt="" />}
              <AvatarFallback>{iniciales(idea.autor.nombre)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground">
              {idea.autor.nombre}
            </span>
            <span className="text-xs text-muted-foreground">
              {fechaRelativa(idea.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={ESTADO_CLASSNAME[idea.estado]}>
              {ESTADO_LABEL[idea.estado]}
            </Badge>
            {esAutor && !editando && (
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-6 w-6" />}>
                  <DotsThreeIcon weight="bold" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditando(true)}>
                    <PencilIcon className="mr-2" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowConfirm(true)} className="text-destructive">
                    <TrashIcon className="mr-2" /> Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        {editando ? (
          <div className="flex flex-col gap-2 mt-1">
            <Textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => {
                setTexto(idea.texto);
                setEditando(false);
              }}>
                Cancelar
              </Button>
              <Button size="sm" loading={cargando} onClick={handleGuardar}>
                Guardar
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground">{idea.texto}</p>
        )}
      </div>
      
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar idea</DialogTitle>
            <DialogDescription>
              ¿Seguro que quieres eliminar esta idea? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" loading={cargando} onClick={handleConfirmEliminar}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}
