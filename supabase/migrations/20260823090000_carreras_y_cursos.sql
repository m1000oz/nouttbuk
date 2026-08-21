-- Catálogo real de carreras de pregrado PUCP (reemplaza profiles.carrera de
-- texto libre por una FK) y catálogo de cursos reales para un subconjunto
-- representativo de carreras (etiquetar apuntes + filtrar Comunidad).

create table public.carreras (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  facultad text not null
);

create table public.cursos (
  id uuid primary key default gen_random_uuid(),
  carrera_id uuid not null references public.carreras(id) on delete cascade,
  nombre text not null,
  unique (carrera_id, nombre)
);
create index cursos_carrera_idx on public.cursos (carrera_id);

alter table public.carreras enable row level security;
alter table public.cursos enable row level security;

-- Mismo patrón que profiles_select_public: catálogo público de solo lectura,
-- sin insert/update/delete desde la app (lo mantiene el equipo vía migración).
create policy carreras_select_public on public.carreras
  for select to anon, authenticated using (true);
create policy cursos_select_public on public.cursos
  for select to anon, authenticated using (true);

-- Grants explícitos: RLS no alcanza sin el grant de tabla (gotcha ya
-- documentado dos veces en este proyecto, ver CLAUDE.md).
grant select on public.carreras to anon, authenticated;
grant select on public.cursos to anon, authenticated;

-- Las 55 carreras de pregrado oficiales, obtenidas de
-- https://www.pucp.edu.pe/pregrado/carreras/por-lista/
insert into public.carreras (nombre, facultad) values
  ('Antropología', 'Facultad de Ciencias Sociales'),
  ('Arqueología', 'Facultad de Letras y Ciencias Humanas'),
  ('Arquitectura', 'Facultad de Arquitectura y Urbanismo'),
  ('Arte, moda y diseño textil', 'Facultad de Arte y Diseño'),
  ('Ciencia Política y Gobierno', 'Facultad de Ciencias Sociales'),
  ('Ciencias de la Información', 'Facultad de Letras y Ciencias Humanas'),
  ('Comunicación Audiovisual', 'Facultad de Ciencias y Artes de la Comunicación'),
  ('Comunicación para el desarrollo', 'Facultad de Ciencias y Artes de la Comunicación'),
  ('Contabilidad', 'Facultad de Ciencias Contables'),
  ('Creación y Producción Escénica', 'Facultad de Artes Escénicas'),
  ('Danza', 'Facultad de Artes Escénicas'),
  ('Derecho', 'Facultad de Derecho'),
  ('Diseño Gráfico', 'Facultad de Arte y Diseño'),
  ('Diseño Industrial', 'Facultad de Arte y Diseño'),
  ('Economía', 'Facultad de Ciencias Sociales'),
  ('Educación Artística', 'Facultad de Arte y Diseño'),
  ('Educación Inicial', 'Facultad de Educación'),
  ('Educación Primaria', 'Facultad de Educación'),
  ('Educación Secundaria', 'Facultad de Educación'),
  ('Escultura', 'Facultad de Arte y Diseño'),
  ('Estadística', 'Facultad de Ciencias e Ingeniería'),
  ('Filosofía', 'Facultad de Letras y Ciencias Humanas'),
  ('Finanzas', 'Facultad de Ciencias Sociales'),
  ('Física', 'Facultad de Ciencias e Ingeniería'),
  ('Gastronomía', 'Facultad de Gastronomía, Hotelería y Turismo'),
  ('Geografía y Medio Ambiente', 'Facultad de Letras y Ciencias Humanas'),
  ('Gestión', 'Facultad de Gestión y Alta Dirección'),
  ('Grabado', 'Facultad de Arte y Diseño'),
  ('Historia', 'Facultad de Letras y Ciencias Humanas'),
  ('Hotelería', 'Facultad de Gastronomía, Hotelería y Turismo'),
  ('Humanidades', 'Facultad de Letras y Ciencias Humanas'),
  ('Ingeniería Ambiental y Sostenible', 'Facultad de Ciencias e Ingeniería'),
  ('Ingeniería Biomédica', 'Facultad de Ciencias e Ingeniería'),
  ('Ingeniería Civil', 'Facultad de Ciencias e Ingeniería'),
  ('Ingeniería de las Telecomunicaciones', 'Facultad de Ciencias e Ingeniería'),
  ('Ingeniería de Minas', 'Facultad de Ciencias e Ingeniería'),
  ('Ingeniería Electrónica', 'Facultad de Ciencias e Ingeniería'),
  ('Ingeniería Geológica', 'Facultad de Ciencias e Ingeniería'),
  ('Ingeniería Industrial', 'Facultad de Ciencias e Ingeniería'),
  ('Ingeniería Informática', 'Facultad de Ciencias e Ingeniería'),
  ('Ingeniería Mecánica', 'Facultad de Ciencias e Ingeniería'),
  ('Ingeniería Mecatrónica', 'Facultad de Ciencias e Ingeniería'),
  ('Ingeniería Química', 'Facultad de Ciencias e Ingeniería'),
  ('Lingüística y Literatura', 'Facultad de Letras y Ciencias Humanas'),
  ('Matemáticas', 'Facultad de Ciencias e Ingeniería'),
  ('Música', 'Facultad de Artes Escénicas'),
  ('Periodismo', 'Facultad de Ciencias y Artes de la Comunicación'),
  ('Pintura', 'Facultad de Arte y Diseño'),
  ('Psicología', 'Facultad de Psicología'),
  ('Publicidad', 'Facultad de Ciencias y Artes de la Comunicación'),
  ('Química', 'Facultad de Ciencias e Ingeniería'),
  ('Relaciones Internacionales', 'Facultad de Ciencias Sociales'),
  ('Sociología', 'Facultad de Ciencias Sociales'),
  ('Teatro', 'Facultad de Artes Escénicas'),
  ('Turismo', 'Facultad de Gastronomía, Hotelería y Turismo');

