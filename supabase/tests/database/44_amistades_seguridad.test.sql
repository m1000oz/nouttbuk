-- Cobertura de seguridad para el Motor de Amigos, agregada tras encontrar dos
-- bugs reales en producción (ninguno de los dos tenía test hasta ahora):
--
-- 1) La política de UPDATE de `amistades` dejaba al solicitante cambiar
--    `estado` a lo que quisiera, permitiendo auto-aceptar su propia
--    solicitud sin que el receptor interviniera.
-- 2) `obtener_amigos`/`obtener_solicitudes_pendientes`/`sugerir_amigos` son
--    `security definer` (evaden RLS) pero no validaban que el `perfil_id`
--    pasado como argumento fuera quien llama, permitiendo leer la lista de
--    amigos o solicitudes pendientes de cualquier otra persona.

begin;
select plan(7);

do $$
declare
  a_id uuid := gen_random_uuid();
  b_id uuid := gen_random_uuid();
  c_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, email) values
    (a_id, 'amis.a@pucp.edu.pe'),
    (b_id, 'amis.b@pucp.edu.pe'),
    (c_id, 'amis.c@pucp.edu.pe');

  perform set_config('test.a_id', a_id::text, false);
  perform set_config('test.b_id', b_id::text, false);
  perform set_config('test.c_id', c_id::text, false);

  -- A envió una solicitud pendiente a B; B y C ya son amigos aceptados.
  insert into public.amistades (solicitante_id, receptor_id, estado)
    values (a_id, b_id, 'pendiente');
  insert into public.amistades (solicitante_id, receptor_id, estado)
    values (b_id, c_id, 'aceptada');
end $$;

-- Bug 1: el solicitante no puede auto-aceptar su propia solicitud.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.a_id'), true);

update public.amistades set estado = 'aceptada'
  where solicitante_id = current_setting('test.a_id')::uuid
  and receptor_id = current_setting('test.b_id')::uuid;

select is(
  (select estado from public.amistades
    where solicitante_id = current_setting('test.a_id')::uuid
    and receptor_id = current_setting('test.b_id')::uuid),
  'pendiente',
  'el solicitante no puede auto-aceptar su propia solicitud pendiente'
);

-- Bug 2a: A (sin ninguna relación con B ni C) no puede leer los amigos de B.
select is(
  (select count(*) from public.obtener_amigos(current_setting('test.b_id')::uuid))::int,
  0,
  'un usuario ajeno no puede leer la lista de amigos de otra persona'
);

-- Bug 2b: A no puede leer las solicitudes pendientes recibidas por B.
select is(
  (select count(*) from public.obtener_solicitudes_pendientes(current_setting('test.b_id')::uuid))::int,
  0,
  'un usuario ajeno no puede leer las solicitudes pendientes de otra persona'
);

-- Bug 2c: A no puede leer las sugerencias de B.
select is(
  (select count(*) from public.sugerir_amigos(current_setting('test.b_id')::uuid, 10))::int,
  0,
  'un usuario ajeno no puede leer las sugerencias de amigos de otra persona'
);

reset role;

-- El receptor SÍ puede aceptar una solicitud recibida (el camino legítimo
-- sigue funcionando después del fix).
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.b_id'), true);

update public.amistades set estado = 'aceptada'
  where solicitante_id = current_setting('test.a_id')::uuid
  and receptor_id = current_setting('test.b_id')::uuid;

select is(
  (select estado from public.amistades
    where solicitante_id = current_setting('test.a_id')::uuid
    and receptor_id = current_setting('test.b_id')::uuid),
  'aceptada',
  'el receptor sí puede aceptar una solicitud recibida'
);

-- B, ahora sí amigo de A, puede leer su propia lista de amigos vía la RPC
-- (confirma que el fix no rompió el camino legítimo: perfil_id = auth.uid()).
select is(
  (select count(*) from public.obtener_amigos(current_setting('test.b_id')::uuid))::int,
  2,
  'un usuario puede leer su propia lista de amigos (A y C)'
);

reset role;

-- C, ajeno a la solicitud de A, tampoco puede leer las solicitudes
-- pendientes de B (repite el chequeo 2b desde otro tercero, distinto de A).
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.c_id'), true);

select is(
  (select count(*) from public.obtener_solicitudes_pendientes(current_setting('test.b_id')::uuid))::int,
  0,
  'un tercero ajeno tampoco puede leer las solicitudes pendientes de otra persona'
);

reset role;
select * from finish();
rollback;
