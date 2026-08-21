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
- **Editor** (overlay, se abre desde "Nuevo apunte" o al tocar un apunte propio): título, contenido editable sobre una hoja de ancho A4 (siempre blanca con tinta oscura fija, sin seguir el tema oscuro) que flota con sombra sobre un lienzo con un tinte muy suave del color primario detrás; barra de formato con párrafo/H1/H2/H3, negrita, cursiva, subrayado, tachado, fuente (predeterminada/serif/monoespaciada), tamaño de texto (pequeño/normal/grande/muy grande), resaltado y color de texto con la misma paleta de carpetas, alineación (izquierda/centro/derecha/justificado), listas, cita, enlace, insertar imagen (sube a Storage), insertar tabla, y una píldora fija con el contador de palabras/caracteres; etiquetas, selector de Carpeta (select tematizado), selector de Visibilidad (privado/grupo/comunidad), e indicador de coedición en vivo + botón de invitar colaborador cuando la visibilidad es "Grupo".
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
