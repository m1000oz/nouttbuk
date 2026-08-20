-- Foto de perfil (bucket de Storage) y límite de frecuencia para cambiar de
-- usuario (máximo un cambio cada 7 días).

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Los avatares ya se muestran sin sesión en el feed público de Comunidad
-- (mismo criterio que profiles_select_public), así que la lectura es
-- pública. Escritura solo dentro de la propia carpeta ({user_id}/...), igual
-- que el resto de policies de este proyecto que acotan por auth.uid().
create policy "avatars_select_public" on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'avatars');

create policy "avatars_insert_own" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- null = nunca se cambió el usuario desde el registro, el primer cambio
-- siempre está permitido.
alter table public.profiles
  add column usuario_actualizado_en timestamptz;

create or replace function private.limitar_cambio_usuario()
returns trigger language plpgsql as $$
begin
  if new.usuario is distinct from old.usuario then
    if old.usuario_actualizado_en is not null
      and now() - old.usuario_actualizado_en < interval '7 days'
    then
      raise exception 'Solo puedes cambiar tu usuario una vez cada 7 días'
        using errcode = 'check_violation';
    end if;
    new.usuario_actualizado_en = now();
  end if;
  return new;
end;
$$;

create trigger limitar_cambio_usuario_trigger
  before update on public.profiles
  for each row execute function private.limitar_cambio_usuario();
