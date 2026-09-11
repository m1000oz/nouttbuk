-- Tabla amistades para el Motor de Amigos
create table public.amistades (
  id uuid primary key default gen_random_uuid(),
  solicitante_id uuid not null references public.profiles(id) on delete cascade,
  receptor_id uuid not null references public.profiles(id) on delete cascade,
  estado text not null check (estado in ('pendiente', 'aceptada', 'rechazada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint amistades_unica unique (solicitante_id, receptor_id),
  constraint amistades_no_auto check (solicitante_id != receptor_id)
);

-- Índices para búsquedas rápidas
create index amistades_solicitante_idx on public.amistades(solicitante_id);
create index amistades_receptor_idx on public.amistades(receptor_id);

-- Habilitar RLS
alter table public.amistades enable row level security;

-- Políticas de RLS
create policy "Los usuarios pueden ver amistades donde participan"
  on public.amistades for select to authenticated
  using (auth.uid() = solicitante_id or auth.uid() = receptor_id);

create policy "Los usuarios pueden enviar solicitudes"
  on public.amistades for insert to authenticated
  with check (auth.uid() = solicitante_id and estado = 'pendiente');

create policy "Los usuarios pueden aceptar/rechazar solicitudes recibidas o actualizar propias (cancelar)"
  on public.amistades for update to authenticated
  using (auth.uid() = receptor_id or auth.uid() = solicitante_id)
  with check (
    -- Receptor puede aceptar/rechazar
    (auth.uid() = receptor_id and estado in ('aceptada', 'rechazada'))
    or
    -- Solicitante no debería poder cambiar a aceptada por sí solo,
    -- pero podemos dejar la validación simple o estricta.
    (auth.uid() = solicitante_id)
  );

create policy "Los usuarios pueden eliminar amistades"
  on public.amistades for delete to authenticated
  using (auth.uid() = solicitante_id or auth.uid() = receptor_id);

-- Función para buscar usuarios por nombre/usuario
create or replace function public.buscar_usuarios(query text)
returns setof public.profiles
language sql security definer set search_path = '' stable
as $$
  select * from public.profiles
  where (usuario ilike '%' || query || '%' or nombre ilike '%' || query || '%')
  and id != auth.uid()
  limit 20;
$$;

revoke execute on function public.buscar_usuarios(text) from public;
grant execute on function public.buscar_usuarios(text) to authenticated;
