-- Reportar publicaciones y comentarios: cada quien ve solo sus propios
-- reportes, no se puede reportar dos veces lo mismo, y solo se puede
-- reportar contenido que private.can_view_publicacion ya deja ver.

begin;
select plan(6);

do $$
declare
  autor_id uuid := gen_random_uuid();
  reportante_id uuid := gen_random_uuid();
  otro_id uuid := gen_random_uuid();
  v_apunte_id uuid;
  v_publicacion_id uuid;
  v_comentario_id uuid;
begin
  insert into auth.users (id, email) values
    (autor_id, 'autor.reportes@pucp.edu.pe'),
    (reportante_id, 'reportante.reportes@pucp.edu.pe'),
    (otro_id, 'otro.reportes@pucp.edu.pe');

  insert into public.apuntes (autor_id, titulo, contenido, visibilidad)
    values (autor_id, 'Apunte reportable', '{}'::jsonb, 'community')
    returning id into v_apunte_id;

  select id into v_publicacion_id from public.publicaciones where apunte_id = v_apunte_id;

  insert into public.comentarios (publicacion_id, autor_id, texto)
    values (v_publicacion_id, autor_id, 'Comentario reportable')
    returning id into v_comentario_id;

  perform set_config('test.reportante_id', reportante_id::text, false);
  perform set_config('test.otro_id', otro_id::text, false);
  perform set_config('test.publicacion_id', v_publicacion_id::text, false);
  perform set_config('test.comentario_id', v_comentario_id::text, false);
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.reportante_id'), true);

select lives_ok(
  format(
    $$ insert into public.reportes_publicacion (publicacion_id, perfil_id, motivo)
       values (%L, %L, 'spam') $$,
    current_setting('test.publicacion_id')::uuid,
    current_setting('test.reportante_id')::uuid
  ),
  'se puede reportar una publicación community'
);

select throws_ok(
  format(
    $$ insert into public.reportes_publicacion (publicacion_id, perfil_id, motivo)
       values (%L, %L, 'otro') $$,
    current_setting('test.publicacion_id')::uuid,
    current_setting('test.reportante_id')::uuid
  ),
  '23505',
  'duplicate key value violates unique constraint "reportes_publicacion_publicacion_id_perfil_id_key"',
  'no se puede reportar dos veces la misma publicación'
);

select lives_ok(
  format(
    $$ insert into public.reportes_comentario (comentario_id, perfil_id, motivo)
       values (%L, %L, 'plagio') $$,
    current_setting('test.comentario_id')::uuid,
    current_setting('test.reportante_id')::uuid
  ),
  'se puede reportar un comentario de una publicación visible'
);

select is(
  (select count(*) from public.reportes_publicacion)::int,
  1,
  'el reportante ve su propio reporte'
);

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.otro_id'), true);

select is(
  (select count(*) from public.reportes_publicacion)::int,
  0,
  'otro usuario no ve el reporte ajeno'
);

select is(
  (select count(*) from public.reportes_comentario)::int,
  0,
  'otro usuario no ve el reporte de comentario ajeno'
);

reset role;
select * from finish();
rollback;
