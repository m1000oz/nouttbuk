import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PerfilPublicoHeader } from "@/components/perfil/perfil-publico-header";
import { FeedComunidad } from "@/components/comunidad/feed-comunidad";
import {
  consultaPublicacionesDeUsuario,
  mapearPublicacionFeed,
  type ConteosPublicacion,
} from "@/lib/comunidad/consultas";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr";

type Params = Promise<{ usuario: string }>;

export default async function PerfilPublicoPage(props: { params: Params }) {
  const { usuario } = await props.params;
  const decodedUsuario = decodeURIComponent(usuario);

  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // Buscar perfil
  const { data: perfil, error } = await supabase
    .from("profiles")
    .select("id, nombre, usuario, avatar_url, universidad, carrera:carreras(nombre)")
    .eq("usuario", decodedUsuario)
    .single();

  if (error || !perfil) {
    notFound();
  }

  // Buscar estado de amistad si hay usuario logueado
  let estadoAmistad = null;
  let soySolicitante = false;
  if (currentUser && currentUser.id !== perfil.id) {
    const { data: amistad } = await supabase
      .from("amistades")
      .select("*")
      .or(`and(solicitante_id.eq.${currentUser.id},receptor_id.eq.${perfil.id}),and(solicitante_id.eq.${perfil.id},receptor_id.eq.${currentUser.id})`)
      .maybeSingle();

    if (amistad) {
      estadoAmistad = amistad.estado;
      soySolicitante = amistad.solicitante_id === currentUser.id;
    }
  }

  // Buscar apuntes públicos
  const { data: publicaciones } = await consultaPublicacionesDeUsuario(supabase, perfil.id);
  const filas = publicaciones ?? [];

  let conteosPorId = new Map<string, ConteosPublicacion>();
  if (filas.length > 0) {
    const { data: conteos } = await supabase.rpc("get_publicacion_counts", {
      publicacion_ids: filas.map((f) => f.id),
    });
    conteosPorId = new Map(
      (conteos ?? []).map((c) => [
        c.publicacion_id,
        {
          reacciones: c.reacciones,
          guardados: c.guardados,
          comentarios: c.comentarios,
        },
      ])
    );
  }

  const hayPublicaciones = filas.length > 0;

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 max-w-4xl mx-auto w-full">
      <PerfilPublicoHeader
        perfil={perfil}
        miId={currentUser?.id ?? null}
        estadoAmistadInicial={estadoAmistad as any}
        soySolicitanteInicial={soySolicitante}
      />

      <div className="mt-8 border-t pt-8">
        <h2 className="text-xl font-bold mb-6">Apuntes públicos</h2>
        
        {hayPublicaciones ? (
          <FeedComunidad
            publicacionesIniciales={filas.map((f) =>
              mapearPublicacionFeed(f, conteosPorId)
            )}
            hayMasIniciales={false} // Para un perfil, podemos no paginar para simplificar, o cargar más
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-2xl bg-muted/30">
            <UsersThreeIcon className="size-8 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm max-w-sm">
              Este usuario aún no ha publicado apuntes en la comunidad.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
