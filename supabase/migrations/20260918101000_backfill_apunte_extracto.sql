-- Backfill de apuntes.extracto para filas guardadas antes de que
-- apunte-editor.tsx empezara a calcularlo al guardar (ver
-- 20260918100000_apunte_extracto.sql). Función temporal que replica
-- extraerTextoPlano (src/lib/tiptap/extraer-texto-plano.ts) en PL/pgSQL:
-- camina el JSON de Tiptap recolectando cada nodo de texto, en el mismo
-- orden. Se usa una sola vez en esta migración y se elimina al final, no
-- queda como una segunda implementación permanente que mantener en
-- paralelo a la de TypeScript (el guardado en vivo sigue siendo la fuente
-- de verdad para cualquier apunte guardado o editado de ahora en más).
create or replace function private.extraer_texto_plano_temporal(nodo jsonb)
returns text
language plpgsql
as $$
declare
  resultado text := '';
  hijo jsonb;
begin
  if nodo is null or jsonb_typeof(nodo) <> 'object' then
    return '';
  end if;

  if jsonb_typeof(nodo->'text') = 'string' then
    resultado := resultado || (nodo->>'text');
  end if;

  if jsonb_typeof(nodo->'content') = 'array' then
    for hijo in select value from jsonb_array_elements(nodo->'content') loop
      resultado := resultado || ' ' || private.extraer_texto_plano_temporal(hijo);
    end loop;
  end if;

  return resultado;
end;
$$;

update public.apuntes a
set extracto = (
  case
    when length(t.texto) <= 300 then t.texto
    else rtrim(left(t.texto, 300)) || '…'
  end
)
from (
  select id, trim(regexp_replace(private.extraer_texto_plano_temporal(contenido), '\s+', ' ', 'g')) as texto
  from public.apuntes
  where extracto = ''
) t
where a.id = t.id;

drop function private.extraer_texto_plano_temporal(jsonb);
