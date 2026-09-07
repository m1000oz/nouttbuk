# Nouttbuk, sistema de diseño

Cierre de la Fase 2: las seis secciones de abajo (fundamentos → componentes → motion → estados → pantallas → accesibilidad) quedaron confirmadas en conversación con mockups interactivos como evidencia. No es código de producción, es la base para implementar en la Fase 3 con el stack de `STACK.md`.

## Mockups de referencia

| Paso | Artifact |
|---|---|
| 1. Fundamentos | Fundamentos Nouttbuk (paleta, tipografía, iconografía, radios) |
| 2. Componentes | Componentes Nouttbuk (botones, inputs, cards, badges, avatares, tabs, nav, sheet, select, checkbox, scrollbar) |
| 3. Motion | Motion Nouttbuk (comparación sutil vs rico, momentos firma) |
| 4. Estados | Estados Nouttbuk (vacíos, carga, error, toasts, feedback) |
| 5. Pantallas | Pantallas Nouttbuk (prototipo navegable completo) |

(Enlaces publicados durante la conversación. Buscarlos en el historial de esta sesión o en `claude.ai/code/artifacts` si se perdió el link.)

## 1. Fundamentos de marca, ✅ cerrado

### Color

Índigo y turquesa ya estaban definidos en `NOUTTBUK-IDEA.md` y coinciden exacto con escalas estándar de Tailwind. Se usan tal cual, sin inventar una escala nueva.

**Índigo** (acción principal), Tailwind Indigo:
`50 #EEF2FF · 100 #E0E7FF · 200 #C7D2FE · 300 #A5B4FC · 400 #818CF8 · 500 #6366F1 · 600 #4F46E5 (marca) · 700 #4338CA · 800 #3730A3 · 900 #312E81`

**Turquesa** (comunidad/colaboración), Tailwind Teal:
`50 #F0FDFA · 100 #CCFBF1 · 200 #99F6E4 · 300 #5EEAD4 · 400 #2DD4BF · 500 #14B8A6 (marca) · 600 #0D9488 · 700 #0F766E · 800 #115E59 · 900 #134E4A`

**Neutro base**: **Slate** (confirmado por el usuario, frío, como estaba definido originalmente en `#F8FAFC`):
`50 #F8FAFC · 100 #F1F5F9 · 200 #E2E8F0 · 300 #CBD5E1 · 400 #94A3B8 · 500 #64748B · 600 #475569 · 700 #334155 · 800 #1E293B · 900 #0F172A`

**Colores de carpeta**: Coral `#F2704F` · Ámbar `#F5A623` · Lima `#84CC16` · Cian `#06B6D4` · Azul `#3B82F6` · Violeta `#8B5CF6` · Fucsia `#D946EF` · Rosa `#EC4899` (8, ampliado desde los 4 originales)

**Semánticos**: Éxito `#10B981` · Advertencia `#F59E0B` · Error `#E11D48` · Info `#3B82F6`

**Dark theme** (tokens base, se refinan en el paso de componentes):
- Fondo `#0F172A` (slate-900) · Superficie `#1E293B` (slate-800) · Borde `#334155` (slate-700) · Texto `#F1F5F9` (slate-100)
- Índigo primario en oscuro: `#818CF8` (indigo-400) · Turquesa en oscuro: `#2DD4BF` (teal-400)

### Tipografía

**Confirmado: DM Sans** (única familia, títulos y cuerpo), pesos 400/500/700.
Google Fonts: `DM+Sans:wght@400;500;700`

Revisión: la elección original (Plus Jakarta Sans) quedó marcada como "fuente sobreusada" en la auditoría de calidad del paso 5, junto a Inter, Roboto, Fraunces, Geist y Space Grotesk. Se reemplazó por DM Sans, que mantiene el espíritu original ("un solo sans moderno", opción C del paso 1) pero con más carácter geométrico y sin aparecer en esa lista.

### Iconografía

**Confirmado: Phosphor**, variantes outline (estado normal) y fill/relleno (estado activo: reaccionado, guardado) sin necesitar un ícono aparte.

### Radios / forma

**Confirmado: 26px** en cards. (Botones, inputs y badges heredan una escala relacionada, a definir en el paso de componentes, ver sección 2.)

## 2. Componentes base, ✅ cerrado

