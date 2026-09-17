"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MagnifyingGlassIcon,
  CheckIcon,
  XIcon,
  UserMinusIcon,
  UserPlusIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/toast";
import { useDebounce } from "@/hooks/use-debounce";

type Perfil = {
  id: string;
  nombre: string;
  usuario: string;
  avatar_url: string | null;
};

type UserResult = Perfil & {
  estado_amistad?: "pendiente" | "aceptada" | "rechazada" | null;
  solicitante?: boolean;
};

export function AmigosView({
  myId,
  amigosIniciales,
  solicitudesIniciales,
}: {
  myId: string;
  amigosIniciales: Perfil[];
  solicitudesIniciales: Perfil[];
}) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [amigos, setAmigos] = useState(amigosIniciales);
  const [solicitudes, setSolicitudes] = useState(solicitudesIniciales);

  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      buscar(debouncedQuery);
    } else {
      setSearchResults([]);
    }
  }, [debouncedQuery]);

  async function buscar(q: string) {
    setIsSearching(true);
    const supabase = createClient();

    const { data: perfiles, error } = await supabase.rpc("buscar_usuarios", {
      query: q,
    });

    if (error || !perfiles || perfiles.length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const { data: amistades } = await supabase
      .from("amistades")
      .select("*")
      .or(`solicitante_id.eq.${myId},receptor_id.eq.${myId}`);

    const resultadosMapeados = perfiles.map((p) => {
      const amistad = amistades?.find(
        (a) =>
          (a.solicitante_id === myId && a.receptor_id === p.id) ||
          (a.receptor_id === myId && a.solicitante_id === p.id)
      );

      return {
        id: p.id,
        nombre: p.nombre,
        usuario: p.usuario,
        avatar_url: p.avatar_url,
        estado_amistad: amistad ? (amistad.estado as any) : null,
        solicitante: amistad ? amistad.solicitante_id === myId : false,
      };
    });

    setSearchResults(resultadosMapeados);
    setIsSearching(false);
  }

  async function enviarSolicitud(userId: string) {
    const supabase = createClient();

    // Optimistic update
    setSearchResults((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, estado_amistad: "pendiente", solicitante: true }
          : u
      )
    );

    const { error } = await supabase.from("amistades").insert({
      solicitante_id: myId,
      receptor_id: userId,
      estado: "pendiente",
    });

    if (error) {
      toast.add({ title: "Error: " + error.message, type: "error" });
      buscar(debouncedQuery);
    } else {
      toast.add({ title: "Solicitud enviada", type: "success" });
    }
  }

  async function responderSolicitud(solicitanteId: string, aceptar: boolean) {
    const supabase = createClient();

    const solicitud = solicitudes.find((s) => s.id === solicitanteId);
    setSolicitudes((prev) => prev.filter((s) => s.id !== solicitanteId));
    if (aceptar && solicitud) {
      setAmigos((prev) =>
        [...prev, solicitud].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      );
    }

    const { error } = await supabase
      .from("amistades")
      .update({ estado: aceptar ? "aceptada" : "rechazada" })
      .eq("solicitante_id", solicitanteId)
      .eq("receptor_id", myId);

    if (error) {
      toast.add({ title: "Error al actualizar solicitud", type: "error" });
    } else {
      toast.add({
        title: aceptar ? "Solicitud aceptada" : "Solicitud rechazada",
        type: "success",
      });
      if (query.trim().length > 0) buscar(debouncedQuery);
    }
  }

  async function eliminarAmigo(amigoId: string) {
    if (!confirm("¿Seguro que quieres eliminar a este amigo?")) return;
    const supabase = createClient();

    setAmigos((prev) => prev.filter((a) => a.id !== amigoId));

    const { error } = await supabase
      .from("amistades")
      .delete()
      .or(
        `and(solicitante_id.eq.${myId},receptor_id.eq.${amigoId}),and(solicitante_id.eq.${amigoId},receptor_id.eq.${myId})`
      );

    if (error) {
      toast.add({ title: "Error al eliminar amigo", type: "error" });
    } else {
      toast.add({ title: "Amigo eliminado", type: "success" });
      if (query.trim().length > 0) buscar(debouncedQuery);
    }
  }

  function renderBotonAccionBusqueda(user: UserResult) {
    if (!user.estado_amistad) {
      return (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => enviarSolicitud(user.id)}
        >
          <UserPlusIcon className="mr-2" /> Agregar
        </Button>
      );
    }
    if (user.estado_amistad === "pendiente") {
      if (user.solicitante) {
        return (
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
            Enviada
          </span>
        );
      } else {
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => responderSolicitud(user.id, true)}
            >
              Aceptar
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              className="text-red-600 border-red-200"
              onClick={() => responderSolicitud(user.id, false)}
            >
              <XIcon />
            </Button>
          </div>
        );
      }
    }
    if (user.estado_amistad === "aceptada") {
      return (
        <span className="text-xs font-medium text-green-600 bg-green-500/10 px-2 py-1 rounded-md flex items-center gap-1">
          <CheckIcon /> Amigos
        </span>
      );
    }
    if (user.estado_amistad === "rechazada") {
      return (
        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
          Solicitud rechazada
        </span>
      );
    }
    return null;
  }

  const isBuscando = query.trim().length > 0;

  return (
    <div className="flex flex-col gap-10">
      {/* Buscador */}
      <section className="flex flex-col gap-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground size-5" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o usuario..."
            className="pl-12 py-6 text-base rounded-2xl bg-card border-border/50 shadow-sm"
          />
        </div>

        {isBuscando && (
          <div className="flex flex-col gap-2 p-2 border rounded-2xl bg-card min-h-[100px]">
            {isSearching ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Buscando...
              </p>
            ) : searchResults.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No se encontraron usuarios.
              </p>
            ) : (
              searchResults.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-4 hover:bg-muted/30 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Link href={`/u/${u.usuario}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                      <Avatar size="lg" className="ring-1 ring-border/50">
                        <AvatarImage src={u.avatar_url || undefined} />
                        <AvatarFallback>
                          {u.nombre.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold">{u.nombre}</span>
                        <span className="text-sm text-muted-foreground">
                          @{u.usuario}
                        </span>
                      </div>
                    </Link>
                  </div>
                  <div>{renderBotonAccionBusqueda(u)}</div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* Si NO está buscando, mostramos solicitudes y lista de amigos */}
      {!isBuscando && (
        <div className="flex flex-col gap-10">
          {/* Solicitudes Pendientes */}
          {solicitudes.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <UsersIcon className="text-primary size-5" /> Solicitudes
                recibidas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {solicitudes.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border/50 rounded-2xl bg-card shadow-sm gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <Link href={`/u/${s.usuario}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <Avatar size="default" className="ring-1 ring-border/50">
                          <AvatarImage src={s.avatar_url || undefined} />
                          <AvatarFallback>
                            {s.nombre.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-semibold text-sm truncate">
                            {s.nombre}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            @{s.usuario}
                          </span>
                        </div>
                      </Link>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={() => responderSolicitud(s.id, true)}
                      >
                        Aceptar
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="outline"
                        className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100"
                        onClick={() => responderSolicitud(s.id, false)}
                      >
                        <XIcon />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Mis Amigos */}
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <UsersIcon className="text-muted-foreground size-5" /> Mis amigos ({amigos.length})
            </h2>
            {amigos.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-2xl bg-muted/30">
                <p className="text-muted-foreground">
                  Aún no tienes amigos agregados. ¡Usa el buscador para
                  encontrar a tus compañeros!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {amigos.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-4 border border-border/50 rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Link href={`/u/${a.usuario}`} className="flex items-center gap-3 overflow-hidden hover:opacity-80 transition-opacity">
                        <Avatar size="default" className="ring-1 ring-border/50">
                          <AvatarImage src={a.avatar_url || undefined} />
                          <AvatarFallback>
                            {a.nombre.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-semibold text-sm truncate">
                            {a.nombre}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            @{a.usuario}
                          </span>
                        </div>
                      </Link>
                    </div>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:text-red-600 transition-opacity shrink-0"
                      onClick={() => eliminarAmigo(a.id)}
                      title="Eliminar amigo"
                    >
                      <UserMinusIcon />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
