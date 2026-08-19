-- RPC de stats propias para la pantalla de Perfil (apuntes/aportes/contactos).
--
-- Sin parámetros: siempre son "mis propias stats" (auth.uid()), no hay
-- pantalla de perfil público de terceros en el alcance actual. "apuntes"
-- (autor_id = auth.uid()) ya sería un select directo válido bajo
-- apuntes_select_authenticated, pero "aportes" necesita leer reacciones de
-- OTRAS personas sobre las publicaciones propias, y la RLS de reacciones
-- solo deja ver perfil_id = auth.uid() (fila propia), así que sin
-- security definer es imposible. "contactos" se agrupa acá por prolijidad,
-- igual que get_publicacion_counts agrupó sus tres conteos.
create or replace function public.get_perfil_stats()
returns table (apuntes bigint, aportes bigint, contactos bigint)
language sql security definer set search_path = '' stable
as $$
  select
    (select count(*) from public.apuntes a where a.autor_id = auth.uid()),
    (select count(*)
       from public.reacciones r
       join public.publicaciones p on p.id = r.publicacion_id
       join public.apuntes a on a.id = p.apunte_id
       where a.autor_id = auth.uid()),
    -- "contactos": personas únicas con quienes se comparte al menos un
    -- apunte, como dueño (colaboradores invitados) o como colaborador
    -- invitado (dueños de esos apuntes). UNION ya deduplica.
    (select count(*) from (
       select co.perfil_id as persona
       from public.colaboradores co
       join public.apuntes a on a.id = co.apunte_id
       where a.autor_id = auth.uid()
       union
       select a.autor_id as persona
       from public.colaboradores co
       join public.apuntes a on a.id = co.apunte_id
       where co.perfil_id = auth.uid()
     ) contactos);
$$;

revoke execute on function public.get_perfil_stats() from public;
grant execute on function public.get_perfil_stats() to authenticated;
