# Nouttbuk, idea del producto

## Qué es

App de apuntes para estudiantes universitarios que combina una biblioteca privada por materias con una comunidad académica. Un apunte puede quedarse privado, compartirse con un grupo de estudio (colaboradores con permiso de lectura o edición), o publicarse para toda la comunidad (reacciones, guardados, comentarios).

## Problema que resuelve

Los estudiantes toman apuntes dispersos entre apps de notas genéricas y no tienen un lugar pensado específicamente para organizar por materia y decidir, apunte por apunte, quién lo puede ver. Tampoco hay un espacio de descubrimiento de apuntes de otros estudiantes de su carrera/universidad.

## Modelo de datos

- **Perfil**: nombre, usuario (@handle), carrera, universidad, avatar.
- **Carpeta** (materia): nombre, color, icono, descripción, dueño.
- **Apunte**: título, contenido, etiquetas, carpeta, autor, favorito, visibilidad (`private` / `group` / `community`).
- **Publicación**: un apunte con visibilidad `community` genera una publicación en el feed (1:1 con el apunte).
- **Reacción** / **Guardado**: registro por usuario y publicación (no contadores globales, se cuenta en consulta).
- **Comentario**: texto de un usuario sobre una publicación.
- **Colaborador**: usuario invitado a un apunte `group` o `community`, con permiso `read` o `edit`.

## Reglas de visibilidad

- `private`: solo el dueño.
- `group`: dueño + colaboradores invitados (según su permiso).
- `community`: dueño + colaboradores para edición; el feed de comunidad es de **lectura pública** (sin sesión), pensado para que un visitante vea contenido real antes de registrarse. Reaccionar, guardar y comentar sí requieren cuenta.

## Pantallas

| Pantalla | Contenido | Acción principal |
|---|---|---|
| Inicio | Saludo, accesos rápidos, materias recientes, últimos apuntes | Crear apunte, entrar a una materia |
| Mis apuntes | Buscador, filtros (todos/favoritos/compartidos), grid de tarjetas | Crear/editar apunte, crear carpeta |
| Detalle de carpeta | Encabezado de materia con conteo, lista de apuntes | Ver/crear apuntes de esa materia |
| Editor de apunte | Título, contenido, etiquetas, materia | Guardar; visibilidad se define al crear |
| Comunidad | Feed de publicaciones públicas | Reaccionar, guardar, abrir publicación |
| Detalle de publicación | Apunte completo, autor, conversación | Comentar, reaccionar, guardar, compartir |
| Compartir | Elegir visibilidad (privado/grupo/comunidad), invitar colaborador por usuario o correo con permiso read/edit | Cambiar audiencia, invitar |
| Perfil | Avatar, carrera, universidad, stats (apuntes/aportes/contactos), apuntes compartidos | Editar perfil, cerrar sesión |
| Login / Registro | Email + contraseña | Entrar / crear cuenta |

## Identidad visual

- Índigo profundo `#4F46E5` como color de marca (acciones principales, tabs activos).
- Base blanca cálida `#F8FAFC` para lectura prolongada.
- Turquesa `#14B8A6` como acento de colaboración/comunidad (uso secundario).
- Colores de carpeta por materia (coral, ámbar, violeta, azul) para reconocimiento rápido.
- Tarjetas con radio 20-28px, bordes sutiles, sombras muy suaves, tipografía con peso alto solo en títulos/contadores.
- Diseño mobile-first (creado originalmente como app React Native/Expo); para la versión solo-web conviene repensar el layout en pantallas anchas (nav lateral en vez de tab bar inferior, contenedor con ancho máximo), el resto del sistema visual se traslada directo.

## Navegación

Cuatro destinos estables: Inicio, Mis apuntes, Comunidad, Perfil. Crear apunte siempre accesible. Detalles (carpeta, apunte, publicación, compartir) como pantallas de pila, no tabs.

## Notas para la versión standalone web (nuevo stack)

- El diferenciador real del producto es el **modelo de visibilidad por apunte** (privado/grupo/comunidad) + el **feed público sin login** como gancho de adquisición, no descuidar ninguno de los dos al portar.
- Reacciones/guardados deben ser registros por usuario (no booleans globales) desde el día uno si se espera más de un usuario real.
- El feed público (lectura) y las acciones de escritura (reaccionar/guardar/comentar/crear) tienen requisitos de auth distintos, diseñar la API separando queries públicas de mutaciones protegidas desde el principio, ayuda mucho al SEO/growth de la versión web.

## Plataforma (v1)

Web responsive + **PWA instalable**. La PWA es solo una capa de manifest + service worker sobre la misma app web: no recorta ninguna funcionalidad respecto a la versión web pura.

- Android: soporte completo (instalación fluida, push real).
- iOS: "agregar a inicio" funciona, pero push requiere iOS 16.4+ y que el usuario ya haya instalado la PWA manualmente; almacenamiento local menos persistente.
- No se construyen apps nativas en esta etapa (ver `design.md` para el concepto original React Native/Expo, que queda de referencia visual, no como target de build).

## Stack elegido

Ver justificación técnica completa en `STACK.md`. Resumen: **Next.js (App Router, TS) + Supabase (Postgres/Auth/Storage/Realtime) + Tailwind + shadcn/ui + Tiptap (editor) + Liveblocks (coedición) + Motion + anime.js (motion) + Vercel**.

## Crecimiento: una universidad primero

V1 se lanza cerrado a una sola universidad: la **Pontificia Universidad Católica del Perú (PUCP)**. El acceso se restringe por dominio de correo institucional (`@pucp.edu.pe`); el registro se rechaza si el correo no termina en ese dominio. El modelo de datos ya tiene el campo `universidad` en el perfil, pero no se construye filtrado ni descubrimiento multi-institución todavía, eso es v2.0.

## Alcance del MVP vs. v2.0

**MVP (v1)**, todo lo ya descripto en este documento, más:
- **Coedición en tiempo real** (Tiptap + Liveblocks) para apuntes `group` con colaborador en permiso `edit`, el caso de un grupo de estudio editando el mismo apunte a la vez. No aplica a apuntes `community`.
- **Board de feedback dentro de la app**: pantalla separada del feed académico donde la comunidad cerrada de beta-testers deja ideas y reporta bugs, visible para el dueño del producto.

Recortado a v2.0: admitir dominios de correo institucional de otras universidades además de `@pucp.edu.pe`, filtros/descubrimiento multi-universidad, adjuntos ricos (imágenes/PDF/escaneos) en apuntes, notificaciones push reales, gamificación, monetización, ring chart de progreso de revisión por carpeta (con Bklit UI). Detalle completo del roadmap en `STACK.md`.
