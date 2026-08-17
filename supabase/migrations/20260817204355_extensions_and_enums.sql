-- Extensiones y tipos base para el modelo de datos de Nouttbuk.

create extension if not exists pgcrypto;

-- Esquema no expuesto vía API/PostgREST, para funciones y triggers internos
-- (helpers de RLS, sincronización de publicaciones, validaciones).
create schema if not exists private;

create type public.apunte_visibilidad as enum ('private', 'group', 'community');
create type public.permiso_colaborador as enum ('read', 'edit');
