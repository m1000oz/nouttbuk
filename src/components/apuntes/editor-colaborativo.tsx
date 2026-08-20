"use client";

import { useEffect, useMemo } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
  useRoom,
  useOthers,
  useSelf,
} from "@liveblocks/react";
import { getYjsProviderForRoom } from "@liveblocks/yjs";
import { prosemirrorJSONToYXmlFragment } from "y-prosemirror";
import { useEditor, EditorContent, getSchema, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";
import CharacterCount from "@tiptap/extension-character-count";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { UsersThreeIcon } from "@phosphor-icons/react";

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
} from "@/components/ui/avatar";
import { colorParaUsuario } from "@/lib/liveblocks/color-usuario";
import type { Json } from "@/lib/types/database.types";

// Tiene que coincidir con editor-estatico.tsx y detalle-publicacion.tsx: si
// un apunte con negrita/resaltado/enlaces se coedita acá, se lee en modo
// solo lectura, o se publica a Comunidad, tiene que verse igual en los tres
// lugares. `history` queda apagado (lo maneja Yjs vía Collaboration), y este
// mismo array alimenta tanto el editor en vivo como getSchema() más abajo.
const EXTENSIONES_ESQUEMA = [
  StarterKit.configure({ history: false }),
  Underline,
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  Link.configure({ openOnClick: false, autolink: true }),
  CharacterCount,
];

function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function PresenciaColaboradores() {
  const self = useSelf();
  const otros = useOthers();

  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/50 px-3 py-2">
      <UsersThreeIcon className="size-4 text-muted-foreground" aria-hidden />
      <span className="text-sm text-muted-foreground">
        {otros.length > 0
          ? "Coeditando ahora:"
          : "Coedición en vivo activa."}
      </span>
      {otros.length > 0 && (
        <AvatarGroup>
          {self && (
            <Avatar size="sm">
              <AvatarFallback>{iniciales(self.info.name)}</AvatarFallback>
              <AvatarBadge style={{ backgroundColor: self.info.color }} />
            </Avatar>
          )}
          {otros.map((otro) => (
            <Avatar key={otro.connectionId} size="sm">
              <AvatarFallback>{iniciales(otro.info.name)}</AvatarFallback>
              <AvatarBadge style={{ backgroundColor: otro.info.color }} />
            </Avatar>
          ))}
        </AvatarGroup>
      )}
    </div>
  );
}

type EditorColaborativoInternoProps = {
  contenidoInicial?: Json;
  onEditorListo: (editor: Editor | null) => void;
};

function EditorColaborativoInterno({
  contenidoInicial,
  onEditorListo,
}: EditorColaborativoInternoProps) {
  const room = useRoom();
  const self = useSelf();
  const provider = useMemo(() => getYjsProviderForRoom(room), [room]);
  const yDoc = useMemo(() => provider.getYDoc(), [provider]);

  const nombreLocal = self?.info.name ?? "Estudiante";
  const colorLocal = self?.info.color ?? colorParaUsuario("anonimo");

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
      ],
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: "tiptap-content focus:outline-none",
        },
      },
    },
    [yDoc, provider, nombreLocal, colorLocal],
  );

  // Siembra el contenido existente en Postgres solo la primera vez que la
  // sala está realmente vacía (confirmado tras sincronizar con el servidor,
  // no solo localmente vacío por carga en curso). y-prosemirror documenta
  // que esta función es para importar contenido una sola vez, no para
  // rehidratar un doc que ya tiene historia, encaja exacto con este caso.
  useEffect(() => {
    function alSincronizar(isSynced: boolean) {
      if (!isSynced || !contenidoInicial) return;
      const fragmento = yDoc.getXmlFragment("default");
      if (fragmento.length === 0) {
        const schema = getSchema(EXTENSIONES_ESQUEMA);
        prosemirrorJSONToYXmlFragment(schema, contenidoInicial, fragmento);
      }
    }
    provider.on("sync", alSincronizar);
    return () => provider.off("sync", alSincronizar);
  }, [provider, yDoc, contenidoInicial]);

  useEffect(() => {
    onEditorListo(editor);
  }, [editor, onEditorListo]);

  return (
    <div className="flex flex-1 flex-col gap-3">
      <PresenciaColaboradores />
      <EditorContent editor={editor} className="flex-1" />
    </div>
  );
}

type EditorColaborativoProps = {
  apunteId: string;
  contenidoInicial?: Json;
  onEditorListo: (editor: Editor | null) => void;
};

// Coedición en tiempo real vía Yjs, acotada a apuntes `group` con permiso
// `edit` (dueño o colaborador) — ver src/app/api/liveblocks-auth/route.ts,
// que es quien de verdad decide si esta sala se autoriza o no.
export function EditorColaborativo({
  apunteId,
  contenidoInicial,
  onEditorListo,
}: EditorColaborativoProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={`apunte-${apunteId}`}>
        <ClientSideSuspense
          fallback={
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Conectando con la coedición en vivo…
            </div>
          }
        >
          <EditorColaborativoInterno
            contenidoInicial={contenidoInicial}
            onEditorListo={onEditorListo}
          />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
