-- Une a quien abre un enlace público con permiso 'edit' (o 'read') como
-- colaborador real del apunte, en vez de dejarlo solo con la vista de solo
-- lectura de obtener_apunte_compartido. Solo tiene efecto para un visitante
-- con sesión (auth.uid() no nulo): un visitante anónimo nunca puede
-- convertirse en colaborador sin cuenta, coherente con el resto del modelo
-- de permisos de este proyecto.
--
-- `colaboradores_manage_owner` (RLS) restringe insert/update sobre
-- `colaboradores` al dueño del apunte, a propósito: nadie más puede
-- invitarse a sí mismo normalmente. Esta función bypassa esa policy
-- deliberadamente (security definer), pero de forma angosta y seguro: el
-- único camino de entrada es conocer `enlace_token`, un uuid no adivinable
-- que solo el dueño pudo generar y compartir desde EnlacePublicoSheet, el
-- mismo principio de seguridad que ya usa obtener_apunte_compartido para la
-- lectura pública.
--
-- Un colaborador (permiso 'read' o 'edit') solo tiene acceso real vía RLS
-- cuando `visibilidad = 'group'` (private.can_read_group_apunte), así que
-- unirse por un enlace también sube la visibilidad de 'private' a 'group'
-- si hiciera falta: sin este paso, la fila en `colaboradores` quedaría sin
-- efecto. Nunca toca una visibilidad que ya sea 'group' o 'community'.
--
-- Nunca degrada un permiso ya existente: si alguien ya es colaborador con
-- 'edit' (invitado antes por usuario o por un enlace de Editor anterior) y
-- abre un enlace de Lector más nuevo, conserva 'edit'.
-- El parámetro de salida de RETURNS TABLE se llama `apunte_id_resultado`, no
-- `id` ni `apunte_id`: PL/pgSQL crea automáticamente una variable con ese
-- nombre en todo el cuerpo de la función, y un nombre tan genérico como `id`
-- o `apunte_id` termina colisionando con la columna del mismo nombre en
-- `apuntes`/`colaboradores` en cualquier SQL de más abajo (dos colisiones
-- reales encontradas al correr el pgTAP de esta función, una en el
-- `on conflict (apunte_id, ...)`, otra en el `where id = ...` del update),
-- volviendo ambigua la referencia. Un nombre de salida distintivo evita esta
-- clase de bug de raíz en vez de ir alias por alias.
create or replace function public.unirse_por_enlace(p_token uuid)
returns table (apunte_id_resultado uuid)
language plpgsql security definer set search_path = ''
as $$
declare
  v_apunte_id uuid;
  v_permiso public.permiso_colaborador;
  v_autor_id uuid;
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    return;
  end if;

  select a.id, a.enlace_permiso, a.autor_id
    into v_apunte_id, v_permiso, v_autor_id
    from public.apuntes a
    where a.enlace_token = p_token;

  if v_apunte_id is null then
    return;
  end if;

  if v_autor_id <> v_uid then
    insert into public.colaboradores as c (apunte_id, perfil_id, permiso)
      values (v_apunte_id, v_uid, v_permiso)
      on conflict (apunte_id, perfil_id) do update
        set permiso = case
          when c.permiso = 'edit' then 'edit'::public.permiso_colaborador
          else excluded.permiso
        end;

    update public.apuntes
      set visibilidad = 'group'
      where id = v_apunte_id and visibilidad = 'private';
  end if;

  return query select v_apunte_id;
end;
$$;

revoke execute on function public.unirse_por_enlace(uuid) from public;
grant execute on function public.unirse_por_enlace(uuid) to authenticated;
