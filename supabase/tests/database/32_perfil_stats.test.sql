-- get_perfil_stats: conteos propios (apuntes/aportes/contactos) para la
-- pantalla de Perfil. "aportes" cuenta reacciones de terceros sobre las
-- publicaciones propias (RLS de reacciones no lo permitiría en crudo).
-- "contactos" deduplica personas que aparecen por ambos lados de
-- colaboradores (como dueño que invita, y como invitado en apunte ajeno).

begin;
select plan(6);

-- Fixtures: dueño (a quien le medimos las stats), dos personas que
-- reaccionan a su publicación, un colaborador invitado por el dueño (a dos
-- de sus apuntes, para probar que no se cuenta dos veces) y otro dueño que
-- invita al dueño principal como colaborador en un apunte ajeno.
do $$
declare
  dueno_id uuid := gen_random_uuid();
  reactor_id uuid := gen_random_uuid();
  colaborador_id uuid := gen_random_uuid();
  otro_dueno_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, email) values
    (dueno_id, 'dueno.stats@pucp.edu.pe'),
    (reactor_id, 'reactor.stats@pucp.edu.pe'),
    (colaborador_id, 'colaborador.stats@pucp.edu.pe'),
    (otro_dueno_id, 'otro.dueno.stats@pucp.edu.pe');

  perform set_config('test.dueno_id', dueno_id::text, false);
  perform set_config('test.reactor_id', reactor_id::text, false);
  perform set_config('test.colaborador_id', colaborador_id::text, false);
  perform set_config('test.otro_dueno_id', otro_dueno_id::text, false);
end $$;

-- El dueño crea sus tres apuntes (community + group + private) e invita al
-- mismo colaborador en dos de ellos (dedup de "contactos").
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.dueno_id'), true);

do $$
declare
  v_comunidad_id uuid;
  v_grupo_id uuid;
  v_privado_id uuid;
  v_publicacion_id uuid;
begin
  insert into public.apuntes (titulo, autor_id, visibilidad)
    values ('Apunte comunidad', current_setting('test.dueno_id')::uuid, 'community')
    returning id into v_comunidad_id;

  insert into public.apuntes (titulo, autor_id, visibilidad)
    values ('Apunte grupo', current_setting('test.dueno_id')::uuid, 'group')
    returning id into v_grupo_id;

  insert into public.apuntes (titulo, autor_id, visibilidad)
    values ('Apunte privado', current_setting('test.dueno_id')::uuid, 'private')
    returning id into v_privado_id;

  select id into v_publicacion_id
    from public.publicaciones
    where apunte_id = v_comunidad_id;

  insert into public.colaboradores (apunte_id, perfil_id, permiso)
    values
      (v_grupo_id, current_setting('test.colaborador_id')::uuid, 'read'),
      (v_privado_id, current_setting('test.colaborador_id')::uuid, 'edit');

  perform set_config('test.publicacion_id', v_publicacion_id::text, false);
end $$;

reset role;

-- Otro dueño invita al dueño principal como colaborador en un apunte ajeno:
-- debe sumar como contacto adicional (perspectiva "invitado en apunte de otro").
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.otro_dueno_id'), true);

do $$
declare
  v_apunte_ajeno_id uuid;
begin
  insert into public.apuntes (titulo, autor_id, visibilidad)
    values ('Apunte ajeno', current_setting('test.otro_dueno_id')::uuid, 'private')
    returning id into v_apunte_ajeno_id;

  insert into public.colaboradores (apunte_id, perfil_id, permiso)
    values (v_apunte_ajeno_id, current_setting('test.dueno_id')::uuid, 'read');
end $$;

reset role;

-- Dos personas distintas reaccionan a la publicación community del dueño.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.reactor_id'), true);
insert into public.reacciones (publicacion_id, perfil_id)
  values (current_setting('test.publicacion_id')::uuid, current_setting('test.reactor_id')::uuid);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.colaborador_id'), true);
insert into public.reacciones (publicacion_id, perfil_id)
  values (current_setting('test.publicacion_id')::uuid, current_setting('test.colaborador_id')::uuid);
reset role;

-- El dueño consulta sus propias stats.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.dueno_id'), true);

select is(
  (select apuntes from public.get_perfil_stats()),
  3::bigint,
  'el dueño ve sus tres apuntes en el conteo'
);
select is(
  (select aportes from public.get_perfil_stats()),
  2::bigint,
  'el dueño ve las dos reacciones recibidas como aportes'
);
select is(
  (select contactos from public.get_perfil_stats()),
  2::bigint,
  'contactos deduplica al colaborador invitado dos veces y suma al otro dueño'
);

reset role;

-- Alguien sin apuntes/reacciones/colaboraciones propias ve todo en cero, no
-- filas ausentes.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.reactor_id'), true);

select is(
  (select apuntes from public.get_perfil_stats()),
  0::bigint,
  'sin apuntes propios, el conteo es cero'
);
select is(
  (select aportes from public.get_perfil_stats()),
  0::bigint,
  'sin publicaciones propias, los aportes son cero'
);
select is(
  (select contactos from public.get_perfil_stats()),
  0::bigint,
  'sin colaboraciones, los contactos son cero'
);

reset role;
select * from finish();
rollback;
