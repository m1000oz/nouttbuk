# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Estudiantes universitarios de pregrado de la Pontificia Universidad Católica del Perú (PUCP), identificados por su correo institucional `@pucp.edu.pe`. Redactan apuntes de clase, los organizan por curso/carpeta, a veces coeditan en vivo con un grupo de estudio, y a veces publican a una comunidad académica pública para que otros estudiantes los descubran, guarden y comenten.

## Product Purpose

Nouttbuk es una app de apuntes que combina una biblioteca privada por materias con una comunidad académica. El mecanismo central: cada apunte tiene un nivel de visibilidad individual (privado / grupo / comunidad), decidido por su dueño, sin necesidad de duplicar contenido ni cambiar de herramienta.

## Positioning

Ningún competidor directo (Google Docs, Notion, apps de apuntes genéricas) combina, sobre el mismo documento y el mismo editor: biblioteca privada por materia, coedición en vivo acotada a un grupo, y publicación pública a un feed académico con SEO/descubrimiento sin necesidad de sesión. La visibilidad se decide apunte por apunte, no a nivel de cuenta o carpeta.

## Operating Context

Redacción durante o después de clase, en navegador de escritorio o como PWA instalada (Android/iOS). Los apuntes de visibilidad "grupo" se coeditan en vivo vía Liveblocks/Yjs. Los apuntes "comunidad" aparecen en un feed público, legible sin sesión (gancho de crecimiento/SEO, no debe regresionar nunca). El editor es la herramienta de uso más frecuente y prolongado de toda la app: es donde el usuario pasa la mayor parte del tiempo real de uso.

## Capabilities and Constraints

- Stack: Next.js 16 (App Router) + Supabase (Postgres/Auth/Storage/Realtime) + Tailwind CSS v4 + shadcn/ui (estilo "base-nova" sobre `@base-ui/react`, no Radix) + Tiptap v2 (fijado por debajo de v3: este proyecto usa una integración manual de Yjs en vez de `@liveblocks/react-tiptap`, que exige v3) + Liveblocks (coedición en vivo) + Motion (motion.dev, interacción cotidiana) + anime.js v4 (reservado a 2-3 momentos de marca) + Phosphor icons.
- Registro restringido a `@pucp.edu.pe` (MVP de una sola universidad, ampliar dominio es v2.0).
- No existe rol de administrador en todo el esquema, por diseño.
- RLS de Postgres aplica el modelo de visibilidad privado/grupo/comunidad; no hay checks de autorización a mano en el código de aplicación.
- El guardado del apunte (`editor.getJSON()`) debe seguir devolviendo un documento Tiptap plano de un solo nivel (`doc`), sin nodos de página ni envoltorios nuevos: decisión ya tomada y confirmada, no reabrir.

## Brand Commitments

Nombre: **Nouttbuk**. Identidad visual heredada de la Fase 2 (cerrada): Índigo `#4F46E5` (acciones principales), Teal `#14B8A6` (acento de colaboración/comunidad), Slate frío como neutro base, tipografía **DM Sans** en toda la app, iconografía **Phosphor**. Radios: cards 26px, controles (botones/inputs/selects) 14px.

El usuario pidió explícitamente, para la superficie del **editor de apuntes** en particular, libertad creativa total para romper con el look actual (que describe como "realmente feo", clon visual de Google Docs) y construir algo que se sienta como un programa carísimo, memorable, mejor que Docs. Esto autoriza una reinterpretación audaz del sistema visual dentro de esta superficie específica; los tokens de marca (Índigo/Teal/Slate/DM Sans/Phosphor) siguen siendo la base de identidad de toda la app y no se reemplazan, pero su aplicación en el editor puede ser mucho más expresiva que en el resto de la app.

## Evidence on Hand

`design.md` y `DESIGN-SYSTEM.md` documentan el sistema de diseño y los flujos ya cerrados de las Fases 1-2. No hay investigación de usuarios, testimonios ni benchmarks externos: las decisiones de diseño hasta ahora vienen de iteración directa con el dueño del producto.

## Product Principles

1. El editor de apuntes es la herramienta de uso más frecuente y prolongado de la app: debe sentirse como el componente más premium y cuidado de todo el producto, no como una utilidad genérica.
2. La visibilidad del apunte (privado/grupo/comunidad) tiene que seguir siendo instantáneamente legible sin importar cuánto cambie el lenguaje visual.
3. El feed de Comunidad sin sesión (gancho de SEO/crecimiento) nunca debe regresionar por un cambio visual en el editor.
4. La corrección de la coedición en tiempo real (Yjs/Liveblocks) siempre pesa más que una función puramente cosmética: ningún cambio visual puede alterar la forma del documento guardado.
5. Rediseñar es visual, no funcional: el modelo de datos, las visibilidades, el guardado y la coedición se preservan intactos; lo que cambia es cómo se ve y se siente usarlo.
