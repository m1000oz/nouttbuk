# Diseño de interfaz, Nouttbuk

Versión web + PWA, cerrada al final de la Fase 2. Reemplaza el diseño mobile-first original (React Native/Expo); el modelo de producto y de datos no cambió, sí el sistema visual, la navegación y el soporte de temas. El detalle de tokens y componentes vive en `DESIGN-SYSTEM.md`; este documento describe pantallas y flujos.

## Propósito de la experiencia

Nouttbuk permite que estudiantes universitarios redacten, organicen y compartan apuntes sin salir de una experiencia enfocada en estudio. La interfaz combina una biblioteca privada por materias con una comunidad académica: los apuntes pueden mantenerse personales, compartirse con un grupo de estudio o publicarse para que otros estudiantes los guarden y comenten.

La aplicación es responsiva de verdad, no una adaptación de la app móvil: nav lateral en pantallas anchas (desktop), tab bar inferior + botón flotante en pantallas angostas (mobile/PWA). Se instala como PWA sin recortar funcionalidad respecto a la versión web. La interacción central sigue siendo crear un apunte, asignarlo a una carpeta y decidir su nivel de visibilidad, ahora con coedición en vivo cuando el apunte es de grupo.

## Pantallas

| Pantalla | Contenido principal | Funcionalidad |
|---|---|---|
| **Inicio** | Saludo, accesos rápidos (Nuevo apunte / Ver comunidad), materias recientes, últimos apuntes. | Abrir apuntes recientes, filtrar por carpeta, empezar una nota. |
| **Mis apuntes** | Buscador, tabs (Todos/Favoritos/Compartidos), grid de apuntes. Cada tarjeta tiene un botón de opciones (mover a carpeta, compartir, eliminar con verificación). Incluye la vista de **Detalle de carpeta** como filtro por materia, con botón de volver. | Crear, abrir, buscar y clasificar apuntes. |
| **Crear/editar carpeta** | Sheet con nombre de la materia y selector de color (8 tonos, forma de carpeta real). | Crear una carpeta nueva o renombrar/recolorear una existente. |
| **Editor de apunte** | Título, contenido de texto (Tiptap) con barra de formato (encabezados, negrita/cursiva/subrayado/tachado, resaltado, color de texto, listas, cita, enlace) y contador de palabras/caracteres, etiquetas, selector de carpeta, selector de visibilidad. Si la visibilidad es "Grupo": indicador de coedición en vivo y botón para invitar colaborador. | Crear o editar un apunte; guardar como privado, grupo o comunidad. |
| **Comunidad** | Hero de bienvenida animado, feed de apuntes publicados. | Descubrir contenido, abrir una publicación. |
| **Detalle de publicación** | Apunte completo, autor, reacciones/guardados/comentarios, conversación. | Reaccionar, guardar, comentar, compartir. |
| **Compartir** | Hoja inferior con opciones de visibilidad (privado/grupo/comunidad) e invitación de colaboradores con permiso de lectura o edición. | Definir audiencia e invitar estudiantes. |
| **Perfil** | Avatar, carrera, universidad, stats (apuntes/aportes/contactos), apuntes públicos. | Editar perfil, enviar feedback, cerrar sesión. |
| **Editar perfil** | Overlay con foto de perfil (subida directa, sin recorte), nombre, usuario y carrera (texto libre, sin catálogo de carreras); universidad fija, no editable. El usuario solo se puede cambiar una vez cada 7 días, con chequeo de disponibilidad en vivo mientras se escribe. | Actualizar los datos del perfil. |
| **Login / Registro** | Modal con toggle entre iniciar sesión y crear cuenta. El registro pide nombre, usuario, carrera, universidad (fija en PUCP) y correo institucional; solo se admiten correos `@pucp.edu.pe`. | Entrar o crear cuenta sin abandonar el flujo actual. |
| **Recuperar contraseña** | Alcanzable desde el login. Pide correo institucional y muestra confirmación de envío. | Restablecer el acceso sin exponer si la cuenta existe. |
| **Board de feedback** | Composer + lista de ideas de la comunidad cerrada, con voto y estado (Nueva/En revisión/Hecho). | Proponer ideas, ver qué se está evaluando o ya se hizo. |

## Flujos principales

| Objetivo | Flujo propuesto |
|---|---|
| **Tomar un apunte** | Inicio o Mis apuntes → "Nuevo apunte" → editar título y contenido → elegir carpeta → elegir visibilidad → guardar. |
| **Clasificar apuntes** | Mis apuntes → filtrar por materia (Detalle de carpeta) o por tab (favoritos/compartidos). |
| **Crear una carpeta** | Mis apuntes → "Nueva carpeta" → nombrar materia y elegir color → crear. |
| **Compartir con estudiantes** | Editor → visibilidad "Grupo" o "Comunidad" → si es Grupo, "Invitar colaborador" → nombre de usuario + permiso de lectura o edición. |
| **Coeditar un apunte de grupo** | Abrir un apunte con colaboradores → el editor muestra quién más está editando en vivo, sin pasos extra. |
| **Descubrir material útil** | Comunidad → abrir una publicación → reaccionar, guardar o comentar. |
| **Proponer una idea** | Perfil → "Enviar feedback" → board de feedback → escribir y enviar. |

