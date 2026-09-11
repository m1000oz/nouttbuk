-- RPC pública para leer un apunte por su enlace de compartir, sin sesión.
--
-- No hay policy de RLS en `apuntes` para esto a propósito: el acceso no
-- depende de `visibilidad` (a diferencia de `apuntes_select_anon_community`),
-- depende únicamente de conocer el `enlace_token`, que es un uuid no
-- adivinable generado por el dueño desde `EnlacePublicoSheet`. Por eso el
-- filtro acá es solo `a.enlace_token = p_token`, sin condición de
-- `visibilidad`: un apunte `private` o `group` con enlace activo debe verse
-- igual que uno `community`. Vive en `public` (no en `private`, como el
-- resto de helpers de RLS) porque debe ser invocable como RPC de PostgREST
-- por anon y authenticated.
--
-- Los campos devueltos son exactamente los que ya se consideran seguros de
-- exponer a `anon` en el feed de Comunidad (ver `consultaFeedComunidad`):
-- título, contenido, fecha, nombre de curso y datos públicos del autor.
-- Deliberadamente NO se exponen `carpeta_id`/`etiquetas`/`favorito`, que son
-- organización interna del dueño, no algo que un enlace de solo lectura
-- deba revelar.
create or replace function public.obtener_apunte_compartido(p_token uuid)
returns table (
  id uuid,
  titulo text,
  contenido jsonb,
  created_at timestamptz,
  curso_nombre text,
  autor_id uuid,
  autor_nombre text,
  autor_usuario text,
  autor_avatar_url text
)
language sql security definer set search_path = '' stable
as $$
  select
    a.id, a.titulo, a.contenido, a.created_at,
    c.nombre, a.autor_id, p.nombre, p.usuario, p.avatar_url
  from public.apuntes a
  join public.profiles p on p.id = a.autor_id
  left join public.cursos c on c.id = a.curso_id
  where a.enlace_token = p_token;
$$;

revoke execute on function public.obtener_apunte_compartido(uuid) from public;
grant execute on function public.obtener_apunte_compartido(uuid) to anon, authenticated;
