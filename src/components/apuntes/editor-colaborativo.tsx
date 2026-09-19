"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
  shallow,
  useErrorListener,
  useOther,
  useOthersConnectionIds,
  useRoom,
  useSelf,
  useStatus,
} from "@liveblocks/react";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { UsersThreeIcon } from "@phosphor-icons/react";

import {
  Avatar,
  AvatarImage,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
} from "@/components/ui/avatar";
import { colorParaUsuario } from "@/lib/liveblocks/color-usuario";
import { NOMBRE_TEXTO_TITULO } from "@/lib/liveblocks/nombres-sala";
import { reemplazarTextoCompartido } from "@/lib/liveblocks/texto-compartido";
import { crearExtensionesEsquema } from "@/lib/tiptap/extensiones-documento";
import { Paginacion } from "@/lib/tiptap/pagination-extension";
import { obtenerGeometriaConfiguracionPagina } from "@/lib/tiptap/configuracion-pagina";
import { BuscarReemplazar } from "@/lib/tiptap/buscar-reemplazar-extension";
import { ComandoBarra } from "@/lib/tiptap/comando-barra";
import { crearItemsComando, crearRenderizadorComandos } from "@/components/apuntes/menu-comandos";
import { crearTransformPasted } from "@/lib/tiptap/pegar-lineas-como-parrafos";
import { manejarClicParaAbrirEnlace } from "@/lib/tiptap/abrir-enlace-con-clic";

// Viene de crearExtensionesEsquema() (src/lib/tiptap/extensiones-documento.ts),
// compartido con editor-estatico.tsx y detalle-publicacion.tsx: si un apunte
// con negrita/resaltado/enlaces se coedita acá, se lee en modo solo lectura,
// o se publica a Comunidad, se ve igual en los tres porque importan la misma
// función. `historial: false` porque acá lo maneja Yjs vía Collaboration, y
// este mismo array alimenta tanto el editor en vivo como getSchema() más abajo.
const EXTENSIONES_ESQUEMA = crearExtensionesEsquema({ historial: false });

function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Se suscribe solo a quién entra y sale (useOthersConnectionIds) y a la info
// estable de cada persona (useOther con selector): `useOthers()` completo se
// vuelve a renderizar en CADA movimiento de cursor o selección de cualquier
// colaborador, porque el cursor viaja dentro de la presencia de Liveblocks.
function AvatarColaborador({ connectionId }: { connectionId: number }) {
  const info = useOther(connectionId, (otro) => otro.info, shallow);
  if (!info) return null;
  return (
    <Avatar size="sm">
      <AvatarImage src={info.avatar} alt={info.name} />
      <AvatarFallback>{iniciales(info.name)}</AvatarFallback>
      <AvatarBadge style={{ backgroundColor: info.color }} />
    </Avatar>
  );
}

function PresenciaColaboradores({
  estado,
}: {
  estado: "sincronizado" | "conectando" | "sin-conexion";
}) {
  const info = useSelf((yo) => yo.info, shallow);
  const idsOtros = useOthersConnectionIds();

  const texto =
    estado === "sin-conexion"
      ? "Sin conexión: tus cambios se enviarán al reconectar."
      : estado === "conectando"
        ? "Sincronizando…"
        : idsOtros.length > 0
          ? "Coeditando ahora:"
          : "Coedición en vivo activa.";

  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/50 px-3 py-2">
      <UsersThreeIcon className="size-4 text-muted-foreground" aria-hidden />
      <span className="text-sm text-muted-foreground" role="status">
        {texto}
      </span>
      {idsOtros.length > 0 && (
        <AvatarGroup>
          {info && (
            <Avatar size="sm">
              <AvatarImage src={info.avatar} alt={info.name} />
              <AvatarFallback>{iniciales(info.name)}</AvatarFallback>
              <AvatarBadge style={{ backgroundColor: info.color }} />
            </Avatar>
          )}
          {idsOtros.map((id) => (
            <AvatarColaborador key={id} connectionId={id} />
          ))}
        </AvatarGroup>
      )}
    </div>
  );
}

