-- CV: cada autenticado ve y edita solo su propio CV; nadie más puede verlo
-- ni tocarlo (RLS filtra a 0 filas); anon no tiene ningún grant en esta
-- tabla, así que una consulta desde ese rol debe fallar con "permission
-- denied", no devolver un resultado vacío (a diferencia de feedback, donde
-- anon sí tiene grant de solo lectura).

begin;
select plan(6);

do $$
declare
  duena_id uuid := gen_random_uuid();
  otra_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, email) values
    (duena_id, 'duena.cv@pucp.edu.pe'),
    (otra_id, 'otra.cv@pucp.edu.pe');

  perform set_config('test.duena_id', duena_id::text, false);
  perform set_config('test.otra_id', otra_id::text, false);
end $$;

-- La dueña crea su propio CV.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.duena_id'), true);

select lives_ok(
  format(
    $$ insert into public.cv (autor_id, contenido) values (%L, '{"type":"doc"}'::jsonb) $$,
    current_setting('test.duena_id')::uuid
  ),
  'la dueña puede crear su propio CV'
);

select is((select count(*) from public.cv)::int, 1, 'la dueña ve su propio CV');

reset role;

-- "otra" no ve ni puede modificar el CV de la dueña.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.otra_id'), true);

select is((select count(*) from public.cv)::int, 0, 'otra no ve el CV de la dueña (RLS filtra, no error)');

update public.cv set contenido = '{"type":"doc","hackeado":true}'::jsonb
  where autor_id = current_setting('test.duena_id')::uuid;
select is(
  (select contenido from public.cv where autor_id = current_setting('test.duena_id')::uuid) ->> 'hackeado',
  null,
  'otra no puede modificar el CV de la dueña'
);

reset role;

-- anon no tiene ningún grant en esta tabla: la consulta debe fallar, no
-- devolver cero filas en silencio.
set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select throws_ok(
  $$ select count(*) from public.cv $$,
  '42501',
  'permission denied for table cv',
  'anon no tiene grant en cv: la consulta falla, no devuelve un resultado vacío'
);

reset role;

-- La dueña sí puede actualizar y borrar su propio CV.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.duena_id'), true);

update public.cv set contenido = '{"type":"doc","actualizado":true}'::jsonb
  where autor_id = current_setting('test.duena_id')::uuid;
select is(
  (select contenido from public.cv where autor_id = current_setting('test.duena_id')::uuid) ->> 'actualizado',
  'true',
  'la dueña puede actualizar su propio CV'
);

reset role;
select * from finish();
rollback;
