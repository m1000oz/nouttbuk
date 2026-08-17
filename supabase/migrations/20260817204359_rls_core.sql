-- Políticas RLS: profiles, carpetas, apuntes.
-- Regla general: rutas de lectura pública (anon) separadas de las autenticadas.

alter table public.profiles enable row level security;

-- Info básica visible públicamente (aparece como autor en el feed sin login).
create policy profiles_select_public on public.profiles
  for select to anon, authenticated using (true);

-- Solo el propio usuario edita su fila; la fila se crea solo vía el trigger
-- de auth.users (auth_domain_restriction.sql), no hay policy de insert.
create policy profiles_update_self on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Las carpetas nunca son públicas, ni siquiera si contienen apuntes community
-- (la materia es organización personal del dueño).
alter table public.carpetas enable row level security;

create policy carpetas_owner_all on public.carpetas
  for all to authenticated
  using ((select auth.uid()) = propietario_id)
  with check ((select auth.uid()) = propietario_id);

-- Apuntes: lectura pública SOLO para visibilidad community actual.
alter table public.apuntes enable row level security;

create policy apuntes_select_anon_community on public.apuntes
  for select to anon
  using (visibilidad = 'community');

create policy apuntes_select_authenticated on public.apuntes
  for select to authenticated
  using (
    visibilidad = 'community'
    or autor_id = (select auth.uid())
    or private.can_read_group_apunte(id)
  );

create policy apuntes_insert_own on public.apuntes
  for insert to authenticated
  with check (autor_id = (select auth.uid()));

create policy apuntes_update_editable on public.apuntes
  for update to authenticated
  using (private.can_edit_apunte(id))
  with check (private.can_edit_apunte(id));

create policy apuntes_delete_owner on public.apuntes
  for delete to authenticated
  using (autor_id = (select auth.uid()));