Confirmados sin cambios sobre el mockup de referencia:
- **Botones**: primario (índigo sólido), secundario (outline índigo), ghost, destructivo (rose), radio 14px, estados normal/disabled/loading.
- **Inputs**: texto/búsqueda/error, radio 14px, foco con anillo índigo (`--ring`).
- **Card genérica**: radio 26px, borde `--border` 1px, sombra sutil de dos capas. De aquí heredan apunte, publicación y (paso 5) carpeta.
- **Badges de visibilidad**: privado (neutro + lock), grupo (índigo suave + users), comunidad (turquesa suave + globe). Tags de materia usan el color de carpeta.
- **Avatares**: sm/md/lg circulares con iniciales sobre índigo suave; stack apilado para colaboradores.
- **Tabs**: pill container con tab activo elevado.
- **Navegación**: lateral (desktop) con CTA "Nuevo apunte"; tab bar + FAB inferior (mobile/PWA), mismos 4 destinos + crear. El FAB se superpone a la barra a la mitad (no flota entero por arriba) con un borde del color de fondo, para que se vea integrado y no como un círculo suelto.
- **Sheet**: esquinas superiores 26px, handle central, usado para el flujo de Compartir.
- **Select**: reemplaza el `<select>` nativo (no tematizable de forma consistente entre navegadores). Botón disparador con el mismo estilo que un input, panel desplegable propio con radio 14px, sombra y check de selección. Usado en el selector de Carpeta y Curso del editor, en Carrera (registro/editar perfil), y en los filtros de Carrera/Curso de Comunidad.
- **Checkbox**: caja propia de 20px con radio 6px (no el cuadrado por defecto del navegador), marca del sistema al tildar. Usado en "puede editar" del flujo de invitar colaborador.
- **Scrollbar**: delgada (9px), sin track visible, pulgar con `--border`/`--text-muted` en vez de la barra gris del navegador. Aplicada a nivel global en las cinco páginas del sistema.

Nota: el diseño específico de las cards de carpeta/curso (con progreso, ícono de materia, conteo de apuntes) se define en el paso 5 (pantallas), no aquí. Aquí solo se fijó la card genérica de la que heredan.

## 3. Motion, ✅ cerrado

**Híbrido confirmado tras comparar sutil vs rico sobre los mismos componentes:**
- **Motion** (motion.dev) para toda la UI cotidiana: hover/press de botones, cards, tabs, toasts, apertura de sheets. ~200ms, `ease-out` estándar, sin overshoot. Tiene que sentirse instantáneo.
- **anime.js v4** para 2-3 momentos firma: hero de Comunidad (entrada de texto palabra por palabra), selector de visibilidad del editor (píldora deslizante), y candidato fuerte: primera entrada del feed público (no en cada scroll). ~500-650ms, mayor distancia y escala que el nivel sutil.
- Se eligió anime.js en vez de GSAP para el nivel rico porque ya está instalado en el entorno del usuario y cubre el mismo caso de uso (Timeline API, stagger, easings personalizados) sin sumar una dependencia nueva. No fue una decisión de licencia (GSAP es 100% gratis desde abril 2025).
- **Revisión de easing**: el easing con overshoot/spring original quedó marcado como "anticuado" en la auditoría del paso 5. Se reemplazó por `ease-out-expo` (`cubic-bezier(.16,1,.3,1)`) en todos los momentos firma: deceleración marcada y dramática, sin rebote. La "riqueza" del nivel rico ahora viene de la duración, la distancia y el stagger, no de un rebote.
- Coedición en vivo (cursores/presencia de Liveblocks) usa su propio sistema de animación, independiente de esta decisión.
- Todo respeta `prefers-reduced-motion` (se documenta en la sección 6).

## 4. Estados y patrones transversales, ✅ cerrado

- **Vacíos**: mismo patrón en toda la app, ícono en caja suave (con trazo punteado para indicar "sin contenido") + mensaje corto + una acción primaria. Usado para "sin apuntes", "sin resultados de búsqueda" y "la comunidad recién arranca".
- **Carga**: skeleton con shimmer que respeta la forma exacta de la card real (radio 26px), para que el contenido no salte al llegar.
- **Error**: banner con ícono, causa clara y botón de reintentar. Colores del token `--danger`/`--danger-soft`.
- **Toasts**: éxito/error/info, aparecen abajo y se autodescartan a los ~2.6s. Iconografía Phosphor coherente con el resto (check/x/info en círculo).
- **Board de feedback**: pantalla separada del feed académico. Composer arriba (input + botón enviar) y lista de ideas con voto y estado (Nueva/En revisión/Hecho).

