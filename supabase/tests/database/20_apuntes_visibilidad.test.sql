-- Matriz de RLS sobre apuntes: private/group/community x anon/dueño/
-- colaborador read/colaborador edit/autenticado sin relación.
--
-- Simula roles dentro de la transacción de test con `set local role` +
-- `request.jwt.claim.sub` (así es como PostgREST resuelve auth.uid()), no
-- requiere la extensión basejump-supabase_test_helpers.

begin;
select plan(11);

-- Fixtures: cuatro perfiles con correo institucional válido.
do $$
declare
  dueno_id uuid := gen_random_uuid();
  lector_id uuid := gen_random_uuid();
  editor_id uuid := gen_random_uuid();
  otro_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, email) values
    (dueno_id, 'dueno@pucp.edu.pe'),
    (lector_id, 'lector@pucp.edu.pe'),
    (editor_id, 'editor@pucp.edu.pe'),
    (otro_id, 'otro@pucp.edu.pe');

  perform set_config('test.dueno_id', dueno_id::text, false);
  perform set_config('test.lector_id', lector_id::text, false);
  perform set_config('test.editor_id', editor_id::text, false);
  perform set_config('test.otro_id', otro_id::text, false);
end $$;

-- El dueño crea sus tres apuntes actuando como rol authenticated, para
-- ejercitar de paso apuntes_insert_own.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.dueno_id'), true);

do $$
declare
  privado_id uuid;
  grupo_id uuid;
  comunidad_id uuid;
begin
  insert into public.apuntes (titulo, autor_id, visibilidad)
    values ('Apunte privado', current_setting('test.dueno_id')::uuid, 'private')
    returning id into privado_id;
  insert into public.apuntes (titulo, autor_id, visibilidad)
    values ('Apunte de grupo', current_setting('test.dueno_id')::uuid, 'group')
    returning id into grupo_id;
  insert into public.apuntes (titulo, autor_id, visibilidad)
    values ('Apunte de comunidad', current_setting('test.dueno_id')::uuid, 'community')
    returning id into comunidad_id;

  insert into public.colaboradores (apunte_id, perfil_id, permiso) values
    (grupo_id, current_setting('test.lector_id')::uuid, 'read'),
    (grupo_id, current_setting('test.editor_id')::uuid, 'edit');

  perform set_config('test.privado_id', privado_id::text, false);
  perform set_config('test.grupo_id', grupo_id::text, false);
  perform set_config('test.comunidad_id', comunidad_id::text, false);
end $$;

reset role;

-- anon: solo ve el apunte community.
set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select is(
  (select count(*) from public.apuntes)::int, 1,
  'anon solo ve un apunte'
);
select ok(
  exists (select 1 from public.apuntes where id = current_setting('test.comunidad_id')::uuid),
  'anon ve el apunte community'
);

reset role;

-- autenticado sin relación: solo ve el apunte community.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.otro_id'), true);

select is(
  (select count(*) from public.apuntes)::int, 1,
  'un autenticado sin relación solo ve un apunte'
);

reset role;

-- colaborador con permiso read: ve group + community, no private; no puede editar.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.lector_id'), true);

select is(
  (select count(*) from public.apuntes)::int, 2,
  'el colaborador read ve dos apuntes (group + community)'
);
select is(
  (select count(*) from public.apuntes where visibilidad = 'private')::int, 0,
  'el colaborador read no ve el apunte privado'
);
-- UPDATE bajo RLS filtra silenciosamente las filas que la policy no permite
-- tocar (0 filas afectadas, sin error), así que el título queda intacto.
update public.apuntes set titulo = 'intento de edición'
  where id = current_setting('test.grupo_id')::uuid;

select is(
  (select titulo from public.apuntes where id = current_setting('test.grupo_id')::uuid),
  'Apunte de grupo',
  'el colaborador read no puede editar el apunte de grupo'
);

reset role;

-- colaborador con permiso edit: ve group + community y puede editar el de grupo.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.editor_id'), true);

select is(
  (select count(*) from public.apuntes)::int, 2,
  'el colaborador edit ve dos apuntes (group + community)'
);

update public.apuntes set titulo = 'Editado por colaborador'
  where id = current_setting('test.grupo_id')::uuid;

select is(
  (select titulo from public.apuntes where id = current_setting('test.grupo_id')::uuid),
  'Editado por colaborador',
  'el colaborador edit sí puede editar el apunte de grupo'
);

reset role;

-- dueño: ve los tres apuntes y puede borrar el privado.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.dueno_id'), true);

select is(
  (select count(*) from public.apuntes)::int, 3,
  'el dueño ve sus tres apuntes'
);

delete from public.apuntes where id = current_setting('test.privado_id')::uuid;

select is(
  (select count(*) from public.apuntes where id = current_setting('test.privado_id')::uuid)::int, 0,
  'el dueño puede borrar su apunte privado'
);

-- un autenticado sin relación no puede borrar el apunte de comunidad ajeno.
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.otro_id'), true);

delete from public.apuntes where id = current_setting('test.comunidad_id')::uuid;

select ok(
  exists (select 1 from public.apuntes where id = current_setting('test.comunidad_id')::uuid),
  'un autenticado sin relación no puede borrar el apunte de comunidad ajeno'
);

reset role;
select * from finish();
rollback;
