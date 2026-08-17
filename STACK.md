# Nouttbuk, stack técnico (v1)

Este documento justifica la elección de stack para la versión web + PWA de Nouttbuk, definida junto con `NOUTTBUK-IDEA.md`. Sin código todavía, es la base para la Fase 3 (implementación).

## Resumen

| Capa | Elección |
|---|---|
| Frontend/framework | Next.js (App Router, TypeScript) |
| Backend/datos | Supabase (Postgres + Auth + Storage + Realtime) |
| Estilos/UI | Tailwind CSS + shadcn/ui (Radix primitives) |
| Editor de apuntes | Tiptap (ProseMirror) |
| Coedición en tiempo real | Liveblocks (sync CRDT/Yjs manejado + presencia/cursores) |
| Motion, sutil (cotidiano) | Motion (motion.dev, ex-Framer Motion) |
| Motion, rico (momentos firma) | anime.js v4 |
| PWA | manifest.json + service worker (next-pwa o configuración manual) |
| Hosting | Vercel (app) + Supabase Cloud (backend) |

## Por qué cada pieza

**Next.js (App Router, TS)**, SSR para el feed público de comunidad, clave para el gancho de SEO/growth sin login que pide el modelo de producto. Un solo codebase sirve la web y la PWA.

**Supabase (Postgres + Auth + Storage + Realtime)**, el modelo de visibilidad por apunte (`private`/`group`/`community`) mapea directo a **Row Level Security** de Postgres: es el caso de uso ideal para RLS, y evita reimplementar reglas de autorización a mano en cada endpoint. Auth con email/password lista de fábrica, Storage para avatares, Realtime útil para reacciones/comentarios/board de feedback sin infra propia. Managed = velocidad para desarrollo en solitario.

**Tailwind CSS + shadcn/ui**, encaja con los tokens de marca ya definidos (índigo `#4F46E5`, base `#F8FAFC`, acento turquesa `#14B8A6`, radios 20-28px) y acelera la Fase 2 de diseño al tener primitivos accesibles listos.

**Tiptap**, editor de texto enriquecido sobre ProseMirror, con extensión oficial de colaboración. Elegirlo desde el MVP evita cambiar de librería cuando se integra coedición.

**Liveblocks**, capa de sync CRDT (Yjs) + presencia/cursores manejada. Se usa acotado a apuntes `group` con colaborador en permiso `edit` (grupo de estudio editando junto), no en `community`. Es la pieza de mayor complejidad del MVP; se eligió managed en vez de self-hosted (Yjs + Hocuspocus) porque Hocuspocus necesita un proceso persistente con WebSocket que no corre en funciones serverless de Vercel, y agregaría una pieza de infra extra. El tier gratuito de Liveblocks alcanza para una comunidad cerrada de una sola universidad.

**PWA (manifest + service worker)**, instalación en Android/iOS sin recortar funcionalidad respecto a la web pura; caché básico de shell para carga rápida. Android con soporte completo (push real); iOS con push limitado (16.4+, solo tras instalación manual).

**Vercel + Supabase Cloud**, despliegue directo desde Next.js, sin ops propia; ambos con tiers gratuitos/económicos adecuados para una comunidad cerrada inicial.

**Motion: Motion + anime.js (híbrido)**, decidido en Fase 2 tras comparar sutil vs rico sobre los mismos componentes. **Motion** (motion.dev) cubre toda la UI cotidiana: hover/press de botones, cards, tabs, toasts, apertura de sheets, necesita sentirse instantáneo, no "actuado". **anime.js v4** se reserva para 2-3 momentos firma: el hero de Comunidad al entrar, el selector de visibilidad del editor, y candidato fuerte: la primera entrada del feed público (no en cada scroll). Se eligió anime.js en vez de GSAP para el nivel rico porque el usuario ya lo tiene instalado y la v4 (modular, con Timeline API y rendimiento a la par de GSAP) cubre el mismo caso de uso sin sumar una dependencia nueva, la licencia no fue el criterio, GSAP es 100% gratis desde abril 2025.

## Alcance del MVP (v1)

**Se construye desde el día uno** (diferenciadores centrales, no se recortan):
- Modelo de visibilidad por apunte (`private` / `group` / `community`) vía RLS.
- Feed público de comunidad de lectura sin login.
- Reacciones y guardados como registros por usuario (no contadores globales).
- Flujo de compartir con permiso `read`/`edit` por colaborador.
- Comentarios en publicaciones de comunidad.
- Coedición en tiempo real (Tiptap + Liveblocks), acotada a apuntes `group` con permiso `edit`.
- Board de feedback dentro de la app, separado del feed académico.
- Acceso restringido por dominio de correo institucional: solo se admiten cuentas con correo terminado en `@pucp.edu.pe` (Pontificia Universidad Católica del Perú). Reemplaza la idea original de invite-only por código.

**Se recorta / difiere a v2.0**:
- Filtros y descubrimiento multi-universidad/multi-carrera (el campo `universidad` queda en el modelo, sin UI de filtrado).
- Adjuntos ricos en apuntes (imágenes, PDFs, escaneos), v1 arranca con texto enriquecido básico (negrita, listas, títulos).
- Notificaciones push reales, v1 se limita a estado in-app.

## Roadmap v2.0 (a documentar, no a construir ahora)

- Apertura multi-universidad: admitir más dominios de correo institucional además de `@pucp.edu.pe`, y descubrimiento cross-institución.
- Mejora de PWA con push real, o evaluación de apps nativas.
- Adjuntos multimedia y OCR de apuntes escaneados.
- Extender coedición en tiempo real a más casos (presencia/cursores en comentarios, permiso `edit` en `community`).
- Gamificación (rachas, insignias por aportes).
- Exploración de monetización (premium, sin ads en un producto académico).
- Ring chart de "progreso de revisión" por carpeta (idea original de `design.md`) con **Bklit UI**, librería de charts compuesta sobre shadcn/ui, no instalada todavía. Encaja sin fricción porque ya usamos shadcn/ui como base de componentes.

## Nota de esfuerzo

Sumar coedición en tiempo real al MVP es la pieza que más complejidad agrega de todo el alcance definido, tenerlo presente al planificar tiempos en la Fase 3, aunque Liveblocks + Tiptap acota bastante ese esfuerzo comparado con construirlo desde cero.

## Próximo paso

Con la idea y el stack cerrados, pasar a la **Fase 2: diseño de UI/UX** (pantallas, sistema de diseño para web, componentes) antes de escribir código en la Fase 3.
