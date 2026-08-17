-- Tablas core: perfiles, carpetas (materias) y apuntes.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  usuario text not null unique,
  carrera text,
  universidad text not null default 'Pontificia Universidad Católica del Perú',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.carpetas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  color text not null,
  icono text,
  descripcion text,
  propietario_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index carpetas_propietario_idx on public.carpetas (propietario_id);

create table public.apuntes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  contenido jsonb not null default '{}'::jsonb,
  etiquetas text[] not null default '{}',
  carpeta_id uuid references public.carpetas(id) on delete set null,
  autor_id uuid not null references public.profiles(id) on delete cascade,
  favorito boolean not null default false,
  visibilidad public.apunte_visibilidad not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index apuntes_autor_idx on public.apuntes (autor_id);
create index apuntes_carpeta_idx on public.apuntes (carpeta_id);

-- Índice parcial para la consulta más frecuente: el feed público de comunidad.
create index apuntes_feed_comunidad_idx
  on public.apuntes (created_at desc)
  where visibilidad = 'community';
