-- Bucket de Storage para imágenes insertadas dentro del contenido de un
-- apunte (botón "Insertar imagen" del editor). Separado del bucket
-- `avatars` por claridad organizacional, mismo modelo de seguridad exacto:
-- público para lectura (una imagen dentro de un apunte `community` debe
-- verse sin sesión, igual que el resto del feed), escritura solo dentro de
-- la propia carpeta ({user_id}/...).

insert into storage.buckets (id, name, public)
values ('apunte-imagenes', 'apunte-imagenes', true)
on conflict (id) do nothing;

create policy "apunte_imagenes_select_public" on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'apunte-imagenes');

create policy "apunte_imagenes_insert_own" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'apunte-imagenes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "apunte_imagenes_delete_own" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'apunte-imagenes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
