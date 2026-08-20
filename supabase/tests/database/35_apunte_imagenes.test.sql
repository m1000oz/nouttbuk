-- Bucket de Storage para imágenes insertadas en el contenido de un apunte
-- (20260822090000_apunte_imagenes.sql).

begin;
select plan(1);

select ok(
  exists (
    select 1 from storage.buckets where id = 'apunte-imagenes' and public = true
  ),
  'el bucket apunte-imagenes existe y es público'
);

select * from finish();
rollback;
