-- Moderación mínima del feed público: reportar una publicación o un
-- comentario. Sin panel de moderación ni columna de estado — este proyecto
-- no tiene rol admin en ningún lado (mismo criterio que feedback.estado,
-- que se cambia a mano por SQL/Studio), el dueño del producto revisa estas
-- tablas directamente y borra el apunte/comentario cuando corresponde.
--
-- Dos tablas espejo de reacciones/guardados (20260817204357_tables_social.sql),
-- no una tabla polimórfica: un `unique(target_id, perfil_id)` compuesto no
-- puede compartirse entre dos posibles targets nulificables (NULL <> NULL en
-- Postgres no bloquea duplicados), así que cada target real necesita su
-- propia tabla para que el unique realmente impida reportar dos veces lo
-- mismo.

create type public.motivo_reporte as enum ('spam', 'contenido_inapropiado', 'plagio', 'otro');

create table public.reportes_publicacion (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references public.publicaciones(id) on delete cascade,
  perfil_id uuid not null references public.profiles(id) on delete cascade,
  motivo public.motivo_reporte not null,
  detalle text,
  created_at timestamptz not null default now(),
  unique (publicacion_id, perfil_id)
);
create index reportes_publicacion_perfil_idx on public.reportes_publicacion (perfil_id);

create table public.reportes_comentario (
  id uuid primary key default gen_random_uuid(),
  comentario_id uuid not null references public.comentarios(id) on delete cascade,
  perfil_id uuid not null references public.profiles(id) on delete cascade,
  motivo public.motivo_reporte not null,
  detalle text,
  created_at timestamptz not null default now(),
  unique (comentario_id, perfil_id)
);
create index reportes_comentario_perfil_idx on public.reportes_comentario (perfil_id);

alter table public.reportes_publicacion enable row level security;
alter table public.reportes_comentario enable row level security;

-- Cada quien solo ve sus propios reportes (no hay panel de moderación en la
-- app, así que no hace falta que nadie más los lea desde el cliente); solo
-- se puede reportar algo que private.can_view_publicacion ya deja ver
-- (reutiliza el helper existente, misma función que usan las policies de
-- reacciones/guardados/comentarios).
create policy reportes_publicacion_select_propio on public.reportes_publicacion
  for select to authenticated
  using (perfil_id = (select auth.uid()));

create policy reportes_publicacion_insert_propio on public.reportes_publicacion
  for insert to authenticated
  with check (
    perfil_id = (select auth.uid())
    and private.can_view_publicacion(publicacion_id)
  );

create policy reportes_comentario_select_propio on public.reportes_comentario
  for select to authenticated
  using (perfil_id = (select auth.uid()));

create policy reportes_comentario_insert_propio on public.reportes_comentario
  for insert to authenticated
  with check (
    perfil_id = (select auth.uid())
    and exists (
      select 1 from public.comentarios c
      where c.id = comentario_id
        and private.can_view_publicacion(c.publicacion_id)
    )
  );

-- Sin update ni delete (reportes inmutables, mismo criterio que comentarios:
-- "sin edición"). Sin policy ni grant de anon: nada en la UI lee reportes
-- como anónimo (mismo caso que colaboradores).
grant select, insert on public.reportes_publicacion to authenticated;
grant select, insert on public.reportes_comentario to authenticated;