## 5. Pantallas clave, ✅ cerrado

Prototipo navegable (no capturas sueltas) con las 4 pantallas principales por navegación real, más overlays:

- **Inicio**: saludo, accesos rápidos (Nuevo apunte / Ver comunidad), materias recientes (clicables, filtran Mis apuntes), últimos apuntes.
- **Mis apuntes**: buscador, tabs (Todos/Favoritos/Compartidos), grid de apuntes; cada tarjeta muestra extracto, carpeta, fecha y un menú de opciones (mover a carpeta, compartir, eliminar con verificación). Incluye la vista de Detalle de carpeta como filtro con botón de volver, y un botón "Nueva carpeta" (o "Editar carpeta" cuando hay un filtro activo).
- **Crear/editar carpeta** (sheet, reutiliza el patrón de la sheet de Compartir): nombre de la materia y selector de color por swatches (8 tonos, cada uno mostrado como un ícono de carpeta real, no un cuadro plano). Al renombrar una carpeta, los apuntes que la usaban se actualizan con ella.
- **Editor** (overlay, se abre desde "Nuevo apunte" o al tocar un apunte propio): ver la subsección dedicada "Editor de apuntes: el atelier" más abajo, es una excepción visual deliberada al resto de este documento, no el mismo lenguaje Índigo/Teal/Slate.

### Editor de apuntes: el atelier (excepción visual deliberada), ✅ cerrado

El editor tuvo dos iteraciones. La primera (Fase 3) clonaba visualmente Google Docs: barra de menús superior, regla horizontal, barra de herramientas persistente, hojas apiladas en blanco frío. El usuario la calificó de "realmente fea" y pidió libertad total para romper con esa referencia y construir algo que se sienta como un programa caro, memorable, no un clon. La segunda iteración (esta) reemplaza por completo el lenguaje visual **solo para la superficie del editor** (`apunte-editor.tsx` y todo lo que cuelga de `.apunte-editor-overlay`): el resto de la app sigue en Índigo/Teal/Slate/DM Sans sin cambios.

**Dirección**: un atelier de escritura oscuro y cálido, no un procesador de textos. Café grafito cálido (nunca negro frío ni azulado, ese es el look "modo oscuro genérico" de IA que se quiso evitar explícitamente), un solo acento de latón/oro cálido, papel color marfil cálido (nunca blanco frío de fotocopia) con sombra direccional como si la luz cayera desde arriba.

**Tokens propios**: `.apunte-editor-overlay` redefine los mismos custom properties que el resto de la app (`--background`, `--foreground`, `--primary`, etc., ver `globals.css`) a la paleta del atelier. Como son custom properties heredadas, cualquier componente ya tematizado con esos tokens (Button, Badge, el panel de esquema) se re-viste solo. Excepción conocida y aceptada: los popovers de Select (Carpeta/Curso/Visibilidad) y el Sheet de Compartir hacen portal a `document.body` y escapan de ese scope, quedando en el tema ambiente de la app — son acciones secundarias, no la superficie principal, no se justificó la plomería de un `container` de portal para esos dos casos.

**Tipografía**: se suma **Newsreader** (serif editorial, Google Fonts, variable `--font-manuscrito`) solo para el título del apunte y los encabezados H1/H2/H3 dentro de la hoja — es una serif diseñada específicamente para lectura larga, la razón concreta por la que se eligió sobre cualquier otra serif de la lista de referencia. El resto de la UI del editor (menús, botones, barra de herramientas) se queda en DM Sans, sin segunda voz para controles.

