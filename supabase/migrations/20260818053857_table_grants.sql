-- Otorga los privilegios de tabla que RLS necesita como prerrequisito.
--
-- El rol `postgres` (con el que corren las migraciones) tiene, en este
-- proyecto, un default privilege que retira select/insert/update a
-- anon/authenticated en tablas nuevas (a diferencia de supabase_admin, que
-- sí las concede por defecto). Sin este grant explícito, las políticas de
-- 20260817204359_rls_core.sql y 20260817204400_rls_social.sql nunca llegan a
-- evaluarse: Postgres deniega el acceso a nivel de tabla antes de llegar a
-- RLS ("permission denied for table x", código 42501). Detectado al correr
-- supabase/tests/database/ por primera vez contra un stack local real.

grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;

grant select, insert, update, delete on public.carpetas to authenticated;

grant select on public.apuntes to anon;
grant select, insert, update, delete on public.apuntes to authenticated;

grant select on public.publicaciones to anon, authenticated;

-- anon no tiene policy propia en reacciones/guardados/comentarios (ver
-- 20260817204400_rls_social.sql), pero igual necesita el grant base para que
-- la consulta devuelva cero filas por RLS en vez de "permission denied".
grant select on public.reacciones to anon;
grant select, insert, delete on public.reacciones to authenticated;
grant select on public.guardados to anon;
grant select, insert, delete on public.guardados to authenticated;
grant select on public.comentarios to anon;
grant select, insert, delete on public.comentarios to authenticated;
grant select, insert, update, delete on public.colaboradores to authenticated;
