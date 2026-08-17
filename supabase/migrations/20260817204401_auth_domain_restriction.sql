-- Restricción de registro a correo institucional @pucp.edu.pe (MVP cerrado a
-- una sola universidad) y creación automática del perfil al registrarse.

create or replace function private.validar_dominio_institucional()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.email is null or new.email !~* '@pucp\.edu\.pe$' then
    raise exception 'El registro solo está permitido con un correo institucional @pucp.edu.pe'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger validar_dominio_institucional_trigger
  before insert on auth.users
  for each row execute function private.validar_dominio_institucional();

-- raw_user_meta_data se usa solo para prellenar campos de visualización del
-- perfil al registrarse, nunca para decisiones de autorización (eso vive en
-- las policies de RLS, no en datos que el propio usuario puede enviar).
create or replace function private.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, nombre, usuario, carrera, universidad)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'usuario', 'user_' || substr(new.id::text, 1, 8)),
    new.raw_user_meta_data ->> 'carrera',
    'Pontificia Universidad Católica del Perú'
  );
  return new;
end;
$$;

create trigger handle_new_user_trigger
  after insert on auth.users
  for each row execute function private.handle_new_user();
