-- La publicación `supabase_realtime` no tenía ninguna tabla agregada en todo
-- el proyecto (confirmado consultando pg_publication_tables): el canal
-- `carpetas-pro-tools` que ya existía en pro-tools-context.tsx nunca
-- funcionó de verdad, sus `.on('postgres_changes', ...)` no tenían ninguna
-- tabla real detrás para escuchar. Descubierto al verificar en vivo que dos
-- pestañas con la misma sesión no sincronizaban un post-it recién editado.
-- postgres_changes de Supabase Realtime requiere que la tabla esté agregada
-- explícitamente a esta publicación, no alcanza con RLS/grants.
alter publication supabase_realtime add table
  public.carpetas,
  public.notas_adhesivas,
  public.tareas_rapidas;