-- Cursos reales para 8 carreras representativas (no las 55: ver plan de
-- implementación), obtenidos de mallas curriculares y planes de estudio
-- públicos de PUCP (facultad-ciencias-ingenieria, facultad-derecho,
-- facultad-ciencias-sociales, facultad-psicologia, facultad-ciencias-contables,
-- facultad de gestión y alta dirección, facultad de comunicaciones), priorizando
-- cursos troncales reconocibles de cada carrera sobre la malla exhaustiva con
-- códigos, que no es scrapeable de forma confiable en una sola pasada.
insert into public.cursos (carrera_id, nombre)
select id, curso from public.carreras, unnest(array[
  'Programación',
  'Estructuras de Datos',
  'Algoritmia',
  'Organización y Arquitectura de Computadoras',
  'Electrónica Digital',
  'Sistemas Operativos',
  'Sistemas de Información',
  'Redes y Computadoras',
  'Ingeniería de Software',
  'Bases de Datos',
  'Inteligencia Artificial'
]) as curso
where nombre = 'Ingeniería Informática';

insert into public.cursos (carrera_id, nombre)
select id, curso from public.carreras, unnest(array[
  'Economía',
  'Dibujo Mecánico',
  'Programación',
  'Gestión Empresarial',
  'Termodinámica',
  'Cadena de Suministros y Operaciones',
  'Gestión del Talento Humano',
  'Procesos de Manufactura',
  'Procesos Industriales',
  'Finanzas',
  'Gestión Ambiental',
  'Automatización',
  'Gestión y Diseño de Sistemas'
]) as curso
where nombre = 'Ingeniería Industrial';

insert into public.cursos (carrera_id, nombre)
select id, curso from public.carreras, unnest(array[
  'Contabilidad de Gestión',
  'Teoría Organizacional',
  'Comportamiento Organizacional',
  'Principios de Marketing',
  'Gestión de Operaciones',
  'Introducción a la Gestión de Personas',
  'Matemática Financiera',
  'Fundamentos de Finanzas Corporativas',
  'Gestión Estratégica',
  'Gestión de la Logística',
  'Ética para la Gestión',
  'Gestión Comercial',
  'Plan de Negocios',
  'Gestión Pública',
  'Gestión Social',
  'Marketing Digital',
  'Negociación',
  'Gestión Financiera'
]) as curso
where nombre = 'Gestión';

insert into public.cursos (carrera_id, nombre)
select id, curso from public.carreras, unnest(array[
  'Introducción a las Ciencias Jurídicas',
  'Derecho Constitucional I',
  'Instituciones del Derecho Privado',
  'Argumentación Jurídica',
  'Reales',
  'Contratos',
  'Familia',
  'Teoría del Delito',
  'Derecho Laboral General',
  'Sociedades Anónimas',
  'Obligaciones',
  'Derecho Administrativo 1',
  'Responsabilidad Civil',
  'Sucesiones',
  'Derecho Tributario General',
  'Derechos Humanos',
  'Derecho Internacional Público',
  'Filosofía del Derecho'
]) as curso
where nombre = 'Derecho';