**Tercera iteración (2026-09-06): menú superior + barra de herramientas persistente, misma paleta atelier**. La segunda iteración (arriba) eliminó por completo el menú superior/regla/barra fija de la primera por mímica literal de Docs. El usuario después pidió explícitamente lo contrario: "cópiale agresivamente a Docs" pero "me gusta la temática" — es decir, la profundidad funcional de un procesador de texto profesional (para escribir ensayos reales), sin volver al blanco/gris de Docs. Se confirmó con el usuario, en una pregunta directa, que quería la opción más completa (menú superior real, no solo ampliar la burbuja), y una segunda pregunta confirmó eliminar la burbuja flotante en vez de mantenerla junto a la barra fija (Docs mismo no tiene burbuja, y mantener las dos hubiera duplicado la misma clase de bugs de posicionamiento que esa burbuja tuvo esta sesión). Cambios concretos:
- **`EditorToolbar`/`BubbleMenu` eliminados** (`@tiptap/extension-bubble-menu` desinstalado). Sus piezas reutilizables (`useEstadoEditor`, botones, selectores de color/enlace/estilo de bloque) se extrajeron a `editor-controles-formato.tsx`, compartidas por lo nuevo.
- **`editor-menu-bar.tsx`** (`EditorMenuBar`, sobre `src/components/ui/menubar.tsx`, `@base-ui/react/menubar`): Archivo/Edición/Ver/Insertar/Formato/Herramientas, con atajos de teclado reales (Ctrl+S, Ctrl+F intercepta el buscador nativo del navegador, etc.). Cada ítem llama a un comando de Tiptap que ya existía o reutiliza `crearItemsComando()` (nunca reimplementa inserciones).
- **`editor-barra-persistente.tsx`** (`EditorBarraPersistente`): barra de formato siempre visible debajo del menú, no solo al seleccionar texto. Agrega controles que las extensiones `FontFamily`/`FontSize` (ya instaladas desde antes, sin UI) tenían pendientes, más subíndice/superíndice, interlineado (`line-height-extension.ts`, nuevo) y lista de tareas (`@tiptap/extension-task-list`/`-task-item`).
- **Diálogos nuevos** (`dialogo-configurar-pagina.tsx`, `dialogo-buscar-reemplazar.tsx` con su propia extensión `buscar-reemplazar-extension.ts`, `dialogo-contar-palabras.tsx`): usan `src/components/ui/dialog.tsx` anclado vía el prop `container` de Base UI a `.apunte-editor-overlay` (ver el fix de portal más abajo), no un tema oscuro copiado a mano.
- **Configuración de página client-side**: tamaño (A4/Carta), orientación, márgenes y encabezado/pie de página viven en `localStorage` por apunte (`src/lib/tiptap/configuracion-pagina.ts`), no en una columna nueva de Supabase — el mismo criterio que `guiaVisible`.
- **Comando "/"** (`comando-barra.ts` + `menu-comandos.tsx`) se mantiene sin cambios de arquitectura, ahora con una entrada "Tarea" agregada.
- **Bug de color heredado, encontrado y corregido en la misma pasada**: `.apunte-editor-overlay` redefinía las custom properties (`--foreground`, etc.) pero nunca declaraba `color` en sí misma; como CSS hereda el *valor ya computado* de una propiedad, no la expresión `var()`, cualquier texto que dependiera solo de herencia (sin una clase Tailwind explícita como `text-foreground`) seguía mostrando el color del tema claro ambiente resuelto en `<body>` — el botón "Cerrar editor" y varios íconos del header eran, en la práctica, invisibles sobre el fondo oscuro desde la segunda iteración. Corregido agregando `color: var(--foreground)` directamente en `.apunte-editor-overlay`, forzando una reevaluación en el scope correcto.
- **Portales anclados, no un segundo set de overrides**: los menús/diálogos nuevos usan el prop `container` (ya soportado por `DropdownMenuContent`/`DialogContent` en `src/components/ui/`) apuntando a un ref de `.apunte-editor-overlay`, heredando los tokens del atelier gratis, en vez de repetir el patrón `!important` de `.menu-flotante-popover` (que sigue existiendo, documentado abajo, para el código anterior a este cambio).
- **Esquema del documento**: sin cambios respecto a la segunda iteración.
- **Título movido al header (Pass 8, justo después de esta iteración)**: el usuario pidió explícitamente el mismo lugar que Google Docs, que no tiene título dentro de la página. El campo salió de `HojasEditor` (donde vivía como primera línea del manuscrito, `--font-manuscrito`) al `<header>` de `apunte-editor.tsx`, entre el botón de cerrar y el grupo de selects, en DM Sans como el resto del chrome (la serif queda reservada para contenido real de la hoja, no para controles). `.titulo-manuscrito` se eliminó de `globals.css`.
- **Modo claro (Pass 9)**: "atelier" ya no es un único mundo visual fijo, es dos paletas seleccionables por persona en Ver > Tema (`editor-menu-bar.tsx`), persistidas en `localStorage` (`nouttbuk:tema-editor`, preferencia del navegador, no del apunte). Oscuro es el original de arriba; Claro es el mismo lenguaje (mismo acento de latón, misma tipografía, mismos componentes) pero hoja blanca sobre lienzo blanco, pedido explícito para que se sienta "igual que Docs" en blanco — sin la lámpara ni el polvo (`.lienzo-editor::before`/`.mota-polvo`, apagados en claro, un gesto de atelier a media luz que no encaja con blanco liso) y con una sombra de hoja mucho más suave (la receta oscura asume un lienzo oscuro detrás). Selector via `data-tema="oscuro"|"claro"` en `.apunte-editor-overlay`, ver `src/app/globals.css`. Esto además forzó una limpieza real: los seis popovers de la barra de formato (color/enlace/estilo/fuente/tamaño/interlineado) dejaron de necesitar el hack `!important` de `.menu-flotante-popover` — ya anclan su portal dentro del overlay vía `container` (ver Pass 7), así que las clases de Tailwind (`bg-popover`, `text-popover-foreground`) resuelven solas contra el tema correcto. La única pieza que sigue fuera del árbol de React (`menu-comandos.tsx`, el popup "/" que se agrega a mano a `document.body`) no puede heredar custom properties, así que refleja el tema a mano como atributo (`src/lib/tiptap/tema-editor.ts`, mismo puente que ya existía para la geometría de página).

