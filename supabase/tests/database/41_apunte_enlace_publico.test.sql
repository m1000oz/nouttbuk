-- obtener_apunte_compartido: lectura pública de un apunte por enlace_token,
-- sin sesión, independiente de `visibilidad` (a diferencia de
-- get_publicacion_counts / apuntes_select_anon_community, que sí filtran
-- por 'community').

begin;
select plan(7);

-- Fixture: un apunte privado del dueño, sin compartir todavía.
do $$
declare
  dueno_id uuid := gen_random_uuid();
  otro_id uuid := gen_random_uuid();
  v_apunte_id uuid;
begin
  insert into auth.users (id, email) values
    (dueno_id, 'dueno.enlace@pucp.edu.pe'),
    (otro_id, 'otro.enlace@pucp.edu.pe');

  perform set_config('test.dueno_id', dueno_id::text, false);
  perform set_config('test.otro_id', otro_id::text, false);

  insert into public.apuntes (titulo, autor_id, visibilidad)
    values ('Apunte privado compartible', dueno_id, 'private')
    returning id into v_apunte_id;

  perform set_config('test.apunte_id', v_apunte_id::text, false);
end $$;

-- anon no ve nada todavía: no hay enlace_token seteado.
set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select is(
  (select count(*) from public.obtener_apunte_compartido(gen_random_uuid()))::int,
  0,
  'anon con un token al azar no recibe ninguna fila'
);

reset role;

-- El dueño genera el enlace (cubierto por apuntes_update_editable ya
-- existente, no por una policy nueva).
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.dueno_id'), true);

do $$
declare
  v_token uuid := gen_random_uuid();
begin
  update public.apuntes set enlace_token = v_token
    where id = current_setting('test.apunte_id')::uuid;

  perform set_config('test.token', v_token::text, false);
end $$;

select is(
  (select enlace_token::text from public.apuntes where id = current_setting('test.apunte_id')::uuid),
  current_setting('test.token'),
  'el dueño puede setear enlace_token en su propio apunte privado'
);

reset role;

-- anon, con el token correcto, SÍ puede leer el apunte privado vía la RPC.
set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select is(
  (select titulo from public.obtener_apunte_compartido(current_setting('test.token')::uuid)),
  'Apunte privado compartible',
  'anon con el token correcto lee el apunte privado vía la RPC'
);

select is(
  (select count(*) from public.obtener_apunte_compartido(gen_random_uuid()))::int,
  0,
  'anon con un token distinto (aunque exista uno real) sigue sin recibir fila'
);

-- Pero la tabla apuntes en crudo sigue completamente cerrada para anon: el
-- único camino público es la función, no una policy de RLS nueva.
select is(
  (select count(*) from public.apuntes where id = current_setting('test.apunte_id')::uuid)::int,
  0,
  'anon no ve el apunte privado con select directo sobre apuntes, aunque tenga enlace_token'
);

reset role;

-- El dueño revoca (enlace_token = null): el token viejo deja de servir.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.dueno_id'), true);

update public.apuntes set enlace_token = null
  where id = current_setting('test.apunte_id')::uuid;

reset role;

set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select is(
  (select count(*) from public.obtener_apunte_compartido(current_setting('test.token')::uuid))::int,
  0,
  'tras revocar (enlace_token = null), el token antiguo ya no devuelve fila'
);

reset role;

-- Un usuario ajeno (ni dueño ni colaborador) no puede setear enlace_token en
-- un apunte que no es suyo (apuntes_update_editable ya lo bloquea).
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.otro_id'), true);

update public.apuntes set enlace_token = gen_random_uuid()
  where id = current_setting('test.apunte_id')::uuid;

select is(
  (select enlace_token from public.apuntes where id = current_setting('test.apunte_id')::uuid),
  null,
  'un usuario ajeno no puede setear enlace_token en un apunte que no es suyo'
);

reset role;
select * from finish();
rollback;
