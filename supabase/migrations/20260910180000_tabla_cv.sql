-- CV propio y editable (todo.md, sección CV): un único documento por
-- persona, editado con el mismo motor Tiptap que los apuntes, no un archivo
-- ajeno. `autor_id` es la PK directa en vez de un `id` surrogate: es una
-- relación 1:1 real con `profiles`, ninguna otra tabla referencia una fila
-- de `cv` por su propio id, y así el upsert desde la app es directo
-- (`.eq("autor_id", user.id)`) sin un paso de lookup previo.
--
-- A diferencia de `feedback` (board cerrado a la comunidad autenticada, pero
-- igual visible entre usuarios), un CV nunca es público ni compartido: no
-- hay policy ni grant para `anon` en absoluto, ni siquiera de solo lectura.
create table public.cv (
  autor_id uuid primary key references public.profiles(id) on delete cascade,
  contenido jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cv enable row level security;

create policy cv_select_self on public.cv
  for select to authenticated
  using (autor_id = (select auth.uid()));

create policy cv_insert_self on public.cv
  for insert to authenticated
  with check (autor_id = (select auth.uid()));

create policy cv_update_self on public.cv
  for update to authenticated
  using (autor_id = (select auth.uid()))
  with check (autor_id = (select auth.uid()));

create policy cv_delete_self on public.cv
  for delete to authenticated
  using (autor_id = (select auth.uid()));

-- Grant explícito, sin este paso Postgres deniega a nivel de tabla antes de
-- llegar a evaluar RLS (mismo gotcha que 20260818053857_table_grants.sql,
-- visto ya dos veces en este proyecto). anon no recibe ningún grant acá a
-- propósito: sin ninguna policy ni grant para ese rol, una consulta desde
-- anon debe fallar con "permission denied", no devolver cero filas, porque
-- el CV nunca es un recurso público como sí lo son partes de `feedback`.
grant select, insert, update, delete on public.cv to authenticated;

create trigger set_updated_at before update on public.cv
  for each row execute function public.set_updated_at();
