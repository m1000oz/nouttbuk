-- Bucket de Storage para avatares y límite de un cambio de usuario cada 7
-- días (20260821090000_perfil_avatar_y_usuario.sql).

begin;
select plan(4);

select ok(
  exists (
    select 1 from storage.buckets where id = 'avatars' and public = true
  ),
  'el bucket avatars existe y es público'
);

do $$
declare
  new_user_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, email, raw_user_meta_data)
  values (
    new_user_id,
    'perfil.avatar@pucp.edu.pe',
    jsonb_build_object('nombre', 'Perfil Avatar', 'usuario', 'perfil_avatar_original')
  );
  perform set_config('test.new_user_id', new_user_id::text, false);
end $$;

-- Primer cambio de usuario: siempre permitido (usuario_actualizado_en
-- arranca en null).
select lives_ok(
  format(
    $$ update public.profiles set usuario = 'perfil_avatar_uno' where id = %L $$,
    current_setting('test.new_user_id')::uuid
  ),
  'el primer cambio de usuario está permitido'
);

-- Segundo cambio a los pocos segundos: bloqueado. Mismo criterio que
-- validar_dominio_institucional: errcode explícito 'check_violation' (23514),
-- no el P0001 por defecto de plpgsql.
select throws_ok(
  format(
    $$ update public.profiles set usuario = 'perfil_avatar_dos' where id = %L $$,
    current_setting('test.new_user_id')::uuid
  ),
  '23514',
  'Solo puedes cambiar tu usuario una vez cada 7 días'
);

-- Si ya pasaron más de 7 días desde el último cambio, se vuelve a permitir.
-- Esta actualización no toca `usuario`, así que no dispara la validación
-- (el trigger solo actúa cuando `usuario` cambia).
update public.profiles
  set usuario_actualizado_en = now() - interval '8 days'
  where id = current_setting('test.new_user_id')::uuid;

select lives_ok(
  format(
    $$ update public.profiles set usuario = 'perfil_avatar_dos' where id = %L $$,
    current_setting('test.new_user_id')::uuid
  ),
  'el cambio se vuelve a permitir después de 7 días'
);

select * from finish();
rollback;