## Navegación

Cuatro destinos estables: **Inicio**, **Mis apuntes**, **Comunidad** y **Perfil**. En desktop, nav lateral con los cuatro destinos y el CTA "Nuevo apunte" siempre visible. En mobile/PWA, tab bar inferior con los mismos cuatro destinos y un botón flotante (+) centrado, superpuesto a la barra a la mitad (no flotando entero por arriba) para sentirse parte de la barra. Las pantallas de detalle (Editor, Detalle de publicación) se presentan como overlays de pantalla completa con salida explícita (botón de cerrar o volver, nunca solo "tocar afuera"); las elecciones breves (Compartir) como hojas inferiores.

## Modelo de información

| Entidad | Campos esenciales | Relaciones |
|---|---|---|
| **Perfil** | id, nombre, usuario, carrera, avatar, universidad | Publica apuntes y participa en comentarios. |
| **Carpeta** | id, nombre, color, icono, descripción, propietario | Agrupa apuntes por materia. |
| **Apunte** | id, título, contenido, etiquetas, estado, fecha, carpetaId, autorId | Pertenece a una carpeta y puede convertirse en publicación. |
| **Publicación** | id, apunteId, audiencia, fecha | Representa un apunte visible en la comunidad o grupo. Reacciones, guardados y comentarios no son campos propios, se cuentan en vivo desde sus tablas (`reacciones`, `guardados`, `comentarios`). |
| **Comentario** | id, publicaciónId, autorId, texto, fecha | Inicia conversación académica. |
| **Colaboración** | apunteId, perfilId, permiso | Define lectura o edición para apuntes compartidos. |

## Identidad visual

Índigo profundo `#4F46E5` para las acciones principales, con la escala completa de Tailwind Indigo para estados y modo oscuro. Turquesa `#14B8A6` (Tailwind Teal) como acento de colaboración y comunidad. Neutro base **Slate** (frío, `#F8FAFC` en claro / `#0F172A` en oscuro) en vez del blanco cálido descrito en la idea original: el hex ya elegido coincidía exacto con Slate, así que se mantuvo tal cual en vez de introducir un neutro distinto. Colores de carpeta: Coral `#F2704F`, Ámbar `#F5A623`, Lima `#84CC16`, Cian `#06B6D4`, Azul `#3B82F6`, Violeta `#8B5CF6`, Fucsia `#D946EF`, Rosa `#EC4899` (ampliado de 4 a 8 en un pase de pulido posterior al cierre de Fase 2, evitando los tonos ya usados con significado semántico: Índigo, Teal, y los colores de estado success/warning/error/info).

Tipografía: **DM Sans** como única familia (títulos y cuerpo), elegida por descarte de las fuentes más sobreusadas en interfaces generadas (Inter, Roboto, Plus Jakarta Sans, entre otras). Iconografía **Phosphor**, con variantes outline y relleno para marcar estados activos (reaccionado, guardado) sin duplicar íconos.

Cards con radio 26px, botones/inputs/selects con radio 14px, sombras de dos capas muy sutiles. Los elementos que suelen quedar con el estilo por defecto del navegador también están tematizados: select propio (reemplaza el `<select>` nativo), checkbox propio (reemplaza el cuadrado del navegador) y scrollbar delgada con los colores del sistema.

## Motion

Híbrido de dos motores: **Motion** (motion.dev) para toda la interacción cotidiana, transiciones cortas (~200ms) sin overshoot; **anime.js** reservado a 2-3 momentos firma (hero de Comunidad, selector de visibilidad, primera entrada del feed público) con mayor duración y distancia mediante `ease-out-expo`, sin rebote. El nivel "rico" comunica presencia por duración y escala, no por spring/bounce. Detalle completo en `DESIGN-SYSTEM.md`.

## Accesibilidad

Botones solo-ícono con `aria-label`, íconos decorativos con `aria-hidden`, touch targets de 44px mínimo, foco visible en todos los controles interactivos (incluidos los componentes custom: select, checkbox, toggles), labels asociados en todos los inputs, y toda animación respeta `prefers-reduced-motion`. Los dos temas (claro/oscuro) se diseñaron con la misma atención, no por inversión automática de uno sobre el otro.

## Criterios de aceptación de la primera versión

| Área | Resultado esperado |
|---|---|
| Biblioteca | Las personas pueden crear apuntes y clasificarlos en carpetas desde web o PWA instalada. |
| Comunidad | Se puede explorar el feed y el detalle de cada publicación incluso sin sesión (lectura pública, con contadores agregados de reacciones/guardados/comentarios). Reaccionar, comentar y guardar requieren sesión iniciada; sin ella, la acción abre el inicio de sesión. |
| Compartir | Un apunte permite establecer visibilidad y abrir el flujo de colaboración, incluida la coedición en vivo para apuntes de grupo. |
| Navegación | Los cuatro destinos principales y sus overlays de detalle no contienen acciones sin respuesta ni salidas ocultas. |
| Instalación | La PWA se instala en Android e iOS sin perder funcionalidad respecto a la versión web. |
| Persistencia | Los apuntes y preferencias del usuario se conservan entre sesiones; el contenido compartido se sincroniza en tiempo real cuando corresponde. |