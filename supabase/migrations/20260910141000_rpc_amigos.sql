create or replace function public.obtener_amigos(perfil_id uuid)
returns setof public.profiles
language sql security definer set search_path = '' stable
as $$
  select p.*
  from public.amistades a
  join public.profiles p on (p.id = a.solicitante_id or p.id = a.receptor_id)
  where (a.solicitante_id = perfil_id or a.receptor_id = perfil_id)
  and p.id != perfil_id
  and a.estado = 'aceptada'
  order by p.nombre asc;
$$;

revoke execute on function public.obtener_amigos(uuid) from public;
grant execute on function public.obtener_amigos(uuid) to authenticated;

create or replace function public.obtener_solicitudes_pendientes(perfil_id uuid)
returns setof public.profiles
language sql security definer set search_path = '' stable
as $$
  select p.*
  from public.amistades a
  join public.profiles p on p.id = a.solicitante_id
  where a.receptor_id = perfil_id
  and a.estado = 'pendiente'
  order by a.created_at desc;
$$;

revoke execute on function public.obtener_solicitudes_pendientes(uuid) from public;
grant execute on function public.obtener_solicitudes_pendientes(uuid) to authenticated;
