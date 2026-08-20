-- Sanidad del esquema: extensiones, tipos y RLS habilitado en todas las
-- tablas del modelo de datos.

begin;
select plan(13);

select has_schema('private');
select has_extension('pgcrypto');

-- has_table(schema, tabla) es ambiguo entre las sobrecargas
-- has_table(name, name) y has_table(name, text) de pgTAP 1.3.3: sin un
-- tercer argumento (o casts explícitos a ::name), Postgres resuelve al
-- overload equivocado (name, text) y trata 'public' como nombre de tabla y
-- 'profiles' como descripción, fallando siempre. El tercer argumento fuerza
-- la sobrecarga de 3 posiciones, sin ambigüedad posible, y de paso deja un
-- mensaje de fallo más claro que el default.
select has_table('public', 'profiles', 'la tabla public.profiles existe');
select has_table('public', 'carpetas', 'la tabla public.carpetas existe');
select has_table('public', 'apuntes', 'la tabla public.apuntes existe');
select has_table('public', 'publicaciones', 'la tabla public.publicaciones existe');
select has_table('public', 'reacciones', 'la tabla public.reacciones existe');
select has_table('public', 'guardados', 'la tabla public.guardados existe');
select has_table('public', 'comentarios', 'la tabla public.comentarios existe');
select has_table('public', 'colaboradores', 'la tabla public.colaboradores existe');
select has_table('public', 'feedback', 'la tabla public.feedback existe');
select has_table('public', 'feedback_votos', 'la tabla public.feedback_votos existe');

select ok(
  (
    select bool_and(relrowsecurity)
    from pg_class
    where relnamespace = 'public'::regnamespace
      and relname in (
        'profiles', 'carpetas', 'apuntes', 'publicaciones',
        'reacciones', 'guardados', 'comentarios', 'colaboradores',
        'feedback', 'feedback_votos'
      )
  ),
  'todas las tablas del modelo tienen row level security habilitado'
);

select * from finish();
rollback;
