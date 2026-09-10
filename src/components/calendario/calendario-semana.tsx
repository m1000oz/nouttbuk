"use client";

import { useRef, useState } from "react";
import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@phosphor-icons/react";

import { resolverColorCarpeta } from "@/lib/carpetas/colores";
import { DIAS_SEMANA, type BloqueHorario } from "@/lib/calendario/consultas";
import {
  TOTAL_FRANJAS,
  etiquetaFranja,
  filaInicio,
  filasSpan,
  posicionarBloques,
} from "@/lib/calendario/grilla";
import { BloqueSheet } from "@/components/calendario/bloque-sheet";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

// Medidas de la grilla, compartidas entre el layout CSS y la matemática de
// arrastre (pixel <-> franja/día): si estos números cambian, arrastrar y
// dibujar tienen que seguir de acuerdo.
const ALTURA_FRANJA = 30;
const ANCHO_COLUMNA_HORAS = 64;
// Umbral en px antes de considerar que un puntero realmente "arrastró" en
// vez de ser un clic simple (o una activación por teclado, que nunca pasa
// por pointerdown/move y llega directo a onClick).
const UMBRAL_ARRASTRE = 4;

type CalendarioSemanaProps = {
  bloques: BloqueHorario[];
  // Modo interactivo (mi calendario): permite crear/editar/mover/redimensionar
  // bloques y cada bloque muestra su propio título. Modo cruce (lectura,
  // varias personas a la vez): sin edición ni arrastre, cada bloque se
  // identifica por su dueño en vez de su título (evita filtrar el detalle de
  // la materia de otra persona) y las franjas ocupadas se resaltan como
  // fondo aunque no quede espacio para dibujar la barra del bloque.
  perfilId?: string;
  franjasOcupadas?: Set<string>;
  nombrePorPerfil?: Record<string, string>;
};

