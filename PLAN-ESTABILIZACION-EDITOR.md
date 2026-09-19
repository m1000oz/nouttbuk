# Plan de estabilización y optimización del editor

**Estado:** implementado parcialmente el 2026-09-19 (ver CLAUDE.md, "Current status"); sin verificar con dos conexiones reales  
**Ámbito:** editor de apuntes, coedición y persistencia  
**Principio rector:** en un apunte compartido, la integridad del contenido prevalece sobre la apariencia de paginación.

## 1. Resultado esperado

El editor debe comportarse como un instrumento de escritura predecible: responder sin saltos perceptibles, conservar el trabajo ante recargas o desconexiones y converger al mismo contenido para todas las personas que coeditan un apunte.

Al concluir el plan:

- Yjs/Liveblocks será la única fuente de verdad inmediata para contenido colaborativo.
- Postgres conservará una copia de lectura, búsqueda y publicación, nunca una competencia de escritura entre clientes.
- La paginación será una representación local; no podrá modificar el documento compartido.
- Cada sala tendrá una inicialización única e idempotente.
- El proyecto tendrá pruebas automatizadas de concurrencia y métricas comparables antes y después.

## 2. Diagnóstico resumido

| Riesgo | Situación actual | Consecuencia |
| --- | --- | --- |
| Paginación mutante | `Paginacion` puede ejecutar `tr.split()` cuando un bloque supera una hoja. | Una decisión dependiente del navegador se replica por Yjs como si fuera una edición humana. |
| Doble persistencia | El evento `update` autoguarda un JSON completo incluso tras cambios recibidos remotamente. | Dos colaboradores pueden enviar snapshots completos en distinto orden; el último `UPDATE` de Postgres no representa necesariamente el estado final de Yjs. |
| Siembra desde el cliente | Cada cliente puede importar el JSON de Postgres si ve el fragmento Yjs vacío después de sincronizar. | Dos conexiones concurrentes pueden inicializar una sala de forma no determinista. |
| Trabajo por pulsación | Se mide el DOM completo, se serializa JSON y se escribe un borrador local durante la edición. | Aumenta el INP, CPU y presión de memoria en notas extensas o conexiones con alta actividad. |
| Cobertura insuficiente | Solo hay pruebas unitarias del comparador de cortes de paginación. | No hay alarma automática ante pérdida de contenido, reconexión o carrera de inicialización. |

## 3. Arquitectura objetivo

```text
                         ┌────────────────────┐
                         │  Postgres / Supabase│
                         │ metadata + snapshot │
                         └─────────┬──────────┘
                                   │
                    bootstrap único │ exportación controlada
                                   │
┌───────────────┐       ┌──────────▼──────────┐       ┌───────────────┐
│ Cliente A      │◄─────►│ Yjs + Liveblocks     │◄─────►│ Cliente B      │
│ Tiptap         │       │ fuente colaborativa  │       │ Tiptap         │
│ paginación local│       └─────────────────────┘       │ paginación local│
└───────────────┘                                       └───────────────┘
```

### Invariantes

1. Ninguna extensión dependiente de layout puede cambiar `doc` en un editor colaborativo.
2. Un cliente nunca rehidrata contenido sobre una sala ya inicializada.
3. Un `UPDATE` remoto no origina otro guardado de JSON completo desde cada cliente.
4. Todos los clientes conectados a una sala usan el mismo esquema de Tiptap.
5. El estado visible de guardado distingue claramente entre sincronización en vivo y snapshot persistido.

## 4. Fases de implementación

### Fase 0 — Línea base y protección operativa

**Objetivo:** conocer el problema antes de cambiar comportamiento.

- Añadir instrumentación de desarrollo para contar:
  - transacciones Tiptap locales y remotas;
  - ejecuciones y duración de `Paginacion`;
  - serializaciones `getJSON()`;
  - escrituras a `localStorage`, Supabase y Liveblocks;
  - tiempo hasta `sync` y reconexiones.
- Crear tres documentos de prueba reproducibles: 1, 10 y 50 páginas, con tablas, imágenes, fórmulas y un párrafo continuo largo.
- Registrar métricas en escritorio y en un Android de gama media: INP, tiempo de carga del editor, memoria, CPU durante escritura y número de solicitudes por minuto.
- Congelar cambios funcionales del editor mientras se estabiliza la capa de datos.

