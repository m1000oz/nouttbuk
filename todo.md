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

## Diferido a v2.0 (no construir en el MVP)

- Admitir dominios de correo institucional de otras universidades además de `@pucp.edu.pe`.
- Filtros y descubrimiento multi-universidad/multi-carrera.
- Adjuntos ricos en apuntes (imágenes, PDFs, escaneos).
- Notificaciones push reales.
- Gamificación y exploración de monetización.
