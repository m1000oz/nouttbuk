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
- [x] Inicio de sesión con Google restringido al dominio institucional (código listo, pendiente de credenciales reales de Google Cloud para activarse).

## Confianza y preparación de despliegue

- [x] Moderación mínima: reportar publicaciones y comentarios (sin panel de admin, revisión manual en Supabase Studio).
- [x] CAPTCHA (Cloudflare Turnstile) en registro, login y recuperar contraseña (código listo, pendiente de credenciales reales de Cloudflare para activarse).
- [x] Páginas de Política de privacidad y Términos de uso.
- [x] Enlace "Saltar al contenido" para navegación por teclado.
- [x] Cobertura de tests para la lógica de cruce de horarios del calendario.
- [ ] Vincular y actualizar el proyecto Supabase en la nube (bloqueado: el proyecto está pausado/inactivo, hay que reactivarlo desde el dashboard antes de poder hacer `supabase db push`).
- [ ] Desplegar a Vercel (pendiente de decisión del usuario, ver checklist en CLAUDE.md).

## Diferido a v2.0 (no construir en el MVP)

- Admitir dominios de correo institucional de otras universidades además de `@pucp.edu.pe`.
- Filtros y descubrimiento multi-universidad/multi-carrera.
- Adjuntos ricos en apuntes (imágenes, PDFs, escaneos).
- Notificaciones push reales.
- Gamificación y exploración de monetización.
