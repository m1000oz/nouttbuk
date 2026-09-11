-- unirse_por_enlace: un visitante con sesión que abre un enlace público
-- 'edit'/'read' se vuelve colaborador real (colaboradores_manage_owner
-- normalmente solo deja gestionar colaboradores al dueño), y la visibilidad
-- de un apunte 'private' sube a 'group' para que ese colaborador realmente
-- pueda leerlo (private.can_read_group_apunte lo exige). anon nunca puede
-- llamarla (sin grant de EXECUTE), y nunca degrada un permiso 'edit' ya
-- existente a 'read'.

begin;
select plan(9);

do $$
declare
  dueno_id uuid := gen_random_uuid();
  visitante_id uuid := gen_random_uuid();
  v_apunte_id uuid;
  v_token uuid := gen_random_uuid();
begin
  insert into auth.users (id, email) values
    (dueno_id, 'dueno.unirse@pucp.edu.pe'),
    (visitante_id, 'visitante.unirse@pucp.edu.pe');

  perform set_config('test.dueno_id', dueno_id::text, false);
  perform set_config('test.visitante_id', visitante_id::text, false);
  perform set_config('test.token', v_token::text, false);

  insert into public.apuntes (titulo, autor_id, visibilidad, enlace_token, enlace_permiso)
    values ('Apunte con enlace de lector', dueno_id, 'private', v_token, 'read')
    returning id into v_apunte_id;

  perform set_config('test.apunte_id', v_apunte_id::text, false);
end $$;

-- anon nunca puede invocarla: sin EXECUTE grant, falla en vez de devolver
-- silenciosamente cero filas.
set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select throws_ok(
  format('select * from public.unirse_por_enlace(%L::uuid)', current_setting('test.token')),
  '42501',
  'permission denied for function unirse_por_enlace',
  'anon no puede invocar unirse_por_enlace: falla, no devuelve vacío'
);

reset role;

-- Un token al azar no une a nadie a nada.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.visitante_id'), true);

select is(
  (select count(*) from public.unirse_por_enlace(gen_random_uuid()))::int,
  0,
  'un token al azar no devuelve ninguna fila'
);

-- El visitante se une con el enlace de Lector real.
select is(
  (select apunte_id_resultado from public.unirse_por_enlace(current_setting('test.token')::uuid)),
  current_setting('test.apunte_id')::uuid,
  'el visitante se une correctamente y recibe el id del apunte'
);

reset role;

-- Verificación directa como el dueño (no depende todavía de que la RLS de
-- lectura del propio visitante funcione): se creó la fila de colaborador
-- con permiso 'read'...
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.dueno_id'), true);

select is(
  (select permiso::text from public.colaboradores
     where apunte_id = current_setting('test.apunte_id')::uuid
       and perfil_id = current_setting('test.visitante_id')::uuid),
  'read',
  'unirse_por_enlace crea al visitante como colaborador con permiso read'
);

-- ...y la visibilidad subió de 'private' a 'group' (si no, la fila de
-- colaborador de arriba sería letra muerta bajo RLS).
select is(
  (select visibilidad::text from public.apuntes where id = current_setting('test.apunte_id')::uuid),
  'group',
  'la visibilidad sube de private a group al unirse alguien por enlace'
);

reset role;

-- Prueba de fuego: el visitante, bajo su propia sesión, ahora sí puede leer
-- el apunte por la vía normal de RLS, no solo por la RPC de lectura pública.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.visitante_id'), true);

select ok(
  exists (select 1 from public.apuntes where id = current_setting('test.apunte_id')::uuid),
  'tras unirse, el visitante ve el apunte por RLS normal, no solo por la RPC pública'
);

reset role;

-- El dueño invocando su propio enlace es un no-op: sigue habiendo un único
-- colaborador (el visitante), no se crea una fila para el dueño mismo.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.dueno_id'), true);

select public.unirse_por_enlace(current_setting('test.token')::uuid);

select is(
  (select count(*) from public.colaboradores where apunte_id = current_setting('test.apunte_id')::uuid)::int,
  1,
  'el dueño invocando su propio enlace no se agrega a sí mismo como colaborador'
);

-- El dueño sube el enlace a Editor y el visitante vuelve a entrar: su
-- permiso de colaborador se actualiza de read a edit.
update public.apuntes set enlace_permiso = 'edit'
  where id = current_setting('test.apunte_id')::uuid;

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.visitante_id'), true);
select public.unirse_por_enlace(current_setting('test.token')::uuid);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.dueno_id'), true);

select is(
  (select permiso::text from public.colaboradores
     where apunte_id = current_setting('test.apunte_id')::uuid
       and perfil_id = current_setting('test.visitante_id')::uuid),
  'edit',
  'un enlace de Editor sube el permiso del colaborador existente de read a edit'
);

-- El dueño vuelve a bajar el enlace a Lector: el visitante ya colaborador
-- 'edit' NO se degrada al volver a entrar.
update public.apuntes set enlace_permiso = 'read'
  where id = current_setting('test.apunte_id')::uuid;

reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.visitante_id'), true);
select public.unirse_por_enlace(current_setting('test.token')::uuid);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.dueno_id'), true);

select is(
  (select permiso::text from public.colaboradores
     where apunte_id = current_setting('test.apunte_id')::uuid
       and perfil_id = current_setting('test.visitante_id')::uuid),
  'edit',
  'un enlace de Lector más nuevo no degrada a un colaborador que ya tenía edit'
);

reset role;
select * from finish();
rollback;