// Lo que el padre necesita saber de la sala para decidir qué persistir en
// Postgres (ver apunte-editor.tsx):
// - `esLider`: exactamente UNA conexión por sala (la de menor connectionId)
//   escribe la copia de `contenido` en Postgres. Antes cada cliente guardaba
//   su propio JSON completo y el último UPDATE en llegar ganaba, sin ser
//   necesariamente el estado final de Yjs.
// - `sincronizado`: el documento Yjs ya trajo el estado del servidor. Antes
//   de eso el editor puede estar vacío, y guardar ese vacío borraría el
//   contenido real.
// - `conectado`: hay conexión viva con la sala.
export type EstadoColaboracion = {
  esLider: boolean;
  sincronizado: boolean;
  conectado: boolean;
};

// El título del apunte viaja por la misma sala que el contenido (un Y.Text),
// así converge igual que el texto en vez de que cada persona lo reescriba en
// Postgres por su cuenta. `establecer` lo cambia localmente hacia la sala.
export type ControlTitulo = {
  establecer: (titulo: string) => void;
};

type EditorColaborativoInternoProps = {
  onEditorListo: (editor: Editor | null) => void;
  onEstadoColaboracion: (estado: EstadoColaboracion) => void;
  // `inicial` es true cuando es el título con el que arrancó la sala al
  // sincronizar, y false cuando lo cambió otra persona en vivo.
  onTituloRemoto: (titulo: string, inicial: boolean) => void;
  onControlTitulo: (control: ControlTitulo | null) => void;
};

function EditorColaborativoInterno({
  onEditorListo,
  onEstadoColaboracion,
  onTituloRemoto,
  onControlTitulo,
}: EditorColaborativoInternoProps) {
  const room = useRoom();
  const infoLocal = useSelf((yo) => yo.info, shallow);
  const conexionPropia = useSelf((yo) => yo.connectionId);
  const idsOtros = useOthersConnectionIds();
  const estadoConexion = useStatus();
  const provider = useMemo(() => getYjsProviderForRoom(room), [room]);
  const yDoc = useMemo(() => provider.getYDoc(), [provider]);

  const nombreLocal = infoLocal?.name ?? "Estudiante";
  const colorLocal = infoLocal?.color ?? colorParaUsuario("anonimo");

  const suscribirSincronizacion = useCallback(
    (avisar: () => void) => {
      provider.on("sync", avisar);
      return () => provider.off("sync", avisar);
    },
    [provider],
  );
  const sincronizado = useSyncExternalStore(
    suscribirSincronizacion,
    () => provider.synced,
    () => false,
  );

  const esLider =
    conexionPropia !== null &&
    conexionPropia !== undefined &&
    idsOtros.every((id) => conexionPropia < id);
  const conectado = estadoConexion === "connected";

  useEffect(() => {
    onEstadoColaboracion({ esLider, sincronizado, conectado });
  }, [esLider, sincronizado, conectado, onEstadoColaboracion]);

  const yTitulo = useMemo(() => yDoc.getText(NOMBRE_TEXTO_TITULO), [yDoc]);

  useEffect(() => {
    onControlTitulo({
      establecer: (titulo) => reemplazarTextoCompartido(yTitulo, titulo),
    });
    return () => onControlTitulo(null);
  }, [yTitulo, onControlTitulo]);

  // Cambios del título hechos por OTRA persona (`transaction.local` es false
  // para lo que llega por el proveedor).
  useEffect(() => {
    function alCambiar(_evento: unknown, transaccion: { local: boolean }) {
      if (!transaccion.local) onTituloRemoto(yTitulo.toString(), false);
    }
    yTitulo.observe(alCambiar);
    return () => yTitulo.unobserve(alCambiar);
  }, [yTitulo, onTituloRemoto]);

  // El título con el que ya está la sala al terminar de sincronizar. Vacío
  // no se aplica: significa que la sala aún no lo tiene y manda el de
  // Postgres, que ya está en el estado local.
  useEffect(() => {
    if (!sincronizado) return;
    const titulo = yTitulo.toString();
    if (titulo) onTituloRemoto(titulo, true);
  }, [sincronizado, yTitulo, onTituloRemoto]);

  // self (useSelf) puede devolver null en el primer render (la sesión de
  // Liveblocks todavía se está autorizando); nombreLocal/colorLocal van en
  // las dependencias para que el editor se recree una única vez cuando la
  // info real llega, en vez de un useEffect que llame a
  // editor.commands.updateUser(): eso dispara awareness.setLocalStateField,
  // que actualiza la presencia del room, que hace que useSelf() devuelva un
  // objeto nuevo, que retrigerea el efecto — un loop infinito confirmado en
  // consola ("Maximum update depth exceeded") en la primera prueba.
  const editor = useEditor(
    {
      extensions: [
        ...EXTENSIONES_ESQUEMA,
        Collaboration.configure({ document: yDoc }),
        CollaborationCursor.configure({
          provider,
          user: { name: nombreLocal, color: colorLocal },
        }),
        // Fuera de EXTENSIONES_ESQUEMA a propósito: esa lista define el
        // esquema con el que se siembra Yjs, y ni Paginacion ni
        // ComandoBarra definen nodos/marcas (solo decoraciones de vista y
        // comandos de UI), así que no necesitan estar ahí ni afectan la
        // invariante de esquema compartido con detalle-publicacion.tsx.
        Paginacion.configure({
          obtenerGeometria: obtenerGeometriaConfiguracionPagina,
          // Colaborativo: la paginación es solo una vista local, jamás una
          // edición que se replique a los demás por Yjs.
          permitirDivisionDeDocumento: false,
        }),
        BuscarReemplazar,
        ComandoBarra.configure({
          suggestion: {
            items: ({ query }: { query: string }) =>
              crearItemsComando().filter((item) =>
                item.titulo.toLowerCase().includes(query.toLowerCase()),
              ),
            render: crearRenderizadorComandos(),
          },
        }),
      ],
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: "tiptap-content focus:outline-none",
        },
        transformPasted: crearTransformPasted(),
        handleClick: manejarClicParaAbrirEnlace,
      },
    },
    [yDoc, provider, nombreLocal, colorLocal],
  );

  useEffect(() => {
    onEditorListo(editor);
  }, [editor, onEditorListo]);

  return (
    <div className="flex flex-1 flex-col gap-3">
      <PresenciaColaboradores
        estado={
          !conectado ? (sincronizado ? "sin-conexion" : "conectando") : sincronizado ? "sincronizado" : "conectando"
        }
      />
      <EditorContent editor={editor} className="flex-1" />
    </div>
  );
}

