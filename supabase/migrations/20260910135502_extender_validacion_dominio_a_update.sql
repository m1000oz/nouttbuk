-- La restricción de correo institucional @pucp.edu.pe
-- (20260817204401_auth_domain_restriction.sql) solo se disparaba en el
-- INSERT de auth.users. Un usuario ya registrado podía llamar
-- supabase.auth.updateUser({ email: "cualquiera@gmail.com" }) desde el
-- cliente y, tras confirmar el correo nuevo, terminar con una cuenta cuyo
-- correo ya no es institucional. Reutiliza la misma función existente
-- (private.validar_dominio_institucional, ya mira solo new.email y ya lanza
-- 'check_violation' 23514), agregándole un segundo trigger sobre UPDATE.
--
-- `before update of email` (no `before update` a secas) dispara solo cuando
-- el correo realmente cambia, así que no interfiere con los demás UPDATE
-- que Supabase Auth hace constantemente sobre auth.users (refresh de token,
-- last_sign_in_at, etc.).
create trigger validar_dominio_institucional_update_trigger
  before update of email on auth.users
  for each row execute function private.validar_dominio_institucional();
