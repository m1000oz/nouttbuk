-- El enlace público ahora tiene un nivel de acceso asociado (Lector/Editor,
-- pedido explícito del usuario, "como Google Docs"), reutilizando el mismo
-- enum `permiso_colaborador` que ya usan los colaboradores invitados por
-- usuario (`read`/`edit`), no un enum nuevo: semánticamente es el mismo
-- permiso, solo que otorgado por enlace en vez de por invitación explícita.
alter table public.apuntes
  add column enlace_permiso public.permiso_colaborador not null default 'read';

-- obtener_apunte_compartido se recrea (drop + create, un `create or replace`
-- no permite agregar una columna a un RETURNS TABLE existente) para incluir
-- `enlace_permiso`: la vista pública de solo lectura (visitante sin sesión)
-- lo usa solo para variar el mensaje del CTA ("Inicia sesión para editar"
-- vs. el genérico), nunca para otorgar edición sin cuenta.
drop function if exists public.obtener_apunte_compartido(uuid);

create or replace function public.obtener_apunte_compartido(p_token uuid)
returns table (
  id uuid,
  titulo text,
  contenido jsonb,
  created_at timestamptz,
  curso_nombre text,
  enlace_permiso public.permiso_colaborador,
  autor_id uuid,
  autor_nombre text,
  autor_usuario text,
  autor_avatar_url text
)
language sql security definer set search_path = '' stable
as $$
  select
    a.id, a.titulo, a.contenido, a.created_at,
    c.nombre, a.enlace_permiso, a.autor_id, p.nombre, p.usuario, p.avatar_url
  from public.apuntes a
  join public.profiles p on p.id = a.autor_id
  left join public.cursos c on c.id = a.curso_id
  where a.enlace_token = p_token;
$$;

revoke execute on function public.obtener_apunte_compartido(uuid) from public;
grant execute on function public.obtener_apunte_compartido(uuid) to anon, authenticated;
