create or replace function public.sugerir_amigos(perfil_id uuid, limite int default 10)
returns table (
  id uuid,
  nombre text,
  usuario text,
  avatar_url text,
  carrera_id text,
  universidad text,
  amigos_en_comun bigint,
  razon text
)
language sql security definer set search_path = '' stable
as $$
  with mis_amigos as (
    select case 
             when solicitante_id = perfil_id then receptor_id 
             else solicitante_id 
           end as amigo_id
    from public.amistades
    where (solicitante_id = perfil_id or receptor_id = perfil_id)
      and estado = 'aceptada'
  ),
  mis_conexiones as (
    select case 
             when solicitante_id = perfil_id then receptor_id 
             else solicitante_id 
           end as amigo_id
    from public.amistades
    where solicitante_id = perfil_id or receptor_id = perfil_id
  ),
  mi_info as (
    select carrera_id, universidad from public.profiles where id = perfil_id
  ),
  potenciales as (
    select 
      p.id,
      p.nombre,
      p.usuario,
      p.avatar_url,
      p.carrera_id,
      p.universidad,
      (
        select count(*)
        from public.amistades a
        where (
          (a.solicitante_id = p.id and a.receptor_id in (select amigo_id from mis_amigos))
          or 
          (a.receptor_id = p.id and a.solicitante_id in (select amigo_id from mis_amigos))
        )
        and a.estado = 'aceptada'
      ) as amigos_en_comun
    from public.profiles p
    where p.id != perfil_id
      and p.id not in (select amigo_id from mis_conexiones)
  )
  select 
    pot.id,
    pot.nombre,
    pot.usuario,
    pot.avatar_url,
    pot.carrera_id,
    pot.universidad,
    pot.amigos_en_comun,
    case 
      when pot.amigos_en_comun > 0 then pot.amigos_en_comun::text || ' amigos en común'
      when pot.carrera_id is not null and pot.carrera_id = (select carrera_id from mi_info) then 'Misma carrera'
      when pot.universidad is not null and pot.universidad = (select universidad from mi_info) then 'Misma universidad'
      else 'Sugerido para ti'
    end as razon
  from potenciales pot
  order by 
    pot.amigos_en_comun desc,
    case when pot.carrera_id = (select carrera_id from mi_info) then 1 else 0 end desc,
    case when pot.universidad = (select universidad from mi_info) then 1 else 0 end desc,
    random()
  limit limite;
$$;

revoke execute on function public.sugerir_amigos(uuid, int) from public;
grant execute on function public.sugerir_amigos(uuid, int) to authenticated;
