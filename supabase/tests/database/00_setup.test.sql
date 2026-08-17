-- Sanidad del esquema: extensiones, tipos y RLS habilitado en todas las
-- tablas del modelo de datos.

begin;
select plan(11);

select has_schema('private');
select has_extension('pgcrypto');

select has_table('public', 'profiles');
select has_table('public', 'carpetas');
select has_table('public', 'apuntes');
select has_table('public', 'publicaciones');
select has_table('public', 'reacciones');
select has_table('public', 'guardados');
select has_table('public', 'comentarios');
select has_table('public', 'colaboradores');

select ok(
  (
    select bool_and(relrowsecurity)
    from pg_class
    where relnamespace = 'public'::regnamespace
      and relname in (
        'profiles', 'carpetas', 'apuntes', 'publicaciones',
        'reacciones', 'guardados', 'comentarios', 'colaboradores'
      )
  ),
  'todas las tablas del modelo tienen row level security habilitado'
);

select * from finish();
rollback;