**Criterio de salida:** existe una tabla de métricas inicial y una reproducción documentada de cada fallo conocido.

### Fase 1 — Corregir la frontera entre contenido y presentación

**Objetivo:** la paginación no cambia la semántica del documento.

- Extender `Paginacion` con una opción explícita, por ejemplo `permitirDivisionDeDocumento`.
- Configurar esa opción como `false` en `EditorColaborativo` y en toda vista que no deba mutar contenido.
- Eliminar la ruta `tr.split()` para editores colaborativos. Un bloque excesivamente alto debe continuar entre páginas visualmente, aunque el corte sea menos perfecto.
- Mantener los saltos como decoraciones locales. No guardarlos en JSON ni emitirlos a Yjs.
- Documentar que tamaño de papel, zoom, fuente disponible y márgenes son preferencias de vista local, no estado compartido.

**Criterio de salida:** pegar un párrafo de más de una página en dos navegadores no crea párrafos nuevos, no altera el historial y ambos usuarios conservan el mismo JSON de contenido.

### Fase 2 — Fuente de verdad y bootstrap atómico

**Objetivo:** impedir carreras de inicialización y snapshots conflictivos.

- Definir el ciclo de vida de una nota de grupo:
  1. El apunte existe en Postgres con un JSON inicial.
  2. Un proceso autorizado inicializa el documento Yjs una sola vez.
  3. La sala marca la versión o huella del bootstrap realizado.
  4. Los clientes solo se conectan y consumen el documento Yjs resultante.
- Mover la siembra de `prosemirrorJSONToYXmlFragment` fuera del efecto de cliente. Debe ocurrir mediante una operación exclusiva y reintentabile en backend/proveedor.
- Guardar un identificador de versión del esquema y del snapshot. Si no coinciden, bloquear edición y mostrar una recuperación segura en vez de descartar nodos desconocidos.
- Establecer una política de recuperación: si Yjs está vacío pero Postgres contiene contenido, el servidor puede reconstruir una sola vez; si hay ambos, Yjs prevalece.

**Criterio de salida:** veinte aperturas concurrentes de una nueva nota terminan con un único documento equivalente al JSON inicial, sin duplicados.

### Fase 3 — Separar sincronización de guardado

**Objetivo:** evitar que cada persona compita escribiendo snapshots completos.

- En notas de grupo, retirar el autoguardado de `contenido` disparado por `editor.on("update")`.
- Mantener en Postgres el guardado de metadatos independientes: título, carpeta, etiquetas, visibilidad y favorito, con una política de permisos explícita.
- Crear una operación de snapshot controlada del Y.Doc hacia Postgres:
  - por evento de servidor, webhook o tarea programada;
  - al cerrar la última conexión, si el proveedor lo permite;
  - a intervalos moderados y siempre antes de publicar/exportar;
  - serializada por `apunte_id`, nunca desde cada navegador.
- Cambiar el mensaje de estado:
  - **Sincronizado**: cambios confirmados en la sala colaborativa.
  - **Guardando copia**: actualización de snapshot en segundo plano.
  - **Sin conexión**: cambios locales pendientes de sincronización.
- Para notas no colaborativas, usar una cola de una sola escritura y un número de revisión para descartar respuestas antiguas.

**Criterio de salida:** dos editores simultáneos producen exactamente el mismo contenido en Yjs y el snapshot posterior de Postgres coincide con él.

### Fase 4 — Rendimiento de escritura y lectura

**Objetivo:** reducir trabajo sin sacrificar seguridad.

- Paginación:
  - agrupar medidas después de una pausa corta de escritura o un frame visible;
  - diferenciar cambios locales, cambios remotos, imágenes y cambios de geometría;
  - conservar decoraciones previas hasta calcular las nuevas;
  - medir primero todos los nodos y escribir decoraciones una sola vez;
  - establecer un presupuesto de trabajo para documentos muy largos y degradar a paginación aproximada si se excede.
- Borradores:
  - no ejecutar `getJSON()` ni `localStorage.setItem()` por cada transacción;
  - guardar al quedar inactivo, al ocultar la pestaña y con un máximo temporal;
  - usar IndexedDB para borradores grandes y dejar `localStorage` solo para indicadores pequeños.
