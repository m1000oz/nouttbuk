-- Board de feedback (todo.md ítem 11): ideas propuestas por la comunidad de
-- usuarios autenticados, con voto y estado. El estado (nueva/en_revision/
-- hecho) lo cambia el dueño del producto directamente en la base de datos,
-- no hay rol admin en el MVP, así que no hay policy de update expuesta a
-- authenticated, mismo criterio que "comentarios: sin edición" en
-- 20260817204400_rls_social.sql.

create type public.feedback_estado as enum ('nueva', 'en_revision', 'hecho');

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references public.profiles(id) on delete cascade,
  texto text not null,
  estado public.feedback_estado not null default 'nueva',
  created_at timestamptz not null default now()
);
create index feedback_created_at_idx on public.feedback (created_at desc);

create table public.feedback_votos (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback(id) on delete cascade,
  perfil_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (feedback_id, perfil_id)
);
create index feedback_votos_perfil_idx on public.feedback_votos (perfil_id);

-- Board cerrado a la comunidad de usuarios autenticados (no es el feed
-- público de comunidad), así que no hay policy ni grant para anon.
alter table public.feedback enable row level security;

create policy feedback_select_authenticated on public.feedback
  for select to authenticated
  using (true);

create policy feedback_insert_self on public.feedback
  for insert to authenticated
  with check (autor_id = (select auth.uid()));

create policy feedback_delete_self on public.feedback
  for delete to authenticated
  using (autor_id = (select auth.uid()));

alter table public.feedback_votos enable row level security;

create policy feedback_votos_select_authenticated on public.feedback_votos
  for select to authenticated
  using (true);

create policy feedback_votos_insert_self on public.feedback_votos
  for insert to authenticated
  with check (perfil_id = (select auth.uid()));

create policy feedback_votos_delete_self on public.feedback_votos
  for delete to authenticated
  using (perfil_id = (select auth.uid()));

-- Grant explícito, sin este paso Postgres deniega a nivel de tabla antes de
-- llegar a evaluar RLS (mismo gotcha que 20260818053857_table_grants.sql).
-- anon no tiene policy propia en ninguna de las dos tablas, pero igual
-- necesita el grant de select para que la consulta devuelva cero filas por
-- RLS en vez de "permission denied" (mismo criterio que reacciones/
-- guardados/comentarios en esa misma migración).
grant select on public.feedback to anon;
grant select, insert, delete on public.feedback to authenticated;
grant select on public.feedback_votos to anon;
grant select, insert, delete on public.feedback_votos to authenticated;
