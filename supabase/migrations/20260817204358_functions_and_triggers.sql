-- Funciones y triggers: updated_at automático, sincronización de publicaciones,
-- bloqueo de universidad, y helpers de RLS.

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.carpetas
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.apuntes
  for each row execute function public.set_updated_at();

-- Crea la publicación la primera vez que un apunte se vuelve community.
-- No se borra al despublicar (se oculta vía RLS, ver rls_social.sql), así que
-- al re-publicar se reutiliza la misma fila (on conflict do nothing).
create or replace function private.sync_publicacion()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.visibilidad = 'community' then
    insert into public.publicaciones (apunte_id)
    values (new.id)
    on conflict (apunte_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger sync_publicacion_trigger
  after insert or update of visibilidad on public.apuntes
  for each row execute function private.sync_publicacion();

-- La universidad queda fija según el dominio institucional del correo con el
-- que se creó la cuenta; no se puede editar desde el perfil.
create or replace function private.bloquear_cambio_universidad()
returns trigger language plpgsql as $$
begin
  if new.universidad is distinct from old.universidad then
    raise exception 'No se puede cambiar la universidad asignada al perfil';
  end if;
  return new;
end;
$$;

create trigger bloquear_cambio_universidad_trigger
  before update on public.profiles
  for each row execute function private.bloquear_cambio_universidad();

-- Helpers de RLS. security definer evita la recursión de políticas (consultan
-- tablas que ellas mismas ayudan a proteger) y son más rápidos que repetir la
-- subconsulta en cada policy.

create or replace function private.owns_apunte(target_apunte_id uuid)
returns boolean language sql security definer set search_path = '' stable
as $$
  select exists (
    select 1 from public.apuntes a
    where a.id = target_apunte_id and a.autor_id = (select auth.uid())
  );
$$;

create or replace function private.can_edit_apunte(target_apunte_id uuid)
returns boolean language sql security definer set search_path = '' stable
as $$
  select private.owns_apunte(target_apunte_id)
    or exists (
      select 1 from public.colaboradores c
      where c.apunte_id = target_apunte_id
        and c.perfil_id = (select auth.uid())
        and c.permiso = 'edit'
    );
$$;

create or replace function private.can_read_group_apunte(target_apunte_id uuid)
returns boolean language sql security definer set search_path = '' stable
as $$
  select exists (
    select 1 from public.apuntes a
    join public.colaboradores c on c.apunte_id = a.id
    where a.id = target_apunte_id
      and a.visibilidad = 'group'
      and c.perfil_id = (select auth.uid())
  );
$$;

-- true si la publicación debe ser visible: el apunte asociado es community
-- ahora mismo, o quien consulta es dueño/colaborador de ese apunte (para ver
-- su propio historial oculto tras despublicar). Al ser security definer,
-- consulta publicaciones/apuntes sin volver a pasar por RLS, así se puede
-- usar dentro de las políticas de esas mismas tablas sin recursión.
create or replace function private.can_view_publicacion(target_publicacion_id uuid)
returns boolean language sql security definer set search_path = '' stable
as $$
  select exists (
    select 1 from public.publicaciones p
    join public.apuntes a on a.id = p.apunte_id
    where p.id = target_publicacion_id
      and (
        a.visibilidad = 'community'
        or a.autor_id = (select auth.uid())
        or private.can_edit_apunte(a.id)
        or private.can_read_group_apunte(a.id)
      )
  );
$$;

-- Se revoca el EXECUTE por defecto a PUBLIC (nadie puede llamarlas por RPC,
-- aunque tampoco estarían expuestas porque `private` no es un esquema
-- expuesto por PostgREST) y se concede explícitamente solo a `authenticated`,
-- que es el único rol que las invoca directamente desde una policy. `anon`
-- no las necesita: sus policies usan subconsultas propias. Las llamadas
-- anidadas entre estas funciones (por ejemplo can_view_publicacion llamando
-- a can_edit_apunte) corren con los privilegios del dueño de la función por
-- ser security definer, así que no requieren un grant aparte.
revoke execute on function private.owns_apunte(uuid) from public;
revoke execute on function private.can_edit_apunte(uuid) from public;
revoke execute on function private.can_read_group_apunte(uuid) from public;
revoke execute on function private.can_view_publicacion(uuid) from public;

grant execute on function private.owns_apunte(uuid) to authenticated;
grant execute on function private.can_edit_apunte(uuid) to authenticated;
grant execute on function private.can_read_group_apunte(uuid) to authenticated;
grant execute on function private.can_view_publicacion(uuid) to authenticated;
