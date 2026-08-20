-- Board de feedback: cualquier autenticado ve todas las ideas y puede votar;
-- solo la autora puede borrar su propia idea; anon no tiene acceso (board
-- cerrado, no es el feed público de comunidad).

begin;
select plan(7);

do $$
declare
  autora_id uuid := gen_random_uuid();
  otra_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, email) values
    (autora_id, 'autora.feedback@pucp.edu.pe'),
    (otra_id, 'otra.feedback@pucp.edu.pe');

  perform set_config('test.autora_id', autora_id::text, false);
  perform set_config('test.otra_id', otra_id::text, false);
end $$;

-- La autora propone una idea.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.autora_id'), true);

do $$
declare
  v_feedback_id uuid;
begin
  insert into public.feedback (autor_id, texto)
    values (current_setting('test.autora_id')::uuid, 'Sería útil exportar apuntes a PDF')
    returning id into v_feedback_id;

  perform set_config('test.feedback_id', v_feedback_id::text, false);
end $$;

select is((select estado from public.feedback where id = current_setting('test.feedback_id')::uuid)::text, 'nueva', 'una idea nueva empieza en estado nueva');

reset role;

-- "otra" ve la idea (board visible a cualquier autenticado) y vota.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.otra_id'), true);

select is((select count(*) from public.feedback)::int, 1, 'otra ve la idea de autora');

insert into public.feedback_votos (feedback_id, perfil_id)
  values (current_setting('test.feedback_id')::uuid, current_setting('test.otra_id')::uuid);

select is((select count(*) from public.feedback_votos)::int, 1, 'otra pudo votar la idea');

-- "otra" no puede borrar una idea ajena (RLS filtra, 0 filas afectadas).
delete from public.feedback where id = current_setting('test.feedback_id')::uuid;
select is((select count(*) from public.feedback)::int, 1, 'otra no puede borrar la idea de autora');

reset role;

-- anon no ve nada (sin policy ni grant para anon).
set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select is((select count(*) from public.feedback)::int, 0, 'anon no puede leer el board de feedback');

reset role;

-- La autora sí puede borrar su propia idea.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.autora_id'), true);

delete from public.feedback where id = current_setting('test.feedback_id')::uuid;
select is((select count(*) from public.feedback)::int, 0, 'la autora puede borrar su propia idea');

-- El borrado en cascada se lleva también el voto.
select is((select count(*) from public.feedback_votos)::int, 0, 'borrar la idea borra en cascada su voto');

reset role;
select * from finish();
rollback;
