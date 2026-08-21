-- Catálogo de carreras y cursos reales de PUCP (20260823090000_carreras_y_cursos.sql):
-- lectura pública (anon incluido), profiles.carrera_id y apuntes.curso_id como
-- FKs reales hacia el catálogo.

begin;
select plan(7);

select is((select count(*) from public.carreras)::int, 55, 'las 55 carreras oficiales están sembradas');
select ok((select count(*) from public.cursos) > 0, 'hay cursos sembrados para las carreras representativas');

-- anon puede leer ambos catálogos (mismo criterio que profiles_select_public).
set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select ok((select count(*) from public.carreras) = 55, 'anon puede leer el catálogo de carreras');
select ok((select count(*) from public.cursos) > 0, 'anon puede leer el catálogo de cursos');

reset role;

do $$
declare
  usuario_id uuid := gen_random_uuid();
  informatica_id uuid;
  curso_id uuid;
  apunte_id uuid;
begin
  select id into informatica_id from public.carreras where nombre = 'Ingeniería Informática';
  select id into curso_id from public.cursos where carrera_id = informatica_id limit 1;

  insert into auth.users (id, email) values (usuario_id, 'estudiante.malla@pucp.edu.pe');

  perform set_config('test.usuario_id', usuario_id::text, false);
  perform set_config('test.informatica_id', informatica_id::text, false);
  perform set_config('test.curso_id', curso_id::text, false);
end $$;

-- profiles.carrera_id acepta una carrera real del catálogo.
update public.profiles set carrera_id = current_setting('test.informatica_id')::uuid
  where id = current_setting('test.usuario_id')::uuid;

select is(
  (select carrera_id from public.profiles where id = current_setting('test.usuario_id')::uuid)::text,
  current_setting('test.informatica_id'),
  'profiles.carrera_id acepta una carrera real'
);

-- apuntes.curso_id acepta un curso real, nullable como carpeta_id.
do $$
declare
  apunte_id uuid;
begin
  insert into public.apuntes (titulo, autor_id, curso_id)
    values ('Notas de clase', current_setting('test.usuario_id')::uuid, current_setting('test.curso_id')::uuid)
    returning id into apunte_id;

  perform set_config('test.apunte_id', apunte_id::text, false);
end $$;

select is(
  (select curso_id from public.apuntes where id = current_setting('test.apunte_id')::uuid)::text,
  current_setting('test.curso_id'),
  'apuntes.curso_id acepta un curso real'
);

-- Borrar el curso no borra el apunte, solo desvincula (on delete set null),
-- mismo comportamiento que carpeta_id.
delete from public.cursos where id = current_setting('test.curso_id')::uuid;

select is(
  (select curso_id from public.apuntes where id = current_setting('test.apunte_id')::uuid),
  null,
  'borrar un curso desvincula el apunte en vez de borrarlo (on delete set null)'
);

select * from finish();
rollback;
