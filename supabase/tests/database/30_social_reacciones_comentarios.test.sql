-- Reacciones, guardados y comentarios: visibles solo si la publicación
-- asociada lo es (can_view_publicacion), y el ciclo despublicar/republicar
-- oculta y luego vuelve a mostrar el mismo historial sin duplicarlo.

begin;
select plan(14);

-- Fixtures: dueño del apunte y otro usuario que reacciona/comenta.
do $$
declare
  dueno_id uuid := gen_random_uuid();
  otro_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, email) values
    (dueno_id, 'dueno.social@pucp.edu.pe'),
    (otro_id, 'otro.social@pucp.edu.pe');

  perform set_config('test.dueno_id', dueno_id::text, false);
  perform set_config('test.otro_id', otro_id::text, false);
end $$;

-- El dueño publica un apunte community; el trigger crea la publicación.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.dueno_id'), true);

do $$
declare
  v_apunte_id uuid;
  v_publicacion_id uuid;
begin
  insert into public.apuntes (titulo, autor_id, visibilidad)
    values ('Apunte social', current_setting('test.dueno_id')::uuid, 'community')
    returning id into v_apunte_id;

  select id into v_publicacion_id
    from public.publicaciones
    where apunte_id = v_apunte_id;

  perform set_config('test.apunte_id', v_apunte_id::text, false);
  perform set_config('test.publicacion_id', v_publicacion_id::text, false);
end $$;

reset role;

-- "otro" reacciona, guarda y comenta la publicación pública.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.otro_id'), true);

insert into public.reacciones (publicacion_id, perfil_id)
  values (current_setting('test.publicacion_id')::uuid, current_setting('test.otro_id')::uuid);
insert into public.guardados (publicacion_id, perfil_id)
  values (current_setting('test.publicacion_id')::uuid, current_setting('test.otro_id')::uuid);
insert into public.comentarios (publicacion_id, autor_id, texto)
  values (current_setting('test.publicacion_id')::uuid, current_setting('test.otro_id')::uuid, 'Buen apunte');

select is((select count(*) from public.reacciones)::int, 1, 'otro reaccionó a la publicación');
select is((select count(*) from public.guardados)::int, 1, 'otro guardó la publicación');
select is((select count(*) from public.comentarios)::int, 1, 'otro comentó la publicación');

reset role;

-- anon puede leer el apunte y la publicación, pero no las tablas de
-- reacciones/guardados/comentarios (no tienen policy para anon).
set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select ok(
  exists (select 1 from public.publicaciones where id = current_setting('test.publicacion_id')::uuid),
  'anon puede leer la publicación community'
);
select is((select count(*) from public.reacciones)::int, 0, 'anon no puede leer reacciones en crudo');

reset role;

-- El dueño despublica el apunte (pasa a private).
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.dueno_id'), true);

update public.apuntes set visibilidad = 'private'
  where id = current_setting('test.apunte_id')::uuid;

-- El dueño sigue viendo su publicación y el historial oculto.
select is((select count(*) from public.publicaciones)::int, 1, 'el dueño sigue viendo su publicación oculta');
select is((select count(*) from public.reacciones)::int, 1, 'el dueño sigue viendo el historial de reacciones oculto');

reset role;

-- "otro" (sin relación con el apunte ahora privado) ya no ve nada de eso.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.otro_id'), true);

select is((select count(*) from public.publicaciones)::int, 0, 'otro deja de ver la publicación despublicada');
select is((select count(*) from public.reacciones)::int, 0, 'otro deja de ver las reacciones despublicadas');
select is((select count(*) from public.comentarios)::int, 0, 'otro deja de ver los comentarios despublicados');

reset role;

-- El dueño vuelve a publicar el apunte: se reutiliza la misma fila de
-- publicaciones (no se duplica) y el historial reaparece para todos.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.dueno_id'), true);

update public.apuntes set visibilidad = 'community'
  where id = current_setting('test.apunte_id')::uuid;

select is(
  (select count(*) from public.publicaciones where apunte_id = current_setting('test.apunte_id')::uuid)::int,
  1,
  'republicar no duplica la fila de publicaciones'
);
select is(
  (select id from public.publicaciones where apunte_id = current_setting('test.apunte_id')::uuid),
  current_setting('test.publicacion_id')::uuid,
  'republicar reutiliza el mismo id de publicación'
);

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.otro_id'), true);

select is((select count(*) from public.reacciones)::int, 1, 'el historial de reacciones reaparece al republicar');
select is((select count(*) from public.comentarios)::int, 1, 'el historial de comentarios reaparece al republicar');

reset role;
select * from finish();
rollback;
