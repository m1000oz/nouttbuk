-- Post-its y tareas rápidas de las Herramientas PRO vivían solo en
-- localStorage (sin cuenta, sin sincronizar entre dispositivos, bug
-- reportado por un usuario). A partir de esta migración ambas requieren
-- sesión, mismo patrón que 20260910180000_tabla_cv.sql: autor_id referencia
-- profiles(id), RLS con 4 policies por operación, grants explícitos solo
-- para authenticated (nunca anon, estas herramientas no son públicas), y el
-- trigger compartido set_updated_at().
--
-- El estado EN VIVO del pomodoro (tiempo restante, si está corriendo, tema,
-- meta, ciclo) sigue siendo exclusivamente local, decisión explícita de
-- producto: solo la CONFIGURACIÓN (duraciones, auto-inicio) se sincroniza,
-- en pomodoro_configuracion, con autor_id como PK directa (relación 1:1 con
-- profiles, mismo criterio que cv.autor_id).

create table public.notas_adhesivas (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references public.profiles(id) on delete cascade,
  texto text not null default '',
  color text not null default 'yellow',
  carpeta_id uuid references public.carpetas(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notas_adhesivas_autor_idx on public.notas_adhesivas (autor_id);
create index notas_adhesivas_carpeta_idx on public.notas_adhesivas (carpeta_id);

create table public.tareas_rapidas (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references public.profiles(id) on delete cascade,
  texto text not null,
  completada boolean not null default false,
  carpeta_id uuid references public.carpetas(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tareas_rapidas_autor_idx on public.tareas_rapidas (autor_id);
create index tareas_rapidas_carpeta_idx on public.tareas_rapidas (carpeta_id);

create table public.pomodoro_configuracion (
  autor_id uuid primary key references public.profiles(id) on delete cascade,
  work_duration integer not null default 25,
  break_duration integer not null default 5,
  long_break_duration integer not null default 15,
  long_break_interval integer not null default 4,
  auto_start boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notas_adhesivas enable row level security;
alter table public.tareas_rapidas enable row level security;
alter table public.pomodoro_configuracion enable row level security;

create policy notas_adhesivas_select_self on public.notas_adhesivas
  for select to authenticated using (autor_id = (select auth.uid()));
create policy notas_adhesivas_insert_self on public.notas_adhesivas
  for insert to authenticated with check (autor_id = (select auth.uid()));
create policy notas_adhesivas_update_self on public.notas_adhesivas
  for update to authenticated using (autor_id = (select auth.uid())) with check (autor_id = (select auth.uid()));
create policy notas_adhesivas_delete_self on public.notas_adhesivas
  for delete to authenticated using (autor_id = (select auth.uid()));

create policy tareas_rapidas_select_self on public.tareas_rapidas
  for select to authenticated using (autor_id = (select auth.uid()));
create policy tareas_rapidas_insert_self on public.tareas_rapidas
  for insert to authenticated with check (autor_id = (select auth.uid()));
create policy tareas_rapidas_update_self on public.tareas_rapidas
  for update to authenticated using (autor_id = (select auth.uid())) with check (autor_id = (select auth.uid()));
create policy tareas_rapidas_delete_self on public.tareas_rapidas
  for delete to authenticated using (autor_id = (select auth.uid()));

create policy pomodoro_configuracion_select_self on public.pomodoro_configuracion
  for select to authenticated using (autor_id = (select auth.uid()));
create policy pomodoro_configuracion_insert_self on public.pomodoro_configuracion
  for insert to authenticated with check (autor_id = (select auth.uid()));
create policy pomodoro_configuracion_update_self on public.pomodoro_configuracion
  for update to authenticated using (autor_id = (select auth.uid())) with check (autor_id = (select auth.uid()));
create policy pomodoro_configuracion_delete_self on public.pomodoro_configuracion
  for delete to authenticated using (autor_id = (select auth.uid()));

-- Grants explícitos: RLS no alcanza sin el grant de tabla (mismo gotcha
-- documentado repetidamente en este proyecto). Sin anon en ninguna de las
-- tres, a propósito: ninguna es un recurso público.
grant select, insert, update, delete on public.notas_adhesivas to authenticated;
grant select, insert, update, delete on public.tareas_rapidas to authenticated;
grant select, insert, update, delete on public.pomodoro_configuracion to authenticated;

create trigger set_updated_at before update on public.notas_adhesivas
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.tareas_rapidas
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.pomodoro_configuracion
  for each row execute function public.set_updated_at();
