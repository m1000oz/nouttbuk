-- Dos bugs de seguridad reales encontrados en el Motor de Amigos, confirmados
-- con pruebas directas contra el stack local antes de escribir este fix (no
-- solo leyendo el código):
--
-- 1) La política de UPDATE de `amistades` (20260910140000_motor_de_amigos.sql)
--    dejaba al `solicitante` cambiar `estado` a lo que quisiera, sin ninguna
--    restricción, en su propia rama del `with check`. Un `solicitante` podía
--    hacer `update amistades set estado = 'aceptada' where solicitante_id =
--    auth.uid() and receptor_id = <cualquiera>` y auto-aceptar su propia
--    solicitud sin que la otra persona interviniera. Confirmado con un UPDATE
--    real ejecutado como el solicitante: quedó "aceptada" sin acción del
--    receptor. El comentario original de esa política ya advertía esto
--    ("Solicitante no debería poder cambiar a aceptada por sí solo, pero
--    podemos dejar la validación simple o estricta") y quedó sin resolver.
--    Fix: el solicitante ya no puede hacer NINGÚN update (si quiere
--    cancelar su propia solicitud, ya puede borrarla, la política de DELETE
--    se lo permite y el frontend nunca dependía de un UPDATE hecho por el
--    solicitante).
--
-- 2) `obtener_amigos(perfil_id)`, `obtener_solicitudes_pendientes(perfil_id)`
--    y `sugerir_amigos(perfil_id, limite)` son `security definer` (evaden RLS
--    a propósito) pero nunca validaban que `perfil_id` fuera quien las
--    llamaba. Cualquier autenticado podía pasar el id de perfil de otra
--    persona (público, visible en `/u/[usuario]`) y leer su lista de amigos
--    o sus solicitudes pendientes recibidas. Confirmado en vivo: un usuario
--    A sin ninguna relación con B pudo leer que B es amigo de C llamando
--    `obtener_amigos(B)`.
--    Fix: cada función ahora exige `perfil_id = auth.uid()` y devuelve un
--    conjunto vacío si no coincide (mismo comportamiento silencioso que ya
--    produce RLS en el resto del proyecto para un acceso no autorizado, no
--    un error que delate la existencia de la función).
--
-- Ninguna de las dos correcciones necesita cambios en el frontend: el código
-- de la app siempre llamó estas funciones con el propio id (`user.id`), y el
-- único UPDATE existente en el código (`responderSolicitud` en
-- amigos-view.tsx) siempre lo ejecuta el receptor, nunca el solicitante.

drop policy "Los usuarios pueden aceptar/rechazar solicitudes recibidas o actualizar propias (cancelar)" on public.amistades;

create policy "Solo el receptor puede aceptar o rechazar una solicitud"
  on public.amistades for update to authenticated
  using (auth.uid() = receptor_id)
  with check (auth.uid() = receptor_id and estado in ('aceptada', 'rechazada'));

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
  and perfil_id = auth.uid()
  order by p.nombre asc;
$$;

create or replace function public.obtener_solicitudes_pendientes(perfil_id uuid)
returns setof public.profiles
language sql security definer set search_path = '' stable
as $$
  select p.*
  from public.amistades a
  join public.profiles p on p.id = a.solicitante_id
  where a.receptor_id = perfil_id
  and a.estado = 'pendiente'
  and perfil_id = auth.uid()
  order by a.created_at desc;
$$;

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
      and perfil_id = auth.uid()
  ),
  mis_conexiones as (
    select case
             when solicitante_id = perfil_id then receptor_id
             else solicitante_id
           end as amigo_id
    from public.amistades
    where (solicitante_id = perfil_id or receptor_id = perfil_id)
      and perfil_id = auth.uid()
  ),
  mi_info as (
    select carrera_id, universidad from public.profiles
    where id = perfil_id and perfil_id = auth.uid()
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
    where perfil_id = auth.uid()
      and p.id != perfil_id
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
