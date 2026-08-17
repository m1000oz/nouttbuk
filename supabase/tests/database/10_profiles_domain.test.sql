-- Restricción de correo institucional @pucp.edu.pe y creación automática
-- del perfil al registrarse (trigger sobre auth.users).

begin;
select plan(4);

-- Un correo que no termina en @pucp.edu.pe debe ser rechazado por el
-- trigger de base de datos, sin importar el camino de creación del usuario.
select throws_ok(
  $$ insert into auth.users (id, email) values (gen_random_uuid(), 'estudiante@gmail.com') $$,
  'P0001',
  'El registro solo está permitido con un correo institucional @pucp.edu.pe'
);

-- Un correo institucional válido crea el usuario y, vía handle_new_user,
-- su fila en profiles con la universidad fija en PUCP.
do $$
declare
  new_user_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, email, raw_user_meta_data)
  values (
    new_user_id,
    'estudiante.prueba@pucp.edu.pe',
    jsonb_build_object('nombre', 'Estudiante Prueba', 'usuario', 'estudiante_prueba')
  );
  perform set_config('test.new_user_id', new_user_id::text, false);
end $$;

select ok(
  exists (
    select 1 from public.profiles
    where id = current_setting('test.new_user_id')::uuid
      and nombre = 'Estudiante Prueba'
      and usuario = 'estudiante_prueba'
  ),
  'se crea el perfil automáticamente al registrarse con correo institucional'
);

select is(
  (select universidad from public.profiles where id = current_setting('test.new_user_id')::uuid),
  'Pontificia Universidad Católica del Perú',
  'la universidad del perfil nuevo queda fija en PUCP'
);

-- La universidad no se puede editar después de creado el perfil.
select throws_ok(
  format(
    $$ update public.profiles set universidad = 'Otra universidad' where id = %L $$,
    current_setting('test.new_user_id')::uuid
  ),
  'P0001',
  'No se puede cambiar la universidad asignada al perfil'
);

select * from finish();
rollback;
