-- Calendario personal por estudiante: bloques de horario semanal recurrente
-- (no fechas puntuales, ver diseño en design.md) y compartir de solo lectura
-- con otros estudiantes por usuario, mismo patrón que colaboradores de
-- apuntes (20260817204357_tables_social.sql / 20260817204400_rls_social.sql)
-- pero sin niveles de permiso: acá solo existe "puede ver mis bloques" o no,
-- nunca editarlos, así que no hace falta una columna `permiso`.

create table public.bloques_horario (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.profiles(id) on delete cascade,
  titulo text not null check (char_length(titulo) between 1 and 60),
  -- 0 = lunes ... 6 = domingo (semana académica empieza en lunes, a
  -- diferencia de ISO que numera domingo=0 en JS Date.getDay()).
  dia_semana smallint not null check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fin time not null,
  color text not null default 'blue',
  created_at timestamptz not null default now(),
  constraint bloques_horario_rango_valido check (hora_fin > hora_inicio)
);

create index bloques_horario_perfil_idx on public.bloques_horario (perfil_id);

-- Quién comparte su calendario con quién: fila (propietario_id,
-- colaborador_id) = "colaborador_id puede ver los bloques de
-- propietario_id". Deliberadamente unidireccional (compartir A→B no le da a
-- B acceso a compartir su propio calendario con nadie más ni le da a A
-- acceso al de B) — quien invita es siempre quien administra su propia fila,
-- exactamente como colaboradores de apuntes.
create table public.calendario_colaboradores (
  propietario_id uuid not null references public.profiles(id) on delete cascade,
  colaborador_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (propietario_id, colaborador_id),
  constraint calendario_colaboradores_no_self check (propietario_id <> colaborador_id)
);

alter table public.bloques_horario enable row level security;
alter table public.calendario_colaboradores enable row level security;

-- Los bloques son visibles para su dueño y para cualquiera con quien ese
-- calendario se haya compartido (necesario para calcular el cruce de
-- horarios en la vista de grupo, no solo para "ver" el calendario ajeno
-- directamente).
create policy bloques_horario_select_propio_o_compartido on public.bloques_horario
  for select to authenticated
  using (
    perfil_id = (select auth.uid())
    or exists (
      select 1 from public.calendario_colaboradores cc
      where cc.propietario_id = bloques_horario.perfil_id
        and cc.colaborador_id = (select auth.uid())
    )
  );

create policy bloques_horario_gestionar_propio on public.bloques_horario
  for all to authenticated
  using (perfil_id = (select auth.uid()))
  with check (perfil_id = (select auth.uid()));

create policy calendario_colaboradores_select_involucrado on public.calendario_colaboradores
  for select to authenticated
  using (
    propietario_id = (select auth.uid())
    or colaborador_id = (select auth.uid())
  );

create policy calendario_colaboradores_gestionar_propietario on public.calendario_colaboradores
  for all to authenticated
  using (propietario_id = (select auth.uid()))
  with check (propietario_id = (select auth.uid()));

-- Sin policy ni grant para anon: el calendario no es contenido público como
-- el feed de Comunidad, siempre requiere sesión.
grant select, insert, update, delete on public.bloques_horario to authenticated;
grant select, insert, update, delete on public.calendario_colaboradores to authenticated;
