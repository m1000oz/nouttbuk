"use client";

import {
  type FormEvent,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowsClockwiseIcon,
  CheckIcon,
  CopySimpleIcon,
  EyeIcon,
  GlobeIcon,
  LinkBreakIcon,
  LinkIcon,
  LockIcon,
  PencilSimpleIcon,
  ShareNetworkIcon,
  TrashIcon,
  UserPlusIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  buscarPerfilPorUsuario,
  consultaColaboradores,
  type ColaboradorRow,
} from "@/lib/colaboradores/consultas";
import type { ApunteVisibilidad, PermisoColaborador } from "@/lib/types/enums";

export type DialogoCompartirApunteProps = {
  apunteId: string;
  titulo: string;
  enlaceToken: string | null;
  enlacePermiso: PermisoColaborador;
  visibilidad: ApunteVisibilidad;
  colaboradoresIniciales?: ColaboradorRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overlayRef?: React.RefObject<HTMLElement | null>;
  onVisibilidadCambiada?: (visibilidad: ApunteVisibilidad) => void;
  onEnlaceActualizado?: (
    token: string | null,
    permiso: PermisoColaborador,
  ) => void;
};

function iniciales(nombre: string | null | undefined): string {
  if (!nombre) return "?";
  return nombre
    .trim()
    .split(/\s+/)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function subscribirOrigin() {
  return () => {};
}

function useOrigin(): string {
  return useSyncExternalStore(
    subscribirOrigin,
    () => (typeof window !== "undefined" ? window.location.origin : ""),
    () => "",
  );
}

export function DialogoCompartirApunte({
  apunteId,
  titulo,
  enlaceToken: enlaceTokenProp,
  enlacePermiso: enlacePermisoProp,
  visibilidad,
  colaboradoresIniciales,
  open,
  onOpenChange,
  overlayRef,
  onVisibilidadCambiada,
  onEnlaceActualizado,
}: DialogoCompartirApunteProps) {
  const router = useRouter();
  const origin = useOrigin();

  const [token, setToken] = useState<string | null>(enlaceTokenProp);
  const [permisoEnlace, setPermisoEnlace] =
    useState<PermisoColaborador>(enlacePermisoProp);
  const [colaboradores, setColaboradores] = useState<ColaboradorRow[]>(
    colaboradoresIniciales ?? [],
  );
  const [cargandoColaboradores, setCargandoColaboradores] = useState(false);

  const [nuevoUsuario, setNuevoUsuario] = useState("");
  const [nuevoPermiso, setNuevoPermiso] = useState<PermisoColaborador>("read");
  const [invitando, setInvitando] = useState(false);
  const [actualizandoEnlace, setActualizandoEnlace] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idsEnCurso, setIdsEnCurso] = useState<Set<string>>(new Set());

  // Sincronizar estado local si cambian los props
  useEffect(() => {
    setToken(enlaceTokenProp);
    setPermisoEnlace(enlacePermisoProp);
  }, [enlaceTokenProp, enlacePermisoProp]);

  // Cargar colaboradores si se abre y no venían pre-cargados
  useEffect(() => {
    if (!open || !apunteId) return;

    let cancelado = false;
    async function cargar() {
      setCargandoColaboradores(true);
      const supabase = createClient();
      const { data } = await consultaColaboradores(supabase, apunteId);
      if (!cancelado && data) {
        setColaboradores(data);
      }
      if (!cancelado) setCargandoColaboradores(false);
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [open, apunteId]);

  function construirUrl(tok: string): string {
    return `${origin}/compartido/${tok}`;
  }

  // Invitar a un colaborador directo por @usuario
  async function handleInvitar(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const usuarioLimpio = nuevoUsuario.trim().replace(/^@/, "");
    if (!usuarioLimpio) return;

    setInvitando(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setInvitando(false);
      setError("Tu sesión expiró. Vuelve a iniciar sesión.");
      return;
    }

    const { data: perfil, error: buscarError } = await buscarPerfilPorUsuario(
      supabase,
      usuarioLimpio,
    );

    if (buscarError) {
      setInvitando(false);
      setError("Error al buscar ese usuario.");
      return;
    }

    if (!perfil) {
      setInvitando(false);
      setError(`No encontramos al estudiante @${usuarioLimpio}.`);
      return;
    }

    if (perfil.id === user.id) {
      setInvitando(false);
      setError("Ya eres el dueño de este apunte.");
      return;
    }

    const { error: dbError } = await supabase.from("colaboradores").upsert(
      {
        apunte_id: apunteId,
        perfil_id: perfil.id,
        permiso: nuevoPermiso,
      },
      { onConflict: "apunte_id,perfil_id" },
    );

    if (dbError) {
      setInvitando(false);
      setError("No se pudo agregar al colaborador. Intenta de nuevo.");
      return;
    }

    // Si la visibilidad es privada, la subimos a 'group' para que RLS permita el acceso
    if (visibilidad === "private") {
      await supabase
        .from("apuntes")
        .update({ visibilidad: "group" })
        .eq("id", apunteId);
      onVisibilidadCambiada?.("group");
    }

    // Actualizar lista local
    setColaboradores((prev) => {
      const existe = prev.some((c) => c.perfil_id === perfil.id);
      if (existe) {
        return prev.map((c) =>
          c.perfil_id === perfil.id ? { ...c, permiso: nuevoPermiso } : c,
        );
      }
      return [
        ...prev,
        {
          apunte_id: apunteId,
          perfil_id: perfil.id,
          permiso: nuevoPermiso,
          perfil: {
            id: perfil.id,
            nombre: perfil.nombre,
            usuario: perfil.usuario,
            avatar_url: perfil.avatar_url,
          },
        },
      ];
    });

    setNuevoUsuario("");
    setInvitando(false);
    toast.add({
      title: `Invitaste a ${perfil.nombre} como ${nuevoPermiso === "edit" ? "editor" : "lector"}.`,
      type: "success",
    });
    router.refresh();
  }

  // Cambiar rol de un colaborador directo
  async function handleCambiarPermisoColaborador(
    perfilId: string,
    permiso: PermisoColaborador,
  ) {
    setIdsEnCurso((prev) => new Set(prev).add(perfilId));
    const supabase = createClient();
    const { error: dbError } = await supabase
      .from("colaboradores")
      .update({ permiso })
      .eq("apunte_id", apunteId)
      .eq("perfil_id", perfilId);

    setIdsEnCurso((prev) => {
      const siguiente = new Set(prev);
      siguiente.delete(perfilId);
      return siguiente;
    });

    if (dbError) {
      toast.add({ title: "No se pudo actualizar el permiso.", type: "error" });
      return;
    }

    setColaboradores((prev) =>
      prev.map((c) => (c.perfil_id === perfilId ? { ...c, permiso } : c)),
    );
    toast.add({
      title: `Permiso actualizado a ${permiso === "edit" ? "editor" : "lector"}.`,
      type: "success",
    });
    router.refresh();
  }

  // Quitar acceso a un colaborador directo
  async function handleQuitarColaborador(perfilId: string) {
    setIdsEnCurso((prev) => new Set(prev).add(perfilId));
    const supabase = createClient();
    const { error: dbError } = await supabase
      .from("colaboradores")
      .delete()
      .eq("apunte_id", apunteId)
      .eq("perfil_id", perfilId);

    setIdsEnCurso((prev) => {
      const siguiente = new Set(prev);
      siguiente.delete(perfilId);
      return siguiente;
    });

    if (dbError) {
      toast.add({ title: "No se pudo quitar el colaborador.", type: "error" });
      return;
    }

    setColaboradores((prev) => prev.filter((c) => c.perfil_id !== perfilId));
    toast.add({ title: "Colaborador eliminado.", type: "success" });
    router.refresh();
  }

  // Actualizar configuración del enlace público (Google Docs style)
  async function actualizarConfiguracionEnlace(
    nuevoToken: string | null,
    nuevoPermisoVal: PermisoColaborador,
    mensajeExito: string,
  ) {
    setError(null);
    setActualizandoEnlace(true);

    const subeVisibilidad = visibilidad === "private" && nuevoToken !== null;
    const supabase = createClient();

    const { error: dbError } = await supabase
      .from("apuntes")
      .update({
        enlace_token: nuevoToken,
        enlace_permiso: nuevoPermisoVal,
        ...(subeVisibilidad ? { visibilidad: "group" as const } : {}),
      })
      .eq("id", apunteId);

    setActualizandoEnlace(false);

    if (dbError) {
      setError("No se pudo actualizar el enlace de compartir.");
      return;
    }

    setToken(nuevoToken);
    setPermisoEnlace(nuevoPermisoVal);
    onEnlaceActualizado?.(nuevoToken, nuevoPermisoVal);

    if (subeVisibilidad) {
      onVisibilidadCambiada?.("group");
    }

    toast.add({ title: mensajeExito, type: "success" });
    router.refresh();
  }

  // Cambiar entre "Restringido" y "Cualquier persona con el enlace"
  async function handleCambiarTipoAcceso(tipo: "restringido" | "cualquiera") {
    if (tipo === "restringido") {
      await actualizarConfiguracionEnlace(
        null,
        permisoEnlace,
        "Enlace desactivado. Solo los colaboradores invitados tienen acceso.",
      );
    } else {
      const nuevoToken = crypto.randomUUID();
      await actualizarConfiguracionEnlace(
        nuevoToken,
        permisoEnlace,
        `Enlace activado en modo ${permisoEnlace === "edit" ? "Editor" : "Lector"}.`,
      );
    }
  }

  // Cambiar el permiso del enlace público (Lector vs Editor)
  // Requisito del usuario: que genere/regenere el enlace según la opción escogida
  async function handleCambiarPermisoEnlace(nuevoRol: PermisoColaborador) {
    if (nuevoRol === permisoEnlace && token) return;
    const nuevoToken = crypto.randomUUID();
    await actualizarConfiguracionEnlace(
      nuevoToken,
      nuevoRol,
      `Enlace regenerado para modo ${nuevoRol === "edit" ? "Editor" : "Lector"}.`,
    );
  }

  // Regenerar token explícitamente
  async function handleRegenerarToken() {
    const nuevoToken = crypto.randomUUID();
    await actualizarConfiguracionEnlace(
      nuevoToken,
      permisoEnlace,
      "Se generó un nuevo enlace. El anterior ha sido invalidado.",
    );
  }

  // Copiar URL al portapapeles
  async function handleCopiar() {
    if (!token) return;
    const url = construirUrl(token);

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const inputTemp = document.createElement("input");
        inputTemp.value = url;
        document.body.appendChild(inputTemp);
        inputTemp.select();
        document.execCommand("copy");
        document.body.removeChild(inputTemp);
      }
      setCopiado(true);
      toast.add({ title: "Enlace copiado al portapapeles.", type: "success" });
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.add({ title: "No se pudo copiar el enlace.", type: "error" });
    }
  }

  const tieneEnlaceActivo = Boolean(token);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        container={overlayRef}
        className="w-full max-w-lg p-0 overflow-hidden bg-card border border-border shadow-2xl z-[70] sm:max-w-xl"
      >
        <div className="p-5 border-b border-border/60 bg-muted/20">
          <DialogHeader className="gap-1 text-left">
            <div className="flex items-center gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShareNetworkIcon weight="bold" className="size-4" />
              </div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Compartir «{titulo.trim() || "Sin título"}»
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Gestiona los colaboradores y el acceso público de este apunte, al estilo Google Docs.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5 space-y-6">
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
            >
              {error}
            </p>
          )}

          {/* Sección 1: Invitar personas */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <UserPlusIcon weight="bold" className="size-3.5 text-primary" />
              Invitar a personas
            </Label>
            <form
              onSubmit={handleInvitar}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  @
                </span>
                <Input
                  value={nuevoUsuario}
                  onChange={(e) => setNuevoUsuario(e.target.value)}
                  placeholder="usuario (ej. maria.lopez)"
                  className="pl-7 h-9 text-xs"
                />
              </div>

              {/* Botón de apagar/prender: Apagado = Lector, Prendido = Editor */}
              <div
                role="button"
                tabIndex={0}
                onClick={() =>
                  setNuevoPermiso(nuevoPermiso === "edit" ? "read" : "edit")
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setNuevoPermiso(nuevoPermiso === "edit" ? "read" : "edit");
                  }
                }}
                className={cn(
                  "flex items-center justify-between sm:justify-start gap-2 h-9 px-2.5 rounded-lg border transition-all cursor-pointer select-none shrink-0",
                  nuevoPermiso === "edit"
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/80 bg-background/80 text-muted-foreground hover:text-foreground",
                )}
                title="Apagar para invitar como Lector, prender para invitar como Editor"
              >
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  {nuevoPermiso === "edit" ? (
                    <>
                      <PencilSimpleIcon weight="bold" className="size-3.5 text-primary" />
                      <span className="font-semibold text-foreground">Editor</span>
                    </>
                  ) : (
                    <>
                      <EyeIcon className="size-3.5 text-muted-foreground" />
                      <span>Lector</span>
                    </>
                  )}
                </div>
                <Switch
                  checked={nuevoPermiso === "edit"}
                  onCheckedChange={(checked) =>
                    setNuevoPermiso(checked ? "edit" : "read")
                  }
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Permiso de la invitación (apagar para Lector, prender para Editor)"
                />
              </div>

              <Button
                type="submit"
                size="sm"
                className="h-9 px-3.5 text-xs font-semibold shrink-0"
                loading={invitando}
                disabled={!nuevoUsuario.trim()}
              >
                Invitar
              </Button>
            </form>
          </div>

          {/* Lista de personas con acceso */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <UsersThreeIcon weight="bold" className="size-3.5 text-primary" />
              Personas con acceso
            </Label>

            <div className="rounded-xl border border-border/70 divide-y divide-border/60 bg-muted/10 overflow-hidden">
              {/* Fila del Dueño / Propietario */}
              <div className="flex items-center justify-between p-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar size="sm">
                    <AvatarFallback className="bg-primary/15 text-primary font-bold text-xs">
                      Tú
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      Tú (creador del apunte)
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Propietario
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] font-semibold">
                  Propietario
                </Badge>
              </div>

              {/* Lista de colaboradores invitados */}
              {colaboradores.map((colab) => {
                const enCurso = idsEnCurso.has(colab.perfil_id);
                return (
                  <div
                    key={colab.perfil_id}
                    className="flex items-center justify-between p-2.5 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar size="sm">
                        {colab.perfil?.avatar_url && (
                          <AvatarImage src={colab.perfil.avatar_url} />
                        )}
                        <AvatarFallback className="text-xs font-semibold">
                          {iniciales(colab.perfil?.nombre)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {colab.perfil?.nombre ?? "Estudiante"}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          @{colab.perfil?.usuario ?? "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          !enCurso &&
                          handleCambiarPermisoColaborador(
                            colab.perfil_id,
                            colab.permiso === "edit" ? "read" : "edit",
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            if (!enCurso) {
                              handleCambiarPermisoColaborador(
                                colab.perfil_id,
                                colab.permiso === "edit" ? "read" : "edit",
                              );
                            }
                          }
                        }}
                        className={cn(
                          "flex items-center gap-2 h-7.5 px-2 rounded-md border text-xs cursor-pointer select-none transition-all",
                          colab.permiso === "edit"
                            ? "border-primary/30 bg-primary/5 text-primary font-semibold"
                            : "border-border/70 bg-background/50 text-muted-foreground hover:text-foreground",
                          enCurso && "opacity-50 pointer-events-none",
                        )}
                        title={
                          colab.permiso === "edit"
                            ? "Prendido: Editor (clic para pasar a Lector)"
                            : "Apagado: Lector (clic para pasar a Editor)"
                        }
                      >
                        <span className="text-[11px]">
                          {colab.permiso === "edit" ? "Editor" : "Lector"}
                        </span>
                        <Switch
                          checked={colab.permiso === "edit"}
                          disabled={enCurso}
                          onCheckedChange={(checked) =>
                            handleCambiarPermisoColaborador(
                              colab.perfil_id,
                              checked ? "edit" : "read",
                            )
                          }
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Permiso para ${colab.perfil?.nombre ?? "colaborador"}: apagar para Lector, prender para Editor`}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleQuitarColaborador(colab.perfil_id)}
                        disabled={enCurso}
                        title="Quitar acceso a este colaborador"
                      >
                        <TrashIcon className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {colaboradores.length === 0 && !cargandoColaboradores && (
                <div className="p-3 text-center text-[11px] text-muted-foreground">
                  Aún no has invitado a ningún compañero a este apunte.
                </div>
              )}
            </div>
          </div>

          {/* Sección 2: Acceso General (Google Docs style) */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <GlobeIcon weight="bold" className="size-3.5 text-primary" />
              Acceso general
            </Label>

            <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-3">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${
                    tieneEnlaceActivo
                      ? "bg-teal-500/15 text-teal-600 dark:text-teal-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tieneEnlaceActivo ? (
                    <GlobeIcon weight="fill" className="size-5" />
                  ) : (
                    <LockIcon weight="fill" className="size-5" />
                  )}
                </div>

                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={tieneEnlaceActivo ? "cualquiera" : "restringido"}
                      onValueChange={(val) =>
                        handleCambiarTipoAcceso(val as "restringido" | "cualquiera")
                      }
                      disabled={actualizandoEnlace}
                      items={{
                        restringido: "Restringido",
                        cualquiera: "Cualquier persona con el enlace",
                      }}
                    >
                      <SelectTrigger size="sm" className="h-8 text-xs font-semibold w-56">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent container={overlayRef}>
                        <SelectItem value="restringido">
                          <span className="flex items-center gap-2">
                            <LockIcon className="size-3.5 text-muted-foreground" />
                            Restringido
                          </span>
                        </SelectItem>
                        <SelectItem value="cualquiera">
                          <span className="flex items-center gap-2">
                            <GlobeIcon className="size-3.5 text-teal-500" />
                            Cualquier persona con el enlace
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Botón de apagar/prender para el enlace (Apagado = Lector, Prendido = Editor) */}
                    {tieneEnlaceActivo && (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          !actualizandoEnlace &&
                          handleCambiarPermisoEnlace(
                            permisoEnlace === "edit" ? "read" : "edit",
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            if (!actualizandoEnlace) {
                              handleCambiarPermisoEnlace(
                                permisoEnlace === "edit" ? "read" : "edit",
                              );
                            }
                          }
                        }}
                        className={cn(
                          "flex items-center gap-2 h-8 px-2.5 rounded-lg border transition-all cursor-pointer select-none",
                          permisoEnlace === "edit"
                            ? "border-primary/40 bg-primary/10 text-primary font-semibold shadow-2xs"
                            : "border-border/80 bg-background/80 text-muted-foreground hover:text-foreground",
                          actualizandoEnlace && "opacity-60 pointer-events-none",
                        )}
                        title={
                          permisoEnlace === "edit"
                            ? "Prendido: Modo Editor (clic para pasar a Lector)"
                            : "Apagado: Modo Lector (clic para pasar a Editor)"
                        }
                      >
                        <div className="flex items-center gap-1.5 text-xs">
                          {permisoEnlace === "edit" ? (
                            <>
                              <PencilSimpleIcon weight="bold" className="size-3.5 text-primary" />
                              <span className="text-foreground">Modo Editor</span>
                            </>
                          ) : (
                            <>
                              <EyeIcon className="size-3.5 text-muted-foreground" />
                              <span>Modo Lector</span>
                            </>
                          )}
                        </div>
                        <Switch
                          checked={permisoEnlace === "edit"}
                          disabled={actualizandoEnlace}
                          onCheckedChange={(checked) =>
                            handleCambiarPermisoEnlace(checked ? "edit" : "read")
                          }
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Permiso del enlace público (apagar para Lector, prender para Editor)"
                        />
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    {tieneEnlaceActivo ? (
                      permisoEnlace === "edit" ? (
                        <span>
                          Cualquier persona con el enlace puede entrar a <strong>coeditar en vivo</strong> en Nouttbuk.
                        </span>
                      ) : (
                        <span>
                          Cualquier persona con el enlace tiene acceso a la <strong>vista de solo lectura</strong> e invitación para unirse a Nouttbuk.
                        </span>
                      )
                    ) : (
                      <span>
                        Solo las personas agregadas arriba pueden abrir este apunte.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Caja de URL y acciones rápidas */}
              {tieneEnlaceActivo && token && (
                <div className="pt-2 border-t border-border/50 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Input
                      readOnly
                      value={construirUrl(token)}
                      className="h-8 text-xs font-mono bg-background select-all"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs gap-1.5 shrink-0"
                      onClick={handleCopiar}
                    >
                      {copiado ? (
                        <>
                          <CheckIcon weight="bold" className="size-3.5 text-teal-500" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <CopySimpleIcon className="size-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground pt-1">
                    <span className="truncate">
                      Cambiar de rol regenera automáticamente el enlace de invitación.
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] text-muted-foreground hover:text-foreground gap-1 px-1.5 shrink-0"
                      onClick={handleRegenerarToken}
                      loading={actualizandoEnlace}
                    >
                      <ArrowsClockwiseIcon className="size-3" />
                      Regenerar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer estilo Google Docs */}
        <div className="p-4 border-t border-border/70 bg-muted/30 flex items-center justify-between gap-3">
          {tieneEnlaceActivo && token ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs"
              onClick={handleCopiar}
            >
              {copiado ? (
                <>
                  <CheckIcon weight="bold" className="size-4 text-teal-500" />
                  <span>Enlace copiado</span>
                </>
              ) : (
                <>
                  <LinkIcon className="size-4" />
                  <span>Copiar enlace</span>
                </>
              )}
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              Acceso restringido
            </span>
          )}

          <Button
            type="button"
            className="h-9 px-5 text-xs"
            onClick={() => onOpenChange(false)}
          >
            Listo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
