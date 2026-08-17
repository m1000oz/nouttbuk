-- Tablas sociales: publicaciones, reacciones, guardados, comentarios y colaboradores.

create table public.publicaciones (
  id uuid primary key default gen_random_uuid(),
  apunte_id uuid not null unique references public.apuntes(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.reacciones (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references public.publicaciones(id) on delete cascade,
  perfil_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (publicacion_id, perfil_id)
);
create index reacciones_perfil_idx on public.reacciones (perfil_id);

create table public.guardados (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references public.publicaciones(id) on delete cascade,
  perfil_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (publicacion_id, perfil_id)
);
create index guardados_perfil_idx on public.guardados (perfil_id);

create table public.comentarios (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references public.publicaciones(id) on delete cascade,
  autor_id uuid not null references public.profiles(id) on delete cascade,
  texto text not null,
  created_at timestamptz not null default now()
);
create index comentarios_publicacion_idx on public.comentarios (publicacion_id, created_at);

create table public.colaboradores (
  apunte_id uuid not null references public.apuntes(id) on delete cascade,
  perfil_id uuid not null references public.profiles(id) on delete cascade,
  permiso public.permiso_colaborador not null default 'read',
  created_at timestamptz not null default now(),
  primary key (apunte_id, perfil_id)
);
create index colaboradores_perfil_idx on public.colaboradores (perfil_id);
