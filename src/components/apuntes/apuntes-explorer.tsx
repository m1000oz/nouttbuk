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
import { ApunteRecienteCard } from "@/components/inicio/apunte-reciente-card";
import { NuevoApunteButton } from "@/components/nav/fab-nuevo-apunte";

type ApunteItem = {
  id: string;
  titulo: string;
  updatedAt: string;
  carpetaId: string | null;
  favorito: boolean;
  propietario?: string;
};

type ApuntesExplorerProps = {
  notas: ApunteItem[];
  compartidos: ApunteItem[];
  carpetaPorId: Record<string, { nombre: string }>;
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
  emptyIcon,
  emptyTitulo,
  emptyDescripcion,
}: {
  lista: ApunteItem[];
  carpetaPorId: Record<string, { nombre: string }>;
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
        accion={<NuevoApunteButton variant="sidebar" />}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {lista.map((apunte, index) => (
        <ApunteRecienteCard
          key={apunte.id}
          id={apunte.id}
          titulo={apunte.titulo}
          updatedAt={apunte.updatedAt}
          carpeta={
            apunte.carpetaId ? (carpetaPorId[apunte.carpetaId] ?? null) : null
          }
          propietario={apunte.propietario}
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
        <TabsList>
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
