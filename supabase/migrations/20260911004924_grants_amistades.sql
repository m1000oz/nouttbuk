-- La migración que creó public.amistades (20260910140000_motor_de_amigos.sql)
-- habilitó RLS y escribió las cuatro políticas, pero se le olvidó el GRANT de
-- tabla. Postgres evalúa los privilegios de tabla ANTES que RLS, así que el rol
-- authenticated solo tenía lo que Postgres concede a PUBLIC por defecto
-- (REFERENCES, TRIGGER, TRUNCATE) y cualquier consulta a amistades fallaba con
-- "permission denied for table amistades" en vez de aplicar las políticas.
-- Es el mismo tropiezo ya documentado en CLAUDE.md para la tabla feedback.
grant select, insert, update, delete on public.amistades to authenticated;

-- A anon no se le concede nada a propósito: el Motor de Amigos es solo para
-- personas con sesión, y la única ruta pública que consulta esta tabla
-- (src/app/(shell)/u/[usuario]/page.tsx) tiene esa consulta dentro de un
-- `if (currentUser)`, así que un visitante anónimo nunca la alcanza. No añadas
-- un grant para anon "por simetría": aquí su ausencia es la decisión correcta.
