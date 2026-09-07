import { useState } from "react";
import type { Editor } from "@tiptap/react";

import { createClient } from "@/lib/supabase/client";

const TAMANO_MAXIMO_IMAGEN = 5 * 1024 * 1024;

// Sube la imagen al bucket apunte-imagenes (público, mismo modelo de RLS que
// avatars: escritura solo dentro de la propia carpeta {user_id}/...) y la
// inserta en el punto del cursor. Extraído de EditorToolbar para que tanto
// el botón de la barra como el ítem "Insertar > Imagen" del menú compartan
// la misma lógica de subida en vez de reimplementarla.
export function useSubirImagenApunte(editor: Editor | null) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState(false);

  async function subirArchivo(archivo: File) {
    if (!editor) return;

    if (!archivo.type.startsWith("image/")) {
      setError(true);
      return;
    }
    if (archivo.size > TAMANO_MAXIMO_IMAGEN) {
      setError(true);
      return;
    }

    setError(false);
    setSubiendo(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSubiendo(false);
      setError(true);
      return;
    }

    const extension = archivo.name.split(".").pop() ?? "jpg";
    const ruta = `${user.id}/${Date.now()}.${extension}`;

    const { error: subidaError } = await supabase.storage
      .from("apunte-imagenes")
      .upload(ruta, archivo);

    setSubiendo(false);

    if (subidaError) {
      setError(true);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("apunte-imagenes").getPublicUrl(ruta);

    editor.chain().focus().setImage({ src: publicUrl }).run();
  }

  return { subiendo, error, subirArchivo };
}