type EditorColaborativoProps = {
  apunteId: string;
  onEditorListo: (editor: Editor | null) => void;
  onEstadoColaboracion: (estado: EstadoColaboracion) => void;
  onTituloRemoto: (titulo: string, inicial: boolean) => void;
  onControlTitulo: (control: ControlTitulo | null) => void;
};

// Vive fuera de ClientSideSuspense (que no renderiza a sus hijos hasta que la
// sala conecta): si la autorización o la preparación de la sala falla, sin
// esto la persona vería "Conectando…" para siempre sin saber por qué.
function AvisoErrorDeConexion() {
  const [fallo, setFallo] = useState(false);
  useErrorListener(() => setFallo(true));
  const estado = useStatus();
  // Un error pasado deja de mostrarse en cuanto la sala vuelve a conectar.
  if (!fallo || estado === "connected") return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      No se pudo conectar con la coedición. Recarga la página para reintentar; tu apunte sigue
      guardado.
    </p>
  );
}

// Coedición en tiempo real vía Yjs, acotada a apuntes `group` con permiso
// `edit` (dueño o colaborador) — ver src/app/api/liveblocks-auth/route.ts,
// que es quien de verdad decide si esta sala se autoriza, y quien la siembra
// con el contenido de Postgres antes de que nadie se conecte.
export function EditorColaborativo({
  apunteId,
  onEditorListo,
  onEstadoColaboracion,
  onTituloRemoto,
  onControlTitulo,
}: EditorColaborativoProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={`apunte-${apunteId}`}>
        <AvisoErrorDeConexion />
        <ClientSideSuspense
          fallback={
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Conectando con la coedición en vivo…
            </div>
          }
        >
          <EditorColaborativoInterno
            onEditorListo={onEditorListo}
            onEstadoColaboracion={onEstadoColaboracion}
            onTituloRemoto={onTituloRemoto}
            onControlTitulo={onControlTitulo}
          />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
