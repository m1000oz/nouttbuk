-- Compartir un apunte por enlace público, sin login, tipo "obtener enlace"
-- de Google Docs: ortogonal a `visibilidad` (private/group/community), no
-- una cuarta opción de ese enum. `enlace_token` no nulo habilita la lectura
-- pública del apunte sin importar su `visibilidad` actual, vía la función
-- `obtener_apunte_compartido` (ver la siguiente migración). `null` = no
-- compartido por enlace. `unique` ya cubre el índice que necesita el
-- lookup por token, no hace falta uno aparte.
alter table public.apuntes
  add column enlace_token uuid unique default null;
