-- Límite de frecuencia para cambiar de carrera (máximo un cambio cada 30
-- días). Mismo patrón exacto que limitar_cambio_usuario (usuario_actualizado_en
-- / 7 días, migración 20260821090000_perfil_avatar_y_usuario.sql): la carrera
-- es un dato de perfil, no un identificador único referenciado por otros
-- usuarios como usuario, así que el candado es más laxo (30 en vez de 7
-- días), pero la mecánica (columna *_actualizado_en que arranca en null, el
-- primer cambio vía UPDATE siempre permitido, errcode explícito
-- 'check_violation' en vez del P0001 por defecto de plpgsql) es la misma.

alter table public.profiles
  add column carrera_actualizada_en timestamptz;

create or replace function private.limitar_cambio_carrera()
returns trigger language plpgsql as $$
begin
  if new.carrera_id is distinct from old.carrera_id then
    if old.carrera_actualizada_en is not null
      and now() - old.carrera_actualizada_en < interval '30 days'
    then
      raise exception 'Solo puedes cambiar tu carrera una vez cada 30 días'
        using errcode = 'check_violation';
    end if;
    new.carrera_actualizada_en = now();
  end if;
  return new;
end;
$$;

create trigger limitar_cambio_carrera_trigger
  before update on public.profiles
  for each row execute function private.limitar_cambio_carrera();
