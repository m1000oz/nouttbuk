# Project TODO, Nouttbuk (MVP v1: web + PWA)

- [x] Configurar la identidad visual y la navegación principal de Nouttbuk (nav lateral en desktop, layout responsive).
- [x] Implementar el inicio con accesos rápidos, actividad y apuntes recientes.
- [x] Implementar la biblioteca de apuntes con búsqueda y creación de carpetas.
- [x] Implementar el editor de apuntes (Tiptap) y detalle de carpetas académicas.
- [x] Implementar el feed social (lectura pública sin login), detalle de publicación, reacciones y comentarios.
- [x] Implementar perfil de estudiante y resumen de contribuciones.
- [x] Implementar el flujo de compartir y colaboración con permisos de lectura o edición.
- [x] Implementar coedición en tiempo real (Tiptap + Liveblocks) para apuntes `group` con permiso `edit`.
- [x] Implementar el board de feedback dentro de la app (separado del feed académico).
- [x] Restringir el registro a correos que terminan en `@pucp.edu.pe` (validación en el signup y a nivel de base de datos).
- [x] Modelar y aplicar Row Level Security en Supabase para las reglas de visibilidad `private`/`group`/`community`.
- [x] Configurar manifest + service worker para instalación como PWA (Android/iOS).
- [x] Generar el icono de Nouttbuk y aplicar el branding (favicon, manifest, meta tags).
- [x] Añadir pruebas, comprobar tipos y validar los flujos clave.

## Post-MVP (agregado tras el cierre de Fase 3)

- [x] Sección CV: guía de prompts para armar el CV con IA (ChatGPT/Gemini/Claude) y plantilla descargable en PDF.
- [x] Sección Calendario: horarios semanales personalizables, compartir con otros estudiantes y cruce automático de horarios libres.
- [x] Candado de 30 días para cambiar de carrera en el perfil, con confirmación antes de guardar.
- [x] Inicio de sesión con Google restringido al dominio institucional (credenciales reales configuradas y activadas el 2026-09-05, verificado en el navegador: redirige correctamente hasta el login SSO institucional de PUCP).
- [x] Editor de apuntes: menú superior (Archivo/Edición/Ver/Insertar/Formato/Herramientas) + barra de herramientas persistente, misma paleta atelier (fuente, tamaño, subíndice/superíndice, interlineado, listas de tareas, buscar y reemplazar, configurar página con encabezado/pie, contar palabras detallado). BubbleMenu eliminado. Ver `DESIGN-SYSTEM.md` ("Tercera iteración") y `HISTORIAL.md` (Pass 7, 2026-09-06).
- [x] Editor de apuntes: título movido al header (Pass 8) y modo claro seleccionable (Ver > Tema, Pass 9), hoja y lienzo blancos "igual que Docs". Ver `HISTORIAL.md`.
- [x] Editor de apuntes: corregidos tres bugs reales de paginación multi-hoja (hojas delgadas e inescribibles, hojas fantasma, imposibilidad de hacer scroll dentro de una hoja larga), Pass 10. Ver `HISTORIAL.md` y el gotcha de `requestAnimationFrame` vs `setTimeout` en `CLAUDE.md`.
- [x] Editor de apuntes: corregidos cuatro bugs más de paginación, solo visibles con contenido real de 2+ saltos de página (hoja nueva delgadísima, el espaciador de salto de página quedaba dentro del párrafo empujado en vez de ser su hermano, saltos viejos se recontaban como contenido en recálculos posteriores, la fórmula del hueco contaminaba su propio acumulado), Pass 11. Ver `HISTORIAL.md`.
- [x] Editor de apuntes: corregido en código "pegar varios textos iguales rompe todo" (líneas pegadas con salto simple formaban un párrafo gigante con `<br>` internos que Paginacion no puede partir, desperdiciando hasta una hoja completa por cada uno); normalizado vía `editorProps.transformPasted` en ambos editores, más un cinturón de seguridad contra recálculos encadenados sin límite en `Paginacion`. Pass 12. Ver `HISTORIAL.md`.
- [ ] **PENDIENTE (2026-09-07): el usuario reporta que el error de Pass 12 "persiste"** tras el fix — no se confirmó todavía si se refiere a (a) la nota real "ROMPIENDO TODO" ya guardada, que por diseño el fix NO corrige retroactivamente (solo aplica a pegados nuevos, explicado al usuario al cerrar Pass 12), o (b) un pegado nuevo que sigue mostrando el mismo desperdicio de espacio pese al fix, lo que significaría que `transformPasted` en `pegar-lineas-como-parrafos.ts` no cubre algún camino real de pegado (HTML con estructura distinta a `<br>` simple, pegado por Ctrl+Shift+V, arrastrar-y-soltar, u otro). Próxima sesión: preguntar al usuario cuál de los dos es, y si es (b), reproducir con el navegador real (no solo `ClipboardEvent` simulado) contra una nota nueva antes de tocar código otra vez.

## Confianza y preparación de despliegue

- [x] Moderación mínima: reportar publicaciones y comentarios (sin panel de admin, revisión manual en Supabase Studio).
- [x] CAPTCHA (Cloudflare Turnstile) en registro, login y recuperar contraseña (credenciales reales configuradas y activadas el 2026-09-05, verificado en el navegador: el widget carga y responde "¡Operación exitosa!" con el sello real de Cloudflare).
- [x] Páginas de Política de privacidad y Términos de uso.
- [x] Enlace "Saltar al contenido" para navegación por teclado.
- [x] Cobertura de tests para la lógica de cruce de horarios del calendario.
- [x] Vincular y actualizar el proyecto Supabase en la nube (reactivado desde el dashboard el 2026-09-05, las 10 migraciones pendientes se aplicaron con `supabase db push --linked`, el proyecto en la nube está al día).
- [ ] Desplegar a Vercel (pendiente de decisión del usuario, ver checklist en CLAUDE.md).

## Diferido a v2.0 (no construir en el MVP)

- Admitir dominios de correo institucional de otras universidades además de `@pucp.edu.pe`.
- Filtros y descubrimiento multi-universidad/multi-carrera.
- Adjuntos ricos en apuntes (imágenes, PDFs, escaneos).
- Notificaciones push reales.
- Gamificación y exploración de monetización.
- Editor: comentarios, modo de sugerencias, historial de revisiones, dictado por voz, saltos de página manuales, exportación a PDF con motor propio (`jspdf`, instalado pero sin usar; `window.print()` cubre el caso real hoy).
