-- RPC pública de conteos agregados para el feed de Comunidad.
--
-- anon no tiene (ni debe tener) policy de select sobre reacciones/guardados/
-- comentarios: esas filas son privadas, solo se exponen agregadas. Vive en
-- `public` (no en `private`, como el resto de helpers de RLS) porque debe
-- ser invocable como RPC de PostgREST por anon y authenticated.
--
-- El filtro `a.visibilidad = 'community'` es incondicional, a diferencia de
-- private.can_view_publicacion (que también deja ver al dueño su propio
-- historial oculto): así esta función nunca revela "esto tuvo N reacciones"
-- de un apunte que ya no es community, sin importar quién la llame. Por eso
-- solo sirve para el feed/detalle público, no para una futura pantalla de
-- "mis publicaciones" que necesite ver el propio historial oculto.
create or replace function public.get_publicacion_counts(publicacion_ids uuid[])
returns table (
  publicacion_id uuid,
  reacciones bigint,
  guardados bigint,
  comentarios bigint
)
language sql security definer set search_path = '' stable
as $$
  select
    p.id,
    (select count(*) from public.reacciones r where r.publicacion_id = p.id),
    (select count(*) from public.guardados g where g.publicacion_id = p.id),
    (select count(*) from public.comentarios c where c.publicacion_id = p.id)
  from public.publicaciones p
  join public.apuntes a on a.id = p.apunte_id
  where p.id = any(publicacion_ids)
    and a.visibilidad = 'community';
$$;

revoke execute on function public.get_publicacion_counts(uuid[]) from public;
grant execute on function public.get_publicacion_counts(uuid[]) to anon, authenticated;
