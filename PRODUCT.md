# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Estudiantes universitarios de pregrado de la Pontificia Universidad Católica del Perú (PUCP), identificados por su correo institucional `@pucp.edu.pe`. Redactan apuntes de clase, los organizan por curso/carpeta, a veces coeditan en vivo con un grupo de estudio, y a veces publican a una comunidad académica pública para que otros estudiantes los descubran, guarden y comenten.

## Product Purpose

Nouttbuk es una app de apuntes que combina una biblioteca privada por materias con una comunidad académica y una landing page de adquisición universitaria. El mecanismo central: cada apunte tiene un nivel de visibilidad individual (privado / grupo / comunidad), decidido por su dueño, sin necesidad de duplicar contenido ni cambiar de herramienta.

## Positioning

Ningún competidor directo (Google Docs, Notion, apps de apuntes genéricas) combina, sobre el mismo documento y el mismo editor: biblioteca privada por materia con estética física de cuaderno anillado, coedición en vivo acotada a un grupo, y publicación pública a un feed académico con SEO/descubrimiento sin necesidad de sesión. La visibilidad se decide apunte por apunte, no a nivel de cuenta o carpeta.

## Operating Context

- **Landing Page (`/`)**: Puerta de entrada pública de adquisición, con escala panorámica widescreen, identidad de marca sobria y mockup interactivo que refleja el ecosistema Nouttbuk (App Shell lateral + Atelier de redacción).
- **Feed Académico (`/comunidad`)**: Catálogo público de apuntes universitarios, legible sin iniciar sesión (gancho clave de crecimiento y SEO).
- **El Atelier (`/apuntes/[id]/editar`)**: Entorno de redacción y estudio en escritorio o PWA instalada. Es la herramienta de mayor permanencia de toda la plataforma. Los apuntes de visibilidad "grupo" se coeditan en tiempo real vía Liveblocks/Yjs.

## Capabilities and Constraints

- **Stack**: Next.js 16 (App Router) + Supabase (Postgres/Auth/Storage/Realtime) + Tailwind CSS v4 + shadcn/ui (estilo "base-nova" sobre `@base-ui/react`, no Radix) + Tiptap v2 (fijado por debajo de v3: integración manual de Yjs) + Liveblocks (coedición en vivo) + Motion (motion.dev) + anime.js v4 + Phosphor icons.
- **Registro institucional**: Restringido a `@pucp.edu.pe` (MVP de una sola universidad).
- **Seguridad**: RLS de Postgres aplica el modelo de visibilidad privado/grupo/comunidad; sin checks manuales en la capa de aplicación.
- **Estructura del documento**: El guardado (`editor.getJSON()`) devuelve un documento Tiptap plano de un solo nivel (`doc`), sin envoltorios que rompan la sincronización de Yjs.
- **Roadmap confirmado para el Editor (Fase siguiente / Dejado para aplicar luego)**:
  1. **Hipertextos y Enlaces Bidireccionales (`[[...]]`)**: Sintaxis wiki para interconectar conceptos entre apuntes de la misma carpeta o curso, permitiendo previsualizaciones rápidas de notas relacionadas.
  2. **Modo Proyector / Haz de Estudio**: Modo de presentación con iluminación ambiental cálida y tipografía de alto contraste, pensado para exponer apuntes en proyectores de aula o sesiones de repaso grupal.
  3. **Pomodoro y Sonidos de Enfoque**: Integración nativa del reproductor ambiental de concentración (lluvia, cafetería, lo-fi) en la barra de herramientas del Atelier.

## Brand Commitments

- **Nombre e Identidad**: **Nouttbuk** (*«Tus apuntes, tu comunidad»*). Isotipo de cuaderno anillado a 45° con troqueles `tt`.
- **Paleta**: Índigo Nouttbuk `#4F46E5` (acciones principales), Turquesa Comunidad `#14B8A6` (colaboración y acento del dígrafo `tt`), Pizarra profunda / Slate frío como base neutra.
- **Colores de carpeta por materia**: Coral `#F2704F`, Ámbar `#F5A623`, Lima `#84CC16`, Cian `#06B6D4`, Azul `#3B82F6`, Violeta `#8B5CF6`, Fucsia `#D946EF`, Rosa `#EC4899`.
- **Tipografía**: **DM Sans** para toda la interfaz de la app y controles; **Newsreader** (serif editorial) reservada exclusivamente para el cuerpo y títulos de la hoja de lectura en el Atelier.
- **Cuaderno Anillado Físico**: Lomo anillado característico con perforaciones y anillas metálicas en las tarjetas de apunte y en la hoja de redacción.
- **Restricciones de estilo**: Cero puntos medios (`·`) como separadores, cero flechas en botones de acción, cero jerga de código para el usuario (no mencionar PWA, KaTeX, Yjs, etc.).

## Evidence on Hand

`design.md`, `DESIGN-SYSTEM.md` y `BRAND-GUIDELINES.md` documentan el sistema de diseño cerrado. Las decisiones responden a iteraciones directas con el dueño del producto y pruebas interactivas en vivo.

## Product Principles

1. **El editor de apuntes es la superficie reina**: Es la herramienta de mayor permanencia de la app; debe sentirse como un instrumento de alta precisión y artesanía superior, nunca como un procesador genérico.
2. **Visibilidad transparente e inequívoca**: El estado de un apunte (privado, grupo o comunidad) debe ser evidente de inmediato para el estudiante en cualquier vista.
3. **Comunidad abierta como motor de descubrimiento**: La lectura pública del feed sin login es un pilar innegociable de adquisición y confianza.
4. **La integridad de la coedición prima sobre adornos superficiales**: Ningún cambio visual o cosmético puede comprometer el árbol de sincronización de Yjs/Liveblocks.
5. **Separación clara entre adquisición y aplicación**: `/` presenta la visión y el producto para captar estudiantes y equipos; el interior de la app es el espacio de trabajo enfocado sin distracciones.
