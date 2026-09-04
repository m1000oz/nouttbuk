-- Calendario: bloques de horario visibles solo para el dueño y quien tenga
-- el calendario compartido; compartir/gestionar solo por el dueño;
-- validaciones de rango horario y anti-auto-invitación.

begin;
select plan(9);

do $$
declare
  dueno_id uuid := gen_random_uuid();
  amigo_id uuid := gen_random_uuid();
  extrano_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, email) values
    (dueno_id, 'dueno.calendario@pucp.edu.pe'),
    (amigo_id, 'amigo.calendario@pucp.edu.pe'),
    (extrano_id, 'extrano.calendario@pucp.edu.pe');

  perform set_config('test.dueno_id', dueno_id::text, false);
  perform set_config('test.amigo_id', amigo_id::text, false);
  perform set_config('test.extrano_id', extrano_id::text, false);
end $$;

-- El dueño crea un bloque de horario.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.dueno_id'), true);

do $$
declare
  v_bloque_id uuid;
begin
  insert into public.bloques_horario (perfil_id, titulo, dia_semana, hora_inicio, hora_fin)
    values (current_setting('test.dueno_id')::uuid, 'Cálculo 2', 1, '08:00', '10:00')
    returning id into v_bloque_id;
  perform set_config('test.bloque_id', v_bloque_id::text, false);
end $$;

select is((select count(*) from public.bloques_horario)::int, 1, 'el dueño ve su propio bloque');

-- Un rango horario inválido (fin antes que inicio) se rechaza por el
-- constraint, no por RLS.
select throws_ok(
  $$ insert into public.bloques_horario (perfil_id, titulo, dia_semana, hora_inicio, hora_fin)
     values (current_setting('test.dueno_id')::uuid, 'Bloque inválido', 2, '10:00', '09:00') $$,
  '23514',
  'new row for relation "bloques_horario" violates check constraint "bloques_horario_rango_valido"',
  'un bloque con hora_fin antes de hora_inicio se rechaza'
);

reset role;

-- Un extraño (sin invitación) no ve el bloque del dueño.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.extrano_id'), true);

select is((select count(*) from public.bloques_horario)::int, 0, 'un extraño sin invitación no ve el bloque del dueño');

reset role;

-- El dueño comparte su calendario con "amigo".
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.dueno_id'), true);

insert into public.calendario_colaboradores (propietario_id, colaborador_id)
  values (current_setting('test.dueno_id')::uuid, current_setting('test.amigo_id')::uuid);

select throws_ok(
  format(
    $$ insert into public.calendario_colaboradores (propietario_id, colaborador_id) values (%L, %L) $$,
    current_setting('test.dueno_id')::uuid,
    current_setting('test.dueno_id')::uuid
  ),
  '23514',
  'new row for relation "calendario_colaboradores" violates check constraint "calendario_colaboradores_no_self"',
  'no se puede compartir el calendario con uno mismo'
);

reset role;

-- "amigo" ahora ve el bloque del dueño (necesario para el cruce de horarios).
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.amigo_id'), true);

select is((select count(*) from public.bloques_horario)::int, 1, 'amigo ve el bloque del dueño tras la invitación');

-- "amigo" no puede borrar el bloque del dueño (RLS de gestión es solo para
-- el propio perfil_id, ver/borrar son cosas distintas).
delete from public.bloques_horario where id = current_setting('test.bloque_id')::uuid;
select is((select count(*) from public.bloques_horario)::int, 1, 'amigo no puede borrar el bloque del dueño');

-- "amigo" tampoco puede revocarse acceso a sí mismo manipulando la fila del
-- dueño (solo el propietario administra calendario_colaboradores).
delete from public.calendario_colaboradores
  where propietario_id = current_setting('test.dueno_id')::uuid;
select is((select count(*) from public.calendario_colaboradores)::int, 1, 'amigo no puede revocar su propio acceso');

reset role;

-- El dueño sí puede borrar su propio bloque y revocar el acceso compartido.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.dueno_id'), true);

delete from public.bloques_horario where id = current_setting('test.bloque_id')::uuid;
select is((select count(*) from public.bloques_horario)::int, 0, 'el dueño puede borrar su propio bloque');

delete from public.calendario_colaboradores
  where propietario_id = current_setting('test.dueno_id')::uuid;
select is((select count(*) from public.calendario_colaboradores)::int, 0, 'el dueño puede revocar el acceso compartido');

reset role;
select * from finish();
rollback;
