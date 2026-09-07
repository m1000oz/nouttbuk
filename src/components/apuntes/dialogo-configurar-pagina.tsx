"use client";

import type { RefObject } from "react";
import {
  ArrowsClockwiseIcon,
} from "@phosphor-icons/react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PRESETS_MARGEN,
  PRESETS_TAMANO,
  type MargenPreset,
  type TamanoPagina,
} from "@/lib/tiptap/geometria-pagina";
import type {
  ConfiguracionEncabezadoPie,
  GeometriaPagina,
} from "@/lib/tiptap/configuracion-pagina";
import { cn } from "@/lib/utils";

function ChipBoton({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-3 py-1.5 text-sm transition-colors",
        activo
          ? "border-primary bg-primary/15 text-foreground"
          : "border-border text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

// Un tamaño de página siempre se guarda ya orientado (alturaPagina/
// anchoPagina reflejan la orientación actual): esta función compara contra
// los presets sin importar cuál de los dos es "alto" o "ancho" en este
// momento, para poder marcar el chip correcto en cualquier orientación.
function tamanoActualDe(geometria: GeometriaPagina): TamanoPagina {
  const [mayor, menor] =
    geometria.alturaPagina >= geometria.anchoPagina
      ? [geometria.alturaPagina, geometria.anchoPagina]
      : [geometria.anchoPagina, geometria.alturaPagina];
  const distanciaA4 = Math.abs(mayor - PRESETS_TAMANO.a4.alturaPagina);
  const distanciaCarta = Math.abs(mayor - PRESETS_TAMANO.carta.alturaPagina);
  void menor;
  return distanciaCarta < distanciaA4 ? "carta" : "a4";
}

type DialogoConfigurarPaginaProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overlayRef?: RefObject<HTMLElement | null>;
  geometria: GeometriaPagina;
  onGeometriaChange: (geometria: GeometriaPagina) => void;
  encabezadoPie: ConfiguracionEncabezadoPie;
  onEncabezadoPieChange: (config: ConfiguracionEncabezadoPie) => void;
};

export function DialogoConfigurarPagina({
  open,
  onOpenChange,
  overlayRef,
  geometria,
  onGeometriaChange,
  encabezadoPie,
  onEncabezadoPieChange,
}: DialogoConfigurarPaginaProps) {
  const tamanoActual = tamanoActualDe(geometria);
  const margenActual = (Object.keys(PRESETS_MARGEN) as MargenPreset[]).find(
    (clave) => PRESETS_MARGEN[clave].valor === geometria.margenPagina,
  );

  function aplicarTamano(tamano: TamanoPagina) {
    const preset = PRESETS_TAMANO[tamano];
    const [alto, ancho] =
      geometria.orientacion === "vertical"
        ? [preset.alturaPagina, preset.anchoPagina]
        : [preset.anchoPagina, preset.alturaPagina];
    onGeometriaChange({ ...geometria, alturaPagina: alto, anchoPagina: ancho });
  }

  function alternarOrientacion() {
    onGeometriaChange({
      ...geometria,
      alturaPagina: geometria.anchoPagina,
      anchoPagina: geometria.alturaPagina,
      orientacion: geometria.orientacion === "vertical" ? "horizontal" : "vertical",
    });
  }

  function aplicarMargen(margen: MargenPreset) {
    onGeometriaChange({ ...geometria, margenPagina: PRESETS_MARGEN[margen].valor });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent container={overlayRef} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar página</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Tamaño</Label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(PRESETS_TAMANO) as TamanoPagina[]).map((tamano) => (
                <ChipBoton
                  key={tamano}
                  activo={tamanoActual === tamano}
                  onClick={() => aplicarTamano(tamano)}
                >
                  {PRESETS_TAMANO[tamano].etiqueta}
                </ChipBoton>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Orientación</Label>
            <Button type="button" variant="outline" size="sm" onClick={alternarOrientacion} className="w-fit gap-1.5">
              <ArrowsClockwiseIcon aria-hidden />
              {geometria.orientacion === "vertical" ? "Vertical" : "Horizontal"}
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Márgenes</Label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(PRESETS_MARGEN) as MargenPreset[]).map((margen) => (
                <ChipBoton
                  key={margen}
                  activo={margenActual === margen}
                  onClick={() => aplicarMargen(margen)}
                >
                  {PRESETS_MARGEN[margen].etiqueta}
                </ChipBoton>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-3">
            <Label>Encabezado y pie de página</Label>
            <Input
              placeholder="Texto del encabezado"
              value={encabezadoPie.encabezado}
              onChange={(event) =>
                onEncabezadoPieChange({ ...encabezadoPie, encabezado: event.target.value })
              }
            />
            <Input
              placeholder="Texto del pie de página"
              value={encabezadoPie.pie}
              onChange={(event) =>
                onEncabezadoPieChange({ ...encabezadoPie, pie: event.target.value })
              }
            />
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={encabezadoPie.mostrarNumeroPagina}
                onCheckedChange={(checked) =>
                  onEncabezadoPieChange({
                    ...encabezadoPie,
                    mostrarNumeroPagina: checked === true,
                  })
                }
              />
              Mostrar número de página
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={encabezadoPie.primeraPaginaDistinta}
                onCheckedChange={(checked) =>
                  onEncabezadoPieChange({
                    ...encabezadoPie,
                    primeraPaginaDistinta: checked === true,
                  })
                }
              />
              Primera página distinta
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Listo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
