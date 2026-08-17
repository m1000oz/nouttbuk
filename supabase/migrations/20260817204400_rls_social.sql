-- Políticas RLS: publicaciones, reacciones, guardados, comentarios, colaboradores.

-- Las publicaciones se crean solo vía el trigger sync_publicacion (security
-- definer, bypassa RLS) y nunca se borran al despublicar un apunte; quedan
-- ocultas en vez de eliminadas (decisión de producto). Por eso no hay policy
-- de insert/update/delete expuesta a anon/authenticated: queda denegado por
-- defecto para cualquier camino que no sea el trigger.
alter table public.publicaciones enable row level security;

create policy publicaciones_select_anon on public.publicaciones
  for select to anon
  using (
    exists (
      select 1 from public.apuntes a
      where a.id = apunte_id and a.visibilidad = 'community'
    )
  );

create policy publicaciones_select_authenticated on public.publicaciones
  for select to authenticated
  using (private.can_view_publicacion(id));

-- Reacciones: visibles solo si la publicación asociada es visible para quien
-- consulta (oculta si el apunte se despublicó, salvo para dueño/colaborador).
alter table public.reacciones enable row level security;

create policy reacciones_select_authenticated on public.reacciones
  for select to authenticated
  using (private.can_view_publicacion(publicacion_id));

create policy reacciones_insert_self on public.reacciones
  for insert to authenticated
  with check (
    perfil_id = (select auth.uid())
    and private.can_view_publicacion(publicacion_id)
  );

create policy reacciones_delete_self on public.reacciones
  for delete to authenticated
  using (perfil_id = (select auth.uid()));

-- Guardados: mismo criterio que reacciones.
alter table public.guardados enable row level security;

create policy guardados_select_authenticated on public.guardados
  for select to authenticated
  using (private.can_view_publicacion(publicacion_id));

create policy guardados_insert_self on public.guardados
  for insert to authenticated
  with check (
    perfil_id = (select auth.uid())
    and private.can_view_publicacion(publicacion_id)
  );

create policy guardados_delete_self on public.guardados
  for delete to authenticated
  using (perfil_id = (select auth.uid()));

-- Comentarios: mismo criterio; sin edición (fuera del alcance del MVP).
alter table public.comentarios enable row level security;

create policy comentarios_select_authenticated on public.comentarios
  for select to authenticated
  using (private.can_view_publicacion(publicacion_id));

create policy comentarios_insert_self on public.comentarios
  for insert to authenticated
  with check (
    autor_id = (select auth.uid())
    and private.can_view_publicacion(publicacion_id)
  );

create policy comentarios_delete_self on public.comentarios
  for delete to authenticated
  using (autor_id = (select auth.uid()));

-- Colaboradores: visibles para el propio colaborador y el dueño;
-- gestionables (insertar/editar permiso/borrar) solo por el dueño del apunte.
alter table public.colaboradores enable row level security;

create policy colaboradores_select_involved on public.colaboradores
  for select to authenticated
  using (
    perfil_id = (select auth.uid())
    or private.owns_apunte(apunte_id)
  );

create policy colaboradores_manage_owner on public.colaboradores
  for all to authenticated
  using (private.owns_apunte(apunte_id))
  with check (private.owns_apunte(apunte_id));