**Paginación real sin cambios de arquitectura**: la extensión `Paginacion` (decoraciones de vista, nunca toca el documento) y `HojasEditor` (apila N fondos de hoja) de la primera iteración se mantienen intactas; solo cambió el material visual de la hoja (marfil cálido, folio numerado al pie como un libro real, en vez de blanco liso).

**Por qué no se llevó al resto de la app**: el editor es, por lejos, la superficie de mayor uso y permanencia de toda la app (Principio de producto n.° 1, ver `PRODUCT.md`); el resto de las pantallas (Inicio, Mis apuntes, Comunidad, Calendario, Perfil) son de paso, y ya tenían un sistema Índigo/Teal/Slate cerrado y validado en varias rondas — replicar el atelier ahí sería una reescritura de marca no pedida, no una mejora puntual.

**Segunda vuelta, misma dirección, más compromiso** (el usuario calificó la primera entrega como "un 3 de 10 a nivel de volada" y pidió más, no un cambio de rumbo):

- **Guía flotante** (`editor-guia.tsx`, panel a baja opacidad en la esquina superior derecha, se aclara al pasar el mouse): enseña los comandos "/" y los atajos de teclado todo el tiempo mientras se escribe, en vez de un tutorial de una sola vez que se olvida. Reutiliza `crearItemsComando()` (la misma lista que alimenta el menú "/") para no desincronizarse nunca. Tiene un botón propio para ocultarla y un ícono de foco (`LightbulbIcon`) en el header para volver a mostrarla; la preferencia se guarda en `localStorage` (`nouttbuk:guia-editor-visible`), no en Supabase, porque es una preferencia de este navegador, no un dato del apunte.
- **Ambiente del atelier** (`ambiente-atelier.tsx` + `.lienzo-editor::before`/`.polvo-contenedor` en `globals.css`): el momento de marca de esta pantalla. Una lámpara cálida sobre la hoja con un parpadeo lento e irregular (`@keyframes atelier-lampara`, curva de cuatro tramos desiguales, no un pulso sinusoidal parejo que se leería como una animación de sistema), más motas de polvo suspendidas derivando lentamente hacia arriba (posiciones y tiempos fijos, no `Math.random()`, para no romper la hidratación de React). Cada hoja nueva que agrega la paginación llega con una entrada propia (`atelier-hoja-entra`, fundido + deslizamiento sutil), no aparece de golpe. Todo respeta `prefers-reduced-motion` (se congela por completo).
- **Bug real encontrado y corregido**: los popovers de estilo/color/enlace de la barra flotante (`.menu-flotante-popover`) mostraban texto invisible (oscuro sobre oscuro) — `DropdownMenuContent` (`src/components/ui/dropdown-menu.tsx`) trae sus propias clases de Tailwind (`bg-popover`, `text-popover-foreground`, `ring-1 ring-foreground/10`) con la misma especificidad CSS que esta clase, y como Tailwind inyecta sus utilidades en una capa posterior a `@layer base`, esas utilidades ganaban por orden de capa, no por especificidad. Corregido con `!important` en las propiedades de fondo/color/sombra de `.menu-flotante-popover` — la excepción deliberada a "nunca fuerces con !important", documentada acá para que no se repita el mismo bug si se agrega un popover nuevo con este mismo patrón.
- **Comunidad**: hero con entrada de texto animada (anime.js), filtro por carrera y curso (select, el de curso se acota a la carrera elegida), feed de publicaciones públicas.
- **Detalle de publicación** (overlay, se abre al tocar un apunte de comunidad): contenido completo, autor, reacciones/guardados/comentarios, lista de comentarios y campo para agregar uno.
- **Perfil**: avatar, carrera/universidad, stats (apuntes/aportes/contactos), apuntes públicos, editar perfil, enviar feedback (abre el board de feedback), cerrar sesión (abre Login). "Apuntes" es el total de apuntes propios (cualquier visibilidad); "aportes" es el total de reacciones recibidas en las publicaciones community propias, no actividad propia; "contactos" son las personas únicas con quienes se comparte al menos un apunte, como dueño (colaboradores invitados) o como colaborador invitado (dueños de esos apuntes).
- **Editar perfil** (overlay): foto de perfil (subida directa a Storage, sin recorte), nombre, usuario, carrera; universidad fija (no editable, ya viene del correo institucional con el que se creó la cuenta). Carrera es un select temático con el catálogo oficial de las 55 carreras de pregrado de PUCP (tabla `carreras`), mismo criterio que el formulario de registro. El usuario solo se puede cambiar una vez cada 7 días (chequeo de disponibilidad en vivo mientras se escribe, con debounce).
- **Login/Registro**: modal alcanzable desde cualquier pantalla ("Ver pantalla de login" o "Cerrar sesión"), con toggle entre iniciar sesión y crear cuenta. El registro pide nombre, usuario, carrera (select tematizado con el catálogo oficial de carreras PUCP), universidad (fija en "Pontificia Universidad Católica del Perú", único dominio admitido por ahora) y correo institucional, con validación en vivo de que el correo termine en `@pucp.edu.pe`.
- **Recuperar contraseña**: alcanzable desde el login ("¿Olvidaste tu contraseña?"). Pide el correo institucional (misma validación de dominio), muestra confirmación de envío sin revelar si la cuenta existe o no.
- **Compartir** y **Board de feedback**: ya definidos y confirmados en los pasos 2 y 4 respectivamente, se reutilizan tal cual, no se rediseñan acá.