- Carga:
  - cargar extensiones pesadas, como matemáticas e imagen, bajo demanda cuando la experiencia lo permita;
  - alinear todas las dependencias `@tiptap/*` a una versión compatible y fijada;
  - medir tamaño de bundle antes de decidir división adicional.

**Criterio de salida:** las métricas mejoran frente a la línea base y la escritura no presenta tareas largas perceptibles con la nota de 50 páginas.

### Fase 5 — Pruebas, observabilidad y despliegue

**Objetivo:** convertir la estabilidad en una propiedad verificable.

- Pruebas unitarias:
  - paginación no muta el documento en modo colaborativo;
  - serialización y restauración conservan nodos personalizados;
  - las versiones de esquema se validan antes de editar.
- Pruebas de integración con dos clientes:
  - inserciones concurrentes en la misma línea;
  - pegado de texto largo mientras otra persona escribe;
  - reconexión después de pérdida de red;
  - apertura simultánea de una sala sin inicializar;
  - cambio de permiso de edición a lectura durante la sesión;
  - convergencia del JSON final y del snapshot en Postgres.
- Pruebas end-to-end:
  - cursor y presencia;
  - cierre/recarga con borrador pendiente;
  - nota de grupo publicada y leída desde la copia persistida.
- Despliegue gradual mediante una bandera de función por nota o por usuario:
  1. equipo interno;
  2. un grupo pequeño de apuntes nuevos;
  3. nuevos apuntes de grupo;
  4. migración controlada de salas existentes.
- Alertas: errores de bootstrap, desconexiones prolongadas, divergencia de snapshot, transacciones de paginación que muten `doc` y duración de interacción por encima del presupuesto.

**Criterio de salida:** cero divergencias en el piloto, recuperación correcta tras reconexión y aprobación explícita de métricas frente a Fase 0.

## 5. Orden de trabajo sugerido

| Hito | Dependencia | Entregable |
| --- | --- | --- |
| A. Línea base | Ninguna | Métricas, documentos de estrés y casos reproducibles |
| B. Paginación no mutante | A | Flag de modo colaborativo y regresiones cubiertas |
| C. Bootstrap único | B | Inicializador idempotente, versión de esquema y pruebas de carrera |
| D. Snapshot centralizado | C | Política de persistencia y estado de sincronización visible |
| E. Rendimiento | D | Menos trabajo por pulsación y comparación de métricas |
| F. Piloto | E | Bandera de función, telemetría y plan de reversión |

## 6. Decisiones que deben mantenerse explícitas

- **Paginación perfecta vs. colaboración:** no se intentará que todas las pantallas muestren cortes idénticos. La tipografía, ventana y zoom hacen que esa promesa sea frágil. El texto, no el corte visual, es lo compartido.
- **Título y metadatos:** definir si el título se coedita en Yjs o si tiene propietario. No debe quedar como un campo local que varios usuarios reescriben sin regla.
- **Historial:** Yjs resuelve cambios concurrentes, no sustituye por sí mismo una experiencia de historial con restauración. La copia de snapshots debe conservar suficientes versiones para recuperación operativa.
- **Migración de notas existentes:** no se debe resembrar una sala ya activa. Cada apunte necesita una estrategia de detección, respaldo y migración única.

## 7. Riesgos y reversión

| Riesgo | Mitigación | Reversión |
| --- | --- | --- |
| Sala existente sin snapshot válido | Respaldar JSON y estado Yjs antes de migrar. | Volver a la copia de Postgres y desactivar colaboración para ese apunte. |
| Paginación visual menos exacta | Mostrar continuidad natural de bloques largos y mantener impresión como proceso separado. | Activar la paginación anterior solo en notas privadas no colaborativas. |
| Snapshot retrasado | Indicador claro de sincronización y snapshot periódico desde servidor. | Exportar el Y.Doc actual bajo demanda antes de publicar. |
| Cambio de proveedor o protocolo | Encapsular bootstrap, snapshot y autorización detrás de una interfaz de colaboración. | Mantener la capa de Tiptap/Yjs y reemplazar únicamente el transporte. |

## 8. Definición de terminado

La optimización se considerará terminada cuando una nota de grupo pueda ser editada por varias personas, con red intermitente y contenido largo, sin pérdida ni duplicación de texto; cuando su copia de Postgres sea verificablemente derivada del estado Yjs; y cuando la experiencia de escritura se mantenga fluida según las métricas acordadas en la línea base.