insert into public.cursos (carrera_id, nombre)
select id, curso from public.carreras, unnest(array[
  'Historia Económica 1',
  'Microeconomía 1',
  'Macroeconomía 1',
  'Matemáticas para Economistas',
  'Estadística Inferencial',
  'Microeconomía 2',
  'Macroeconomía 2',
  'Deontología: Ética y Economía',
  'Econometría 1',
  'Economía Internacional 1',
  'Historia del Pensamiento Económico',
  'Teoría Monetaria',
  'Seminario de Economía Peruana',
  'Organización Industrial',
  'Econometría 2',
  'Economía Pública',
  'Teoría del Desarrollo'
]) as curso
where nombre = 'Economía';

insert into public.cursos (carrera_id, nombre)
select id, curso from public.carreras, unnest(array[
  'Desarrollo Humano 1',
  'Sistemas Psicológicos',
  'Procesos Cognitivos y Afectivos',
  'Neurociencias del Comportamiento',
  'Técnicas de Observación y Entrevista',
  'Ética y Responsabilidad Profesional',
  'Investigación Psicológica',
  'Personalidad',
  'Motivación y Emoción',
  'Psicología del Aprendizaje',
  'Investigación Cualitativa',
  'Psicología Social',
  'Psicología de la Anormalidad',
  'Evaluación Psicológica 1',
  'Psicología y Salud',
  'Neuropsicología',
  'Psicología Comunitaria',
  'Psicología y Familia',
  'Comportamiento del Consumidor',
  'Gestión de Recursos Humanos'
]) as curso
where nombre = 'Psicología';

insert into public.cursos (carrera_id, nombre)
select id, curso from public.carreras, unnest(array[
  'Teorías de la Comunicación',
  'Lenguaje de los Medios',
  'Comunicación y Medios Digitales',
  'Fotografía',
  'Medios Audiovisuales',
  'Narración Audiovisual',
  'Estética y Comunicación',
  'Registro de Imagen y Audio',
  'Producción para Medios Audiovisuales',
  'Técnicas de Guion',
  'Semiótica para Comunicaciones',
  'Legislación en Comunicaciones',
  'Realización de Audio y Video',
  'Iluminación',
  'Edición de Video',
  'Proyecto de Comunicación Audiovisual'
]) as curso
where nombre = 'Comunicación Audiovisual';

insert into public.cursos (carrera_id, nombre)
select id, curso from public.carreras, unnest(array[
  'Contabilidad Financiera Básica',
  'Contabilidad Financiera Intermedia',
  'Contabilidad Financiera Avanzada 1',
  'Contabilidad Financiera Avanzada 2',
  'Contabilidad de Costos 1',
  'Contabilidad de Costos 2',
  'Contabilidad de Gestión',
  'Cálculo Financiero',
  'Decisiones de Inversión',
  'Decisiones de Financiamiento',
  'Instrumentos Derivados',
  'Derecho Empresarial',
  'Derecho Tributario',
  'Tributación Contable 1',
  'Tributación Contable 2',
  'Auditoría de la Información Financiera 1',
  'Sistemas de Información Contable 1',
  'Ética Profesional'
]) as curso
where nombre = 'Contabilidad';

-- profiles.carrera: de texto libre a FK real. Backfill por coincidencia
-- exacta de nombre antes de tirar la columna vieja (en local no hay datos
-- reales que perder, pero el patrón es correcto igual para cualquier fila
-- existente en un entorno con datos reales).
alter table public.profiles add column carrera_id uuid references public.carreras(id) on delete set null;
update public.profiles p set carrera_id = c.id
  from public.carreras c where lower(trim(p.carrera)) = lower(c.nombre);
alter table public.profiles drop column carrera;

-- apuntes.curso_id: mismo patrón que carpeta_id (nullable, on delete set null,
-- índice para el filtro de Comunidad).
alter table public.apuntes add column curso_id uuid references public.cursos(id) on delete set null;
create index apuntes_curso_idx on public.apuntes (curso_id);

-- handle_new_user(): ahora inserta carrera_id (uuid, nullable) en vez de
-- carrera (text). raw_user_meta_data sigue sin usarse para autorización, solo
-- para prellenar campos de visualización, como ya documentado en la función
-- original.
create or replace function private.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, nombre, usuario, carrera_id, universidad)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'usuario', 'user_' || substr(new.id::text, 1, 8)),
    nullif(new.raw_user_meta_data ->> 'carrera_id', '')::uuid,
    'Pontificia Universidad Católica del Perú'
  );
  return new;
end;
$$;
