-- La restricción de correo institucional @pucp.edu.pe también aplica al
-- cambiar el correo de una cuenta ya existente, no solo al registrarse
-- (20260910135502_extender_validacion_dominio_a_update.sql).

begin;
select plan(2);

do $$
declare
  new_user_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, email)
  values (new_user_id, 'estudiante.update@pucp.edu.pe');
  perform set_config('test.update_user_id', new_user_id::text, false);
end $$;

-- Cambiar el correo a uno no institucional debe rechazarse con el mismo
-- código que ya usa el registro (23514, check_violation).
select throws_ok(
  format(
    $$ update auth.users set email = 'cualquiera@gmail.com' where id = %L $$,
    current_setting('test.update_user_id')::uuid
  ),
  '23514',
  'El registro solo está permitido con un correo institucional @pucp.edu.pe'
);

-- Cambiar el correo a otro correo institucional sigue permitido.
select lives_ok(
  format(
    $$ update auth.users set email = 'estudiante.update.nuevo@pucp.edu.pe' where id = %L $$,
    current_setting('test.update_user_id')::uuid
  ),
  'se permite actualizar el correo a otro correo institucional @pucp.edu.pe'
);

select * from finish();
rollback;
