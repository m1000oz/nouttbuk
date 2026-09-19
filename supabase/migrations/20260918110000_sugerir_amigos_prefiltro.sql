-- sugerir_amigos() (20260910142000_sugerir_amigos.sql, ajustada en
-- 20260917050000_fix_seguridad_amigos.sql) escaneaba TODO public.profiles
-- no conectado y corría un `count(*)` correlacionado contra amistades por
-- cada candidato, antes de ordenar con random() y recién ahí aplicar
-- `limit`. A la escala actual (una sola universidad, un puñado de
-- perfiles) es barato, pero sin ningún tope previo esa subconsulta
-- correlacionada, la parte realmente cara, se ejecutaría contra cada fila
-- de profiles sin conexión, degradando de forma no lineal según crezca la
-- base de usuarios.
--
-- Fix: nueva CTE `candidatos` que aplica `order by random() limit
-- greatest(limite * 20, 200)` ANTES de calcular amigos_en_comun, así la
-- subconsulta correlacionada contra amistades corre como máximo sobre un
-- número acotado de filas sin importar cuánto crezca profiles, no sobre
-- toda la tabla. A la escala de hoy esto es un no-op real: con `limite=10`
-- (el valor que usa sugerencias-carrusel.tsx) el tope es 200, muy por
-- encima de la cantidad real de perfiles que existen hoy, así que el
-- resultado no cambia, solo queda protegido antes de que sea un problema.
--
-- Deliberadamente NO se agrega un filtro por `universidad`/`carrera_id`
-- en esta pasada: hoy todos los perfiles comparten la misma universidad
-- (dominio @pucp.edu.pe, ver dominio-institucional.ts), así que ese
-- filtro sería un no-op sin ningún beneficio real hasta que exista
-- soporte multi-universidad (diferido a v2.0 en todo.md), momento en el
-- que sí valdría la pena revisar esta función de nuevo con datos reales
-- de más de una universidad para no filtrar candidatos por error.
--
-- Misma firma, mismas columnas de salida, misma lógica de `razon` y
-- `order by`, mismo chequeo de seguridad `perfil_id = auth.uid()` en cada
-- CTE (cubierto por supabase/tests/database/44_amistades_seguridad.test.sql).
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
  candidatos as (
    select p.id, p.nombre, p.usuario, p.avatar_url, p.carrera_id, p.universidad
    from public.profiles p
    where perfil_id = auth.uid()
      and p.id != perfil_id
      and p.id not in (select amigo_id from mis_conexiones)
    order by random()
    limit greatest(limite * 20, 200)
  ),
  potenciales as (
    select
      c.id,
      c.nombre,
      c.usuario,
      c.avatar_url,
      c.carrera_id,
      c.universidad,
      (
        select count(*)
        from public.amistades a
        where (
          (a.solicitante_id = c.id and a.receptor_id in (select amigo_id from mis_amigos))
          or
          (a.receptor_id = c.id and a.solicitante_id in (select amigo_id from mis_amigos))
        )
        and a.estado = 'aceptada'
      ) as amigos_en_comun
    from candidatos c
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
