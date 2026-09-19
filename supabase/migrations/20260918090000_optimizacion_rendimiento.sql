-- Pase de optimización de rendimiento, a pedido del usuario ("siento que
-- podemos optimizar muchos procesos que hoy provocan cargas prolongadas").
-- Todo lo de este archivo es aditivo o preserva el comportamiento exacto de
-- las políticas que reemplaza, solo cambia cómo Postgres las ejecuta.
--
-- 1) Índice que faltaba en publicaciones.created_at: tanto el feed de
--    Comunidad (consultaFeedComunidad) como el feed de Amigos
--    (consultaFeedAmigos) ordenan `ORDER BY publicaciones.created_at DESC`,
--    y publicaciones solo tenía índices en (id) y (apunte_id). Sin este
--    índice, cada página del feed público (el gancho de SEO/crecimiento que
--    "nunca debe regresar" según NOUTTBUK-IDEA.md) fuerza un sort completo
--    de toda la tabla en cada carga, cada vez más caro según crecen los
--    posts. Es el hallazgo de mayor impacto de esta auditoría.
create index publicaciones_created_at_idx on public.publicaciones (created_at desc);

-- 2) Índices que faltaban en columnas FK reales (confirmado con una consulta
--    directa contra pg_constraint/pg_index, no supuesto), incluyendo una que
--    ya se usaba dentro de una policy activa:
--    calendario_colaboradores.colaborador_id se lee tanto en su propia
--    policy de select como dentro de una subconsulta correlacionada en la
--    policy de bloques_horario (`cc.colaborador_id = (select auth.uid())`),
--    y la PK compuesta (propietario_id, colaborador_id) no cubre una
--    búsqueda solo por la segunda columna. Este mismo patrón ya se había
--    resuelto correctamente para colaboradores.perfil_id
--    (colaboradores_perfil_idx); acá quedó sin el índice equivalente.
create index calendario_colaboradores_colaborador_idx on public.calendario_colaboradores (colaborador_id);
create index profiles_carrera_idx on public.profiles (carrera_id);
create index comentarios_autor_idx on public.comentarios (autor_id);
create index feedback_autor_idx on public.feedback (autor_id);