export function formatearHoraAMPM(hora24: string): string {
  const [h, m] = hora24.split(":");
  const hNum = Number(h);
  const ampm = hNum >= 12 ? "PM" : "AM";
  const h12 = hNum % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

type ArrastreCreacion = {
  dia: number;
  franjaInicio: number;
  franjaActual: number;
};

type ModoArrastreBloque = "mover" | "redimensionar-inicio" | "redimensionar-fin";

type ArrastreBloque = {
  modo: ModoArrastreBloque;
  bloqueId: string;
  diaOriginal: number;
  franjaInicioOriginal: number;
  franjaFinOriginal: number;
  puntoInicioX: number;
  puntoInicioY: number;
  arrastrando: boolean;
  // Valores ya redondeados a la grilla (30 min / columna de día): de acá
  // sale el "fantasma" que marca el destino y el valor que se guarda al
  // soltar.
  diaActual: number;
  franjaInicioActual: number;
  franjaFinActual: number;
  // Delta crudo en píxeles, sin redondear: de acá sale el seguimiento visual
  // del bloque mientras se arrastra, para que siga al cursor con fidelidad
  // completa en vez de saltar en pasos de 28px/30min.
  deltaXPx: number;
  deltaYPx: number;
};

export function CalendarioSemana({
  bloques,
  perfilId,
  franjasOcupadas,
  nombrePorPerfil,
}: CalendarioSemanaProps) {
  const interactivo = Boolean(perfilId);
  const router = useRouter();
  const gridRef = useRef<HTMLDivElement>(null);

  const [arrastreCreacion, setArrastreCreacion] = useState<ArrastreCreacion | null>(
    null,
  );
  const [creacionPendiente, setCreacionPendiente] = useState<{
    dia: number;
    horaInicio: string;
    horaFin: string;
  } | null>(null);
  const [creacionNonce, setCreacionNonce] = useState(0);

  const [arrastreBloque, setArrastreBloque] = useState<ArrastreBloque | null>(null);
  const [bloqueEditando, setBloqueEditando] = useState<string | null>(null);

  function franjaDesdeClienteY(clientY: number, rectTop: number): number {
    return Math.floor((clientY - rectTop) / ALTURA_FRANJA);
  }

  // El navegador puede rechazar la captura si el pointerId ya no corresponde
  // a un puntero activo (pasa con algunos flujos de automatización/testing);
  // no es esencial para que el arrastre funcione, solo evita que el puntero
  // "se escape" del elemento en movimientos muy rápidos, así que un fallo acá
  // nunca debe interrumpir el resto del gesto.
  function intentarCapturarPuntero(elemento: Element, pointerId: number) {
    try {
      elemento.setPointerCapture(pointerId);
    } catch {
      // Sin captura: los manejadores de move/up siguen funcionando igual
      // mientras el puntero se mantenga sobre el elemento.
    }
  }

  function anchoColumnaDia(rect: DOMRect): number {
    return (rect.width - ANCHO_COLUMNA_HORAS) / 7;
  }

  // --- Crear un bloque arrastrando sobre una celda vacía ---

  function manejarPointerDownDia(
    indiceDia: number,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    const rect = event.currentTarget.getBoundingClientRect();
    const franja = Math.min(
      TOTAL_FRANJAS - 1,
      Math.max(0, franjaDesdeClienteY(event.clientY, rect.top)),
    );
    intentarCapturarPuntero(event.currentTarget, event.pointerId);
    setArrastreCreacion({ dia: indiceDia, franjaInicio: franja, franjaActual: franja });
  }

  function manejarPointerMoveDia(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!arrastreCreacion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const franja = Math.min(
      TOTAL_FRANJAS - 1,
      Math.max(0, franjaDesdeClienteY(event.clientY, rect.top)),
    );
    setArrastreCreacion((previo) =>
      previo ? { ...previo, franjaActual: Math.max(previo.franjaInicio, franja) } : previo,
    );
  }

  function manejarPointerUpDia() {
    if (!arrastreCreacion) return;
    const { dia, franjaInicio: inicio, franjaActual } = arrastreCreacion;
    setArrastreCreacion(null);
    if (franjaActual === inicio) {
      // Clic simple sin arrastre: mismo comportamiento de siempre, horario
      // por defecto para que el usuario lo ajuste en el formulario.
      setCreacionPendiente({ dia, horaInicio: "08:00", horaFin: "09:00" });
    } else {
      setCreacionPendiente({
        dia,
        horaInicio: etiquetaFranja(inicio),
        horaFin: etiquetaFranja(franjaActual + 1),
      });
    }
    setCreacionNonce((n) => n + 1);
  }

  function manejarClickDia(indiceDia: number, event: ReactMouseEvent<HTMLButtonElement>) {
    // La activación por teclado (Enter/Espacio) llega acá directo, sin pasar
    // por pointerdown/move/up: event.detail distingue un clic real de mouse
    // (>=1, ya resuelto en manejarPointerUpDia) de uno por teclado (0).
    if (event.detail !== 0) return;
    setCreacionPendiente({ dia: indiceDia, horaInicio: "08:00", horaFin: "09:00" });
    setCreacionNonce((n) => n + 1);
  }

  // --- Mover/redimensionar un bloque existente ---

  function iniciarArrastreBloque(
    bloque: BloqueHorario,
    modo: ModoArrastreBloque,
    event: ReactPointerEvent<HTMLElement>,
  ) {
    event.stopPropagation();
    intentarCapturarPuntero(event.currentTarget, event.pointerId);
    const franjaInicioOriginal = filaInicio(bloque.hora_inicio) - 1;
    const franjaFinOriginal =
      franjaInicioOriginal + filasSpan(bloque.hora_inicio, bloque.hora_fin);
    setArrastreBloque({
      modo,
      bloqueId: bloque.id,
      diaOriginal: bloque.dia_semana,
      franjaInicioOriginal,
      franjaFinOriginal,
      puntoInicioX: event.clientX,
      puntoInicioY: event.clientY,
      arrastrando: false,
      diaActual: bloque.dia_semana,
      franjaInicioActual: franjaInicioOriginal,
      franjaFinActual: franjaFinOriginal,
      deltaXPx: 0,
      deltaYPx: 0,
    });
  }

  function manejarPointerMoveBloque(event: ReactPointerEvent<HTMLElement>) {
    if (!arrastreBloque) return;
    const deltaX = event.clientX - arrastreBloque.puntoInicioX;
    const deltaY = event.clientY - arrastreBloque.puntoInicioY;
    if (!arrastreBloque.arrastrando && Math.hypot(deltaX, deltaY) < UMBRAL_ARRASTRE) {
      return;
    }

    const rect = gridRef.current!.getBoundingClientRect();
    const deltaFranjas = Math.round(deltaY / ALTURA_FRANJA);
    const deltaDias = Math.round(deltaX / anchoColumnaDia(rect));

    setArrastreBloque((previo) => {
      if (!previo) return previo;
      const duracion = previo.franjaFinOriginal - previo.franjaInicioOriginal;

      if (previo.modo === "mover") {
        const diaActual = Math.min(6, Math.max(0, previo.diaOriginal + deltaDias));
        const franjaInicioActual = Math.min(
          TOTAL_FRANJAS - duracion,
          Math.max(0, previo.franjaInicioOriginal + deltaFranjas),
        );
        return {
          ...previo,
          arrastrando: true,
          diaActual,
          franjaInicioActual,
          franjaFinActual: franjaInicioActual + duracion,
          deltaXPx: deltaX,
          deltaYPx: deltaY,
        };
      }

      if (previo.modo === "redimensionar-inicio") {
        const franjaInicioActual = Math.min(
          previo.franjaFinOriginal - 1,
          Math.max(0, previo.franjaInicioOriginal + deltaFranjas),
        );
        return {
          ...previo,
          arrastrando: true,
          franjaInicioActual,
          deltaXPx: deltaX,
          deltaYPx: deltaY,
        };
      }

      const franjaFinActual = Math.max(
        previo.franjaInicioOriginal + 1,
        Math.min(TOTAL_FRANJAS, previo.franjaFinOriginal + deltaFranjas),
      );
      return {
        ...previo,
        arrastrando: true,
        franjaFinActual,
        deltaXPx: deltaX,
        deltaYPx: deltaY,
      };
    });
  }

  async function manejarPointerUpBloque(bloque: BloqueHorario) {
    const actual = arrastreBloque;
    setArrastreBloque(null);
    if (!actual || actual.bloqueId !== bloque.id) return;

    if (!actual.arrastrando) {
      // Clic simple sin arrastre: abre el sheet de edición directamente acá,
      // sin depender de un "click" posterior del navegador.
      setBloqueEditando(bloque.id);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("bloques_horario")
      .update({
        dia_semana: actual.diaActual,
        hora_inicio: etiquetaFranja(actual.franjaInicioActual),
        hora_fin: etiquetaFranja(actual.franjaFinActual),
      })
      .eq("id", bloque.id);

    if (error) {
      toast.add({ title: "No se pudo actualizar el bloque.", type: "error" });
      return;
    }
    router.refresh();
  }

  function manejarClickBloque(bloque: BloqueHorario, event: ReactMouseEvent<HTMLButtonElement>) {
    // Igual que manejarClickDia: solo cubre la activación por teclado, el
    // clic de mouse ya se resolvió en manejarPointerUpBloque.
    if (event.detail !== 0) return;
    setBloqueEditando(bloque.id);
  }

  // Los bloques reales siempre se posicionan a partir de sus datos reales
  // (nunca sustituidos): el bloque que se arrastra sigue al cursor con un
  // transform aparte (ver más abajo), no reposicionándose en la grilla.
  const bloquesPosicionados = posicionarBloques(bloques);

  // Vista previa del destino mientras se "mueve" un bloque: se calcula aparte,
  // sustituyendo sus campos por la posición ya redondeada antes de repartir
  // columnas, así el hueco se ve coherente con los demás bloques del día sin
  // afectar cómo se renderiza el bloque real (que sigue al cursor sin
  // cuantizar, ver el bucle de abajo).
  const fantasmaMover = (() => {
    if (!arrastreBloque || arrastreBloque.modo !== "mover" || !arrastreBloque.arrastrando) {
      return null;
    }
    const conSustitucion = bloques.map((bloque) =>
      bloque.id === arrastreBloque.bloqueId
        ? {
            ...bloque,
            dia_semana: arrastreBloque.diaActual,
            hora_inicio: etiquetaFranja(arrastreBloque.franjaInicioActual),
            hora_fin: etiquetaFranja(arrastreBloque.franjaFinActual),
          }
        : bloque,
    );
    const posicionado = posicionarBloques(conSustitucion).find(
      (candidato) => candidato.id === arrastreBloque.bloqueId,
    );
    if (!posicionado) return null;
    return {
      dia: arrastreBloque.diaActual,
      franjaInicio: arrastreBloque.franjaInicioActual,
      franjaFin: arrastreBloque.franjaFinActual,
      columna: posicionado.columna,
      columnas: posicionado.columnas,
    };
  })();

  const bloqueEnEdicion = bloques.find((bloque) => bloque.id === bloqueEditando);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <div
        ref={gridRef}
        className="grid min-w-[720px]"
        style={{
          gridTemplateColumns: `${ANCHO_COLUMNA_HORAS}px repeat(7, 1fr)`,
          gridTemplateRows: `auto repeat(${TOTAL_FRANJAS}, ${ALTURA_FRANJA}px)`,
        }}
      >
        <div className="sticky top-0 z-10 border-b border-border bg-card" />
        {DIAS_SEMANA.map((dia, indiceDia) => (
          <div
            key={dia}
            className="sticky top-0 z-10 border-b border-l border-border bg-card px-1 py-1.5 text-center text-xs font-semibold text-foreground"
            style={{ gridColumn: indiceDia + 2 }}
          >
            {dia.slice(0, 3)}
          </div>
        ))}

        {Array.from({ length: TOTAL_FRANJAS }).map((_, franja) => (
          <div
            key={`hora-${franja}`}
            className="relative pr-2 text-right text-[10px] text-muted-foreground"
            style={{ gridRow: franja + 2 }}
          >
            {franja % 2 === 0 ? (
              <span className="absolute -top-[7px] right-2 bg-card px-1 font-medium leading-none whitespace-nowrap">
                {formatearHoraAMPM(etiquetaFranja(franja))}
              </span>
            ) : null}
          </div>
        ))}

        {DIAS_SEMANA.map((_, indiceDia) =>
          Array.from({ length: TOTAL_FRANJAS }).map((_, franja) => {
            const clave = `${indiceDia}:${franja}`;
            const libreParaTodos =
              franjasOcupadas !== undefined && !franjasOcupadas.has(clave);
            return (
              <div
                key={clave}
                className={cn(
                  "border-b border-l border-border",
                  franja % 2 === 0 && "border-b-border/50",
                  libreParaTodos && "bg-success/10",
                )}
                style={{ gridColumn: indiceDia + 2, gridRow: franja + 2 }}
              />
            );
          }),
        )}

        {interactivo &&
          DIAS_SEMANA.map((_, indiceDia) => (
            <button
              key={`nuevo-${indiceDia}`}
              type="button"
              aria-label={`Agregar bloque el ${DIAS_SEMANA[indiceDia]}`}
              className="group flex items-center justify-center opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100"
              style={{ gridColumn: indiceDia + 2, gridRow: "2 / -1", touchAction: "none" }}
              onPointerDown={(event) => manejarPointerDownDia(indiceDia, event)}
              onPointerMove={manejarPointerMoveDia}
              onPointerUp={manejarPointerUpDia}
              onClick={(event) => manejarClickDia(indiceDia, event)}
            >
              <PlusIcon className="size-4 text-primary" aria-hidden />
            </button>
          ))}

        {arrastreCreacion && (
          <div
            className="pointer-events-none m-px rounded-md border-2 border-dashed border-primary bg-primary/15"
            style={{
              gridColumn: arrastreCreacion.dia + 2,
              gridRow: `${arrastreCreacion.franjaInicio + 2} / span ${
                arrastreCreacion.franjaActual - arrastreCreacion.franjaInicio + 1
              }`,
            }}
          />
        )}

        {fantasmaMover && (
          <div
            style={{
              gridColumn: fantasmaMover.dia + 2,
              gridRow: `${fantasmaMover.franjaInicio + 2} / span ${
                fantasmaMover.franjaFin - fantasmaMover.franjaInicio
              }`,
              position: "relative",
            }}
          >
            <div
              className="pointer-events-none absolute inset-y-0 m-px rounded-md border-2 border-dashed border-primary bg-primary/15"
              style={{
                left: `${(100 / fantasmaMover.columnas) * fantasmaMover.columna}%`,
                width: `${100 / fantasmaMover.columnas}%`,
              }}
            />
          </div>
        )}

        {bloquesPosicionados.map((bloque) => {
          const nombreDueno = nombrePorPerfil?.[bloque.perfil_id];
          const etiqueta = interactivo || !nombreDueno ? bloque.titulo : nombreDueno;
          const izquierda = (100 / bloque.columnas) * bloque.columna;
          const ancho = 100 / bloque.columnas;
          const titulo = `${bloque.titulo} (${formatearHoraAMPM(bloque.hora_inicio.slice(0, 5))}–${formatearHoraAMPM(bloque.hora_fin.slice(0, 5))})`;
          const unaSolaFranja = filasSpan(bloque.hora_inicio, bloque.hora_fin) === 1;
          const claseTexto = cn(
            "text-sm sm:text-base font-semibold leading-tight tracking-tight",
            unaSolaFranja ? "line-clamp-1" : "line-clamp-2",
          );

          const celdaStyle = {
            gridColumn: bloque.dia_semana + 2,
            gridRow: `${filaInicio(bloque.hora_inicio) + 1} / span ${filasSpan(bloque.hora_inicio, bloque.hora_fin)}`,
            position: "relative" as const,
          };

          if (!interactivo) {
            return (
              <div key={bloque.id} style={celdaStyle}>
                <div
                  className="absolute inset-y-0 m-px flex flex-col items-start overflow-hidden rounded-md p-1.5 text-left text-white"
                  style={{
                    left: `${izquierda}%`,
                    width: `${ancho}%`,
                    backgroundColor: resolverColorCarpeta(bloque.color),
                  }}
                  title={titulo}
                >
                  <span className={claseTexto}>{etiqueta}</span>
                  {!unaSolaFranja && (
                    <span className="mt-0.5 text-xs font-medium leading-tight tracking-tight opacity-90">
                      {formatearHoraAMPM(bloque.hora_inicio.slice(0, 5))} - {formatearHoraAMPM(bloque.hora_fin.slice(0, 5))}
                    </span>
                  )}
                </div>
              </div>
            );
          }

          // Mientras se arrastra este bloque en particular: "mover" lo hace
          // seguir al cursor con un transform crudo (sin cuantizar a la
          // grilla, para que se sienta sincronizado con el mouse), y
          // "redimensionar" ajusta su alto en píxeles continuos en vez de
          // saltar de franja en franja, para que ceda progresivamente hacia
          // el próximo punto de ajuste.
          const enArrastre =
            arrastreBloque?.bloqueId === bloque.id && arrastreBloque.arrastrando
              ? arrastreBloque
              : null;

          const estiloBoton: CSSProperties = {
            left: `${izquierda}%`,
            width: `${ancho}%`,
            backgroundColor: resolverColorCarpeta(bloque.color),
            cursor: enArrastre?.modo === "mover" ? "grabbing" : "grab",
            touchAction: "none",
            top: 0,
            bottom: 0,
          };

          if (enArrastre?.modo === "mover") {
            estiloBoton.transform = `translate(${enArrastre.deltaXPx}px, ${enArrastre.deltaYPx}px) scale(1.03)`;
            estiloBoton.zIndex = 30;
          } else if (enArrastre) {
            const alturaOriginalPx =
              (enArrastre.franjaFinOriginal - enArrastre.franjaInicioOriginal) * ALTURA_FRANJA;
            if (enArrastre.modo === "redimensionar-inicio") {
              estiloBoton.top = Math.min(
                enArrastre.deltaYPx,
                alturaOriginalPx - ALTURA_FRANJA,
              );
              estiloBoton.bottom = 0;
            } else {
              estiloBoton.top = 0;
              estiloBoton.bottom = undefined;
              estiloBoton.height = Math.max(
                ALTURA_FRANJA,
                alturaOriginalPx + enArrastre.deltaYPx,
              );
            }
            estiloBoton.zIndex = 30;
          }

          return (
            <div key={bloque.id} style={celdaStyle}>
              <button
                type="button"
                className={cn(
                  "absolute m-px flex flex-col items-start overflow-hidden rounded-md p-1.5 text-left text-white outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  enArrastre && "shadow-lg ring-2 ring-white/40",
                )}
                style={estiloBoton}
                title={titulo}
                onPointerDown={(event) => iniciarArrastreBloque(bloque, "mover", event)}
                onPointerMove={manejarPointerMoveBloque}
                onPointerUp={() => manejarPointerUpBloque(bloque)}
                onClick={(event) => manejarClickBloque(bloque, event)}
              >
                <span className={claseTexto}>{etiqueta}</span>
                {!unaSolaFranja && (
                  <span className="mt-0.5 text-xs font-medium leading-tight tracking-tight opacity-90">
                    {formatearHoraAMPM(bloque.hora_inicio.slice(0, 5))} - {formatearHoraAMPM(bloque.hora_fin.slice(0, 5))}
                  </span>
                )}
                <span
                  aria-hidden
                  className="group absolute inset-x-0 top-0 flex h-2 items-start justify-center overflow-hidden"
                  style={{ touchAction: "none" }}
                  onPointerDown={(event) =>
                    iniciarArrastreBloque(bloque, "redimensionar-inicio", event)
                  }
                  onPointerMove={manejarPointerMoveBloque}
                  onPointerUp={() => manejarPointerUpBloque(bloque)}
                >
                  <span className="h-0.5 w-full cursor-ns-resize rounded-full bg-white/0 transition-colors group-hover:bg-white/60" />
                </span>
                <span
                  aria-hidden
                  className="group absolute inset-x-0 bottom-0 flex h-2 items-end justify-center overflow-hidden"
                  style={{ touchAction: "none" }}
                  onPointerDown={(event) =>
                    iniciarArrastreBloque(bloque, "redimensionar-fin", event)
                  }
                  onPointerMove={manejarPointerMoveBloque}
                  onPointerUp={() => manejarPointerUpBloque(bloque)}
                >
                  <span className="h-0.5 w-full cursor-ns-resize rounded-full bg-white/0 transition-colors group-hover:bg-white/60" />
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {creacionPendiente && (
        <BloqueSheet
          key={`crear-${creacionNonce}`}
          perfilId={perfilId!}
          diaInicial={creacionPendiente.dia}
          horaInicioInicial={creacionPendiente.horaInicio}
          horaFinInicial={creacionPendiente.horaFin}
          open
          onOpenChange={(abierto) => {
            if (!abierto) setCreacionPendiente(null);
          }}
        />
      )}

      {bloqueEnEdicion && (
        <BloqueSheet
          key={bloqueEditando}
          perfilId={perfilId!}
          bloque={{
            id: bloqueEnEdicion.id,
            titulo: bloqueEnEdicion.titulo,
            diaSemana: bloqueEnEdicion.dia_semana,
            horaInicio: bloqueEnEdicion.hora_inicio,
            horaFin: bloqueEnEdicion.hora_fin,
            color: bloqueEnEdicion.color,
          }}
          open
          onOpenChange={(abierto) => {
            if (!abierto) setBloqueEditando(null);
          }}
        />
      )}
    </div>
  );
}
