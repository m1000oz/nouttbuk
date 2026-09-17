-- notas_adhesivas / tareas_rapidas / pomodoro_configuracion: cada
-- autenticado ve y edita solo sus propias filas (RLS filtra a 0 filas para
-- otros); anon no tiene ningún grant en ninguna de las tres, así que una
-- consulta desde ese rol debe fallar con "permission denied", no devolver un
-- resultado vacío (mismo criterio que cv, no el de feedback).

begin;
select plan(9);

do $$
declare
  duena_id uuid := gen_random_uuid();
  otra_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, email) values
    (duena_id, 'duena.tools@pucp.edu.pe'),
    (otra_id, 'otra.tools@pucp.edu.pe');

  perform set_config('test.duena_id', duena_id::text, false);
  perform set_config('test.otra_id', otra_id::text, false);
end $$;

-- La dueña crea su propio post-it, tarea y configuración de pomodoro.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.duena_id'), true);

select lives_ok(
  format(
    $$ insert into public.notas_adhesivas (autor_id, texto) values (%L, 'recordar algo') $$,
    current_setting('test.duena_id')::uuid
  ),
  'la dueña puede crear su propio post-it'
);

select lives_ok(
  format(
    $$ insert into public.tareas_rapidas (autor_id, texto) values (%L, 'terminar tarea') $$,
    current_setting('test.duena_id')::uuid
  ),
  'la dueña puede crear su propia tarea'
);

select lives_ok(
  format(
    $$ insert into public.pomodoro_configuracion (autor_id, work_duration) values (%L, 50) $$,
    current_setting('test.duena_id')::uuid
  ),
  'la dueña puede crear su propia configuración de pomodoro'
);

select is((select count(*) from public.notas_adhesivas)::int, 1, 'la dueña ve su propio post-it');
select is((select count(*) from public.tareas_rapidas)::int, 1, 'la dueña ve su propia tarea');

reset role;

-- "otra" no ve ni puede modificar las filas de la dueña.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.otra_id'), true);

select is((select count(*) from public.notas_adhesivas)::int, 0, 'otra no ve el post-it de la dueña (RLS filtra, no error)');
select is((select count(*) from public.tareas_rapidas)::int, 0, 'otra no ve la tarea de la dueña (RLS filtra, no error)');

reset role;

-- anon no tiene ningún grant en estas tablas: la consulta debe fallar, no
-- devolver cero filas en silencio.
set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select throws_ok(
  $$ select count(*) from public.notas_adhesivas $$,
  '42501',
  'permission denied for table notas_adhesivas',
  'anon no tiene grant en notas_adhesivas: la consulta falla, no devuelve un resultado vacío'
);

reset role;

-- upsert por PK en pomodoro_configuracion: un segundo cambio de la dueña
-- actualiza la misma fila en vez de crear una nueva.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.duena_id'), true);

insert into public.pomodoro_configuracion (autor_id, work_duration)
  values (current_setting('test.duena_id')::uuid, 30)
  on conflict (autor_id) do update set work_duration = excluded.work_duration;

select is(
  (select work_duration from public.pomodoro_configuracion where autor_id = current_setting('test.duena_id')::uuid),
  30,
  'el upsert por autor_id actualiza la fila existente en vez de duplicarla'
);

reset role;
select * from finish();
rollback;
