"use client";

import { useMemo, useState } from "react";
import {
  MagnifyingGlassIcon,
  NotePencilIcon,
  StarIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SeccionVacia } from "@/components/shared/seccion-vacia";
import { ApunteTarjeta } from "@/components/apuntes/apunte-tarjeta";
import { NuevoApunteButton } from "@/components/nav/fab-nuevo-apunte";
import type { ApunteVisibilidad, PermisoColaborador } from "@/lib/types/enums";

type ApunteItem = {
  id: string;
  titulo: string;
  extracto: string;
  updatedAt: string;
  carpetaId: string | null;
  favorito: boolean;
  visibilidad: ApunteVisibilidad;
  propietario?: string;
  enlaceToken?: string | null;
  enlacePermiso?: PermisoColaborador;
};

type CarpetaOpcion = { id: string; nombre: string; color: string };

type ApuntesExplorerProps = {
  notas: ApunteItem[];
  compartidos: ApunteItem[];
  carpetaPorId: Record<string, { nombre: string; color: string }>;
  carpetas: CarpetaOpcion[];
  carpetaActivaId?: string | null;
};

type TabValue = "todos" | "favoritos" | "compartidos";

function filtrarPorBusqueda(
  lista: ApunteItem[],
  busquedaNormalizada: string,
): ApunteItem[] {
  if (!busquedaNormalizada) return lista;
  return lista.filter((apunte) =>
    apunte.titulo.toLowerCase().includes(busquedaNormalizada),
  );
}

function ListaApuntes({
  lista,
  carpetaPorId,
  carpetas,
  carpetaActivaId,
  emptyIcon,
  emptyTitulo,
  emptyDescripcion,
}: {
  lista: ApunteItem[];
  carpetaPorId: Record<string, { nombre: string; color: string }>;
  carpetas: CarpetaOpcion[];
  carpetaActivaId?: string | null;
  emptyIcon: React.ComponentType<{
    className?: string;
    "aria-hidden"?: boolean;
  }>;
  emptyTitulo: string;
  emptyDescripcion: string;
}) {
  if (lista.length === 0) {
    return (
      <SeccionVacia
        icon={emptyIcon}
        titulo={emptyTitulo}
        descripcion={emptyDescripcion}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {lista.map((apunte, index) => (
        <ApunteTarjeta
          key={apunte.id}
          id={apunte.id}
          titulo={apunte.titulo}
          extracto={apunte.extracto}
          updatedAt={apunte.updatedAt}
          carpetaId={apunte.carpetaId}
          carpeta={
            apunte.carpetaId ? (carpetaPorId[apunte.carpetaId] ?? null) : null
          }
          favorito={apunte.favorito}
          visibilidad={apunte.visibilidad}
          propietario={apunte.propietario}
          enlaceToken={apunte.enlaceToken}
          enlacePermiso={apunte.enlacePermiso}
          carpetas={carpetas}
          index={index}
        />
      ))}
    </div>
  );
}

export function ApuntesExplorer({
  notas,
  compartidos,
  carpetaPorId,
  carpetas,
  carpetaActivaId,
}: ApuntesExplorerProps) {
  const [tab, setTab] = useState<TabValue>("todos");
  const [busqueda, setBusqueda] = useState("");
  const busquedaNormalizada = busqueda.trim().toLowerCase();

  const favoritos = useMemo(
    () => notas.filter((apunte) => apunte.favorito),
    [notas],
  );

  const listaTodos = filtrarPorBusqueda(notas, busquedaNormalizada);
  const listaFavoritos = filtrarPorBusqueda(favoritos, busquedaNormalizada);
  const listaCompartidos = filtrarPorBusqueda(
    compartidos,
    busquedaNormalizada,
  );

  const textoBusquedaVacia = busquedaNormalizada
    ? { titulo: "No encontramos apuntes con ese nombre", icon: MagnifyingGlassIcon, descripcion: "Prueba con otro término de búsqueda." }
    : null;

  return (
    <Tabs
      value={tab}
      onValueChange={(valor) => setTab(valor as TabValue)}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabsList className="w-full sm:w-auto grid grid-cols-3">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="favoritos">Favoritos</TabsTrigger>
          <TabsTrigger value="compartidos">Compartidos</TabsTrigger>
        </TabsList>

        <div className="relative w-full sm:w-64">
          <MagnifyingGlassIcon
            className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Buscar apuntes"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            className="pl-8"
            aria-label="Buscar apuntes"
          />
        </div>
      </div>

      <TabsContent value="todos">
        <ListaApuntes
          lista={listaTodos}
          carpetaPorId={carpetaPorId}
          carpetas={carpetas}
          carpetaActivaId={carpetaActivaId}
          emptyIcon={textoBusquedaVacia?.icon ?? NotePencilIcon}
          emptyTitulo={
            textoBusquedaVacia?.titulo ?? "Todavía no tienes apuntes"
          }
          emptyDescripcion={
            textoBusquedaVacia?.descripcion ??
            "Cuando crees tu primer apunte, aparece aquí."
          }
        />
      </TabsContent>

      <TabsContent value="favoritos">
        <ListaApuntes
          lista={listaFavoritos}
          carpetaPorId={carpetaPorId}
          carpetas={carpetas}
          carpetaActivaId={carpetaActivaId}
          emptyIcon={textoBusquedaVacia?.icon ?? StarIcon}
          emptyTitulo={
            textoBusquedaVacia?.titulo ?? "Todavía no tienes apuntes favoritos"
          }
          emptyDescripcion={
            textoBusquedaVacia?.descripcion ??
            "Marca un apunte como favorito para verlo aquí."
          }
        />
      </TabsContent>

      <TabsContent value="compartidos">
        <ListaApuntes
          lista={listaCompartidos}
          carpetaPorId={carpetaPorId}
          carpetas={carpetas}
          carpetaActivaId={carpetaActivaId}
          emptyIcon={textoBusquedaVacia?.icon ?? UsersThreeIcon}
          emptyTitulo={
            textoBusquedaVacia?.titulo ??
            "Todavía no tienes apuntes compartidos"
          }
          emptyDescripcion={
            textoBusquedaVacia?.descripcion ??
            "Los apuntes que otras personas compartan contigo aparecen aquí."
          }
        />
      </TabsContent>
    </Tabs>
  );
}
