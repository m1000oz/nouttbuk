-- get_publicacion_counts: conteos agregados expuestos a anon sin exponer las
-- filas crudas de reacciones/guardados/comentarios.

begin;
select plan(6);

-- Fixtures: dueño del apunte y otro usuario que reacciona/guarda/comenta.
do $$
declare
  dueno_id uuid := gen_random_uuid();
  otro_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, email) values
    (dueno_id, 'dueno.conteos@pucp.edu.pe'),
    (otro_id, 'otro.conteos@pucp.edu.pe');

  perform set_config('test.dueno_id', dueno_id::text, false);
  perform set_config('test.otro_id', otro_id::text, false);
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.dueno_id'), true);

do $$
declare
  v_apunte_id uuid;
  v_publicacion_id uuid;
begin
  insert into public.apuntes (titulo, autor_id, visibilidad)
    values ('Apunte con conteos', current_setting('test.dueno_id')::uuid, 'community')
    returning id into v_apunte_id;

  select id into v_publicacion_id
    from public.publicaciones
    where apunte_id = v_apunte_id;

  perform set_config('test.apunte_id', v_apunte_id::text, false);
  perform set_config('test.publicacion_id', v_publicacion_id::text, false);
end $$;

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.otro_id'), true);

insert into public.reacciones (publicacion_id, perfil_id)
  values (current_setting('test.publicacion_id')::uuid, current_setting('test.otro_id')::uuid);
insert into public.guardados (publicacion_id, perfil_id)
  values (current_setting('test.publicacion_id')::uuid, current_setting('test.otro_id')::uuid);
insert into public.comentarios (publicacion_id, autor_id, texto)
  values (current_setting('test.publicacion_id')::uuid, current_setting('test.otro_id')::uuid, 'Buen apunte');

reset role;

-- anon puede pedir los conteos agregados aunque no vea las filas crudas.
set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select is(
  (select reacciones from public.get_publicacion_counts(array[current_setting('test.publicacion_id')::uuid])),
  1::bigint,
  'anon ve el conteo agregado de reacciones'
);
select is(
  (select guardados from public.get_publicacion_counts(array[current_setting('test.publicacion_id')::uuid])),
  1::bigint,
  'anon ve el conteo agregado de guardados'
);
select is(
  (select comentarios from public.get_publicacion_counts(array[current_setting('test.publicacion_id')::uuid])),
  1::bigint,
  'anon ve el conteo agregado de comentarios'
);
select is((select count(*) from public.reacciones)::int, 0, 'anon sigue sin poder leer reacciones en crudo');

reset role;

-- El dueño despublica: la función deja de devolver fila para esa publicación,
-- incluso para el propio dueño (a diferencia de can_view_publicacion).
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.dueno_id'), true);

update public.apuntes set visibilidad = 'private'
  where id = current_setting('test.apunte_id')::uuid;

select is(
  (select count(*) from public.get_publicacion_counts(array[current_setting('test.publicacion_id')::uuid]))::int,
  0,
  'sin publicación community, get_publicacion_counts no devuelve fila'
);

reset role;

-- Al republicar, los conteos reaparecen sin haberse perdido.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.dueno_id'), true);

update public.apuntes set visibilidad = 'community'
  where id = current_setting('test.apunte_id')::uuid;

reset role;

set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select is(
  (select reacciones from public.get_publicacion_counts(array[current_setting('test.publicacion_id')::uuid])),
  1::bigint,
  'al republicar, el conteo de reacciones reaparece intacto'
);

reset role;
select * from finish();
rollback;