-- 3) Envolver en `(select ...)` las llamadas a los helpers de RLS
--    (private.can_view_publicacion / owns_apunte / can_edit_apunte /
--    can_read_group_apunte) dentro de las políticas que las usan. El
--    proyecto ya sigue esta convención para auth.uid() desde la primera
--    migración (rls_core.sql), pero nunca se aplicó a estas llamadas a
--    función, que son justo las que corren en las tablas más calientes de
--    la app (apuntes, publicaciones, comentarios, reacciones, guardados,
--    colaboradores) y cada una hace su propio join/exists por dentro. Sin
--    el `select`, Postgres puede re-evaluar la función por cada fila del
--    scan en vez de una sola vez por consulta (guía oficial de Supabase:
--    https://supabase.com/docs/guides/database/postgres/row-level-security#rls-performance-recommendations).
--    Mismo predicado exacto en cada policy, solo se agrega el `select`.

drop policy apuntes_select_authenticated on public.apuntes;
create policy apuntes_select_authenticated on public.apuntes
  for select to authenticated
  using (
    visibilidad = 'community'
    or autor_id = (select auth.uid())
    or (select private.can_read_group_apunte(id))
  );

drop policy apuntes_update_editable on public.apuntes;
create policy apuntes_update_editable on public.apuntes
  for update to authenticated
  using ((select private.can_edit_apunte(id)))
  with check ((select private.can_edit_apunte(id)));

drop policy publicaciones_select_authenticated on public.publicaciones;
create policy publicaciones_select_authenticated on public.publicaciones
  for select to authenticated
  using ((select private.can_view_publicacion(id)));

drop policy reacciones_select_authenticated on public.reacciones;
create policy reacciones_select_authenticated on public.reacciones
  for select to authenticated
  using ((select private.can_view_publicacion(publicacion_id)));

drop policy reacciones_insert_self on public.reacciones;
create policy reacciones_insert_self on public.reacciones
  for insert to authenticated
  with check (
    perfil_id = (select auth.uid())
    and (select private.can_view_publicacion(publicacion_id))
  );

drop policy guardados_select_authenticated on public.guardados;
create policy guardados_select_authenticated on public.guardados
  for select to authenticated
  using ((select private.can_view_publicacion(publicacion_id)));

drop policy guardados_insert_self on public.guardados;
create policy guardados_insert_self on public.guardados
  for insert to authenticated
  with check (
    perfil_id = (select auth.uid())
    and (select private.can_view_publicacion(publicacion_id))
  );

drop policy comentarios_select_authenticated on public.comentarios;
create policy comentarios_select_authenticated on public.comentarios
  for select to authenticated
  using ((select private.can_view_publicacion(publicacion_id)));

drop policy comentarios_insert_self on public.comentarios;
create policy comentarios_insert_self on public.comentarios
  for insert to authenticated
  with check (
    autor_id = (select auth.uid())
    and (select private.can_view_publicacion(publicacion_id))
  );

drop policy colaboradores_select_involved on public.colaboradores;
create policy colaboradores_select_involved on public.colaboradores
  for select to authenticated
  using (
    perfil_id = (select auth.uid())
    or (select private.owns_apunte(apunte_id))
  );

drop policy colaboradores_manage_owner on public.colaboradores;
create policy colaboradores_manage_owner on public.colaboradores
  for all to authenticated
  using ((select private.owns_apunte(apunte_id)))
  with check ((select private.owns_apunte(apunte_id)));

-- 4) amistades (Motor de Amigos, migración 20260910140000 y su fix de
--    seguridad 20260917050000) es la única tabla del proyecto cuyas
--    políticas usan `auth.uid()` sin envolver en `select`, la desviación
--    exacta que rls_core.sql evita desde el día uno. Mismo predicado, solo
--    envuelto.
drop policy "Los usuarios pueden ver amistades donde participan" on public.amistades;
create policy "Los usuarios pueden ver amistades donde participan"
  on public.amistades for select to authenticated
  using ((select auth.uid()) = solicitante_id or (select auth.uid()) = receptor_id);

drop policy "Los usuarios pueden enviar solicitudes" on public.amistades;
create policy "Los usuarios pueden enviar solicitudes"
  on public.amistades for insert to authenticated
  with check ((select auth.uid()) = solicitante_id and estado = 'pendiente');

drop policy "Solo el receptor puede aceptar o rechazar una solicitud" on public.amistades;
create policy "Solo el receptor puede aceptar o rechazar una solicitud"
  on public.amistades for update to authenticated
  using ((select auth.uid()) = receptor_id)
  with check ((select auth.uid()) = receptor_id and estado in ('aceptada', 'rechazada'));

drop policy "Los usuarios pueden eliminar amistades" on public.amistades;
create policy "Los usuarios pueden eliminar amistades"
  on public.amistades for delete to authenticated
  using ((select auth.uid()) = solicitante_id or (select auth.uid()) = receptor_id);

-- 5) buscar_usuarios (Amigos > buscar) usa `ilike '%' || query || '%'`, un
--    patrón con comodín al inicio que un índice btree normal no puede usar,
--    así que siempre hacía seq scan sobre profiles. pg_trgm + un índice GIN
--    por trigramas sí soporta ILIKE con comodín en ambos extremos. Inofensivo
--    para funcionalidad, solo cambia el plan de ejecución.
create extension if not exists pg_trgm with schema extensions;

create index profiles_nombre_trgm_idx on public.profiles using gin (nombre extensions.gin_trgm_ops);
create index profiles_usuario_trgm_idx on public.profiles using gin (usuario extensions.gin_trgm_ops);