**Layout responsivo**: nav lateral (desktop) y tab bar + FAB (mobile/PWA) conviven en el mismo prototipo mediante un toggle manual, para decidir el diseño de ambos sin duplicar pantallas. Los breakpoints reales (media queries en vez de toggle) se implementan en la Fase 3.

## 6. Accesibilidad, ✅ cerrado (auditado con `impeccable audit` en el paso 5)

- Todo botón solo-ícono tiene `aria-label` (cerrar, volver, reaccionar, guardar, comentar, enviar comentario, etc.); los íconos decorativos junto a texto visible llevan `aria-hidden="true"`.
- Touch targets de botones-ícono en 44×44px mínimo.
- Foco visible vía anillo (`--ring`) en botones, inputs, selects y checkboxes custom (`:focus-visible`), nunca `outline:none` sin reemplazo.
- Inputs con `<label>` asociado por `for`/`id` (o `aria-label` cuando el componente se re-renderiza y podría duplicar ids); el editor de contenido usa `role="textbox" aria-multiline="true"`.
- Toggles de tema/layout con `aria-pressed` sincronizado por JS; grupos de toggle con `role="group"` y `aria-label`.
- Todo overlay (editor, publicación, sheet, login) tiene una salida visible explícita, no solo clic afuera.
- Todas las animaciones respetan `prefers-reduced-motion` (se desactivan o resuelven al estado final sin transición).
- Los dos temas (claro/oscuro) se diseñaron con la misma atención, no por inversión automática; se verifican juntos en cada mockup con el toggle en vivo.
