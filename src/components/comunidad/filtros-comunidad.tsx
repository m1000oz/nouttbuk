"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CursoConCarrera } from "@/lib/cursos/consultas";

type Carrera = { id: string; nombre: string };

type FiltrosComunidadProps = {
  carreras: Carrera[];
  cursos: CursoConCarrera[];
};

const TODAS = "__todas__";

export function FiltrosComunidad({ carreras, cursos }: FiltrosComunidadProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const carreraId = searchParams.get("carrera");
  const cursoId = searchParams.get("curso");

  // El selector de curso se acota a la carrera elegida (cuando hay una) para
  // no ofrecer combinaciones que siempre dan cero resultados, p. ej. Derecho
  // + un curso de Ingeniería Informática.
  const cursosVisibles = useMemo(() => {
    if (!carreraId) return cursos;
    const carreraElegida = carreras.find((carrera) => carrera.id === carreraId);
    if (!carreraElegida) return cursos;
    return cursos.filter((curso) => curso.carreraNombre === carreraElegida.nombre);
  }, [cursos, carreras, carreraId]);

  function actualizarParam(clave: "carrera" | "curso", valor: string | null) {
    const params = new URLSearchParams(searchParams);
    if (!valor || valor === TODAS) {
      params.delete(clave);
    } else {
      params.set(clave, valor);
    }
    // Cambiar de carrera invalida cualquier curso elegido de otra carrera.
    if (clave === "carrera") {
      params.delete("curso");
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-6">
      <Select
        value={carreraId ?? TODAS}
        onValueChange={(valor) => actualizarParam("carrera", valor)}
        items={{
          [TODAS]: "Todas las carreras",
          ...Object.fromEntries(
            carreras.map((carrera) => [carrera.id, carrera.nombre]),
          ),
        }}
      >
        <SelectTrigger size="sm">
          <SelectValue placeholder="Carrera" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODAS}>Todas las carreras</SelectItem>
          {carreras.map((carrera) => (
            <SelectItem key={carrera.id} value={carrera.id}>
              {carrera.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={cursoId ?? TODAS}
        onValueChange={(valor) => actualizarParam("curso", valor)}
        items={{
          [TODAS]: "Todos los cursos",
          ...Object.fromEntries(
            cursosVisibles.map((curso) => [
              curso.id,
              `${curso.nombre} (${curso.carreraNombre})`,
            ]),
          ),
        }}
      >
        <SelectTrigger size="sm">
          <SelectValue placeholder="Curso" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODAS}>Todos los cursos</SelectItem>
          {cursosVisibles.map((curso) => (
            <SelectItem key={curso.id} value={curso.id}>
              <span className="flex flex-col py-0.5">
                <span>{curso.nombre}</span>
                <span className="text-xs text-muted-foreground">
                  {curso.carreraNombre}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
