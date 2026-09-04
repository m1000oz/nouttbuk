-- Límite de un cambio de carrera cada 30 días (20260904140000_perfil_cooldown_carrera.sql).
-- Mismo esqueleto que 34_perfil_avatar_usuario.test.sql para el candado de usuario.

begin;
select plan(3);

do $$
declare
  new_user_id uuid := gen_random_uuid();
  carrera_uno uuid;
  carrera_dos uuid;
begin
  select id into carrera_uno from public.carreras order by nombre limit 1;
  select id into carrera_dos from public.carreras order by nombre offset 1 limit 1;

  insert into auth.users (id, email, raw_user_meta_data)
  values (
    new_user_id,
    'perfil.carrera@pucp.edu.pe',
    jsonb_build_object('nombre', 'Perfil Carrera', 'usuario', 'perfil_carrera_original', 'carrera_id', carrera_uno::text)
  );

  perform set_config('test.new_user_id', new_user_id::text, false);
  perform set_config('test.carrera_uno', carrera_uno::text, false);
  perform set_config('test.carrera_dos', carrera_dos::text, false);
end $$;

-- Primer cambio de carrera vía UPDATE: siempre permitido
-- (carrera_actualizada_en arranca en null, el valor de signup no cuenta como
-- "cambio" porque el trigger solo corre en UPDATE, no en el INSERT inicial).
select lives_ok(
  format(
    $$ update public.profiles set carrera_id = %L where id = %L $$,
    current_setting('test.carrera_dos')::uuid,
    current_setting('test.new_user_id')::uuid
  ),
  'el primer cambio de carrera está permitido'
);

-- Segundo cambio a los pocos segundos: bloqueado.
select throws_ok(
  format(
    $$ update public.profiles set carrera_id = %L where id = %L $$,
    current_setting('test.carrera_uno')::uuid,
    current_setting('test.new_user_id')::uuid
  ),
  '23514',
  'Solo puedes cambiar tu carrera una vez cada 30 días'
);

-- Si ya pasaron más de 30 días desde el último cambio, se vuelve a permitir.
update public.profiles
  set carrera_actualizada_en = now() - interval '31 days'
  where id = current_setting('test.new_user_id')::uuid;

select lives_ok(
  format(
    $$ update public.profiles set carrera_id = %L where id = %L $$,
    current_setting('test.carrera_uno')::uuid,
    current_setting('test.new_user_id')::uuid
  ),
  'el cambio se vuelve a permitir después de 30 días'
);

select * from finish();
rollback;
