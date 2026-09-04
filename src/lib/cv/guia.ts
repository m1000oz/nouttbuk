// Contenido de la guía de CV: pasos con un prompt específico cada uno, para
// pegar en ChatGPT, Gemini o Claude (cualquiera de los tres funciona igual
// de bien para esto, ninguno es exclusivo). Vive en un archivo de datos
// aparte del componente para que el copy se pueda editar sin tocar JSX.
export type PasoGuiaCv = {
  numero: number;
  titulo: string;
  cuandoUsarlo: string;
  explicacion: string;
  prompt: string;
};

export const PASOS_GUIA_CV: PasoGuiaCv[] = [
  {
    numero: 1,
    titulo: "Arma tu primer borrador",
    cuandoUsarlo: "Todavía no tienes ningún CV, o el que tienes es muy viejo.",
    explicacion:
      "Antes de escribir nada, reúne en un documento suelto (no en el CV todavía) todo lo que hiciste: cursos, proyectos de clase, trabajos, prácticas, voluntariados, organizaciones estudiantiles. No lo filtres todavía, solo junta información. Con eso como insumo, este prompt te devuelve una primera estructura ordenada.",
    prompt:
      "Actúa como un especialista en reclutamiento universitario en Perú. Te voy a pasar una lista desordenada de mi experiencia, estudios y proyectos. Organízala en un borrador de CV con las secciones Perfil profesional, Educación, Experiencia y Habilidades, en español neutro, sin inventar nada que no te haya dado. Marca con [entre corchetes] cualquier dato que falte o que debería confirmar. Aquí está mi información:\n\n[Pega aquí tu lista desordenada: cursos relevantes, trabajos, proyectos, voluntariados, promedio si suma, idiomas, herramientas que manejas]",
  },
  {
    numero: 2,
    titulo: "Convierte tareas en logros medibles",
    cuandoUsarlo:
      'Tu experiencia dice cosas como "encargado de X" o "apoyé en Y" y no dice qué resultado tuvo.',
    explicacion:
      "Un reclutador lee decenas de CVs con la misma frase genérica. Lo que sí llama la atención es un resultado: cuánto, cuántos, en cuánto tiempo. Este prompt toma tus tareas sueltas y te ayuda a formularlas como logros, incluso si el número es una estimación razonable (nunca inventada).",
    prompt:
      "Voy a darte una lista de tareas que hice en un trabajo, práctica o proyecto. Para cada una, reformúlala como un logro de una sola línea usando la estructura \"Verbo de acción + qué hice + resultado o impacto (con número si es razonable estimarlo)\". Si no hay forma honesta de poner un número, no lo inventes, solo mejora la redacción. Dame las opciones en español neutro, sin exagerar. Estas son mis tareas:\n\n[Lista tus tareas tal como las harías en una conversación normal, sin pulir el lenguaje todavía]",
  },
  {
    numero: 3,
    titulo: "Adapta tu CV a una oferta específica",
    cuandoUsarlo:
      "Ya tienes un CV base y encontraste una convocatoria puntual a la que quieres postular.",
    explicacion:
      "El mismo CV para todas las postulaciones es el error más común. No se trata de mentir, sino de reordenar y resaltar lo que ya tienes según lo que pide esa oferta en particular. Pégale al modelo la oferta completa, no un resumen tuyo.",
    prompt:
      "Aquí tienes mi CV actual y, debajo, el texto completo de una convocatoria a la que quiero postular. Compara ambos y dime: (1) qué 3-5 palabras clave de la convocatoria no aparecen en mi CV pero sí deberían si son ciertas para mi experiencia, (2) qué logros de mi CV debería mover más arriba porque son los más relevantes para este puesto, y (3) qué le sobra a mi CV para esta postulación en particular. No reescribas todo el CV, solo dame estas tres recomendaciones puntuales.\n\nMi CV:\n[Pega el texto de tu CV actual]\n\nLa convocatoria:\n[Pega el texto completo de la oferta]",
  },
  {
    numero: 4,
    titulo: "Elige qué habilidades destacar",
    cuandoUsarlo:
      "Tienes más habilidades de las que caben en una sección corta y no sabes cuáles priorizar.",
    explicacion:
      "Una lista de 15 habilidades sin orden de prioridad comunica menos que 6 bien elegidas. Este prompt te ayuda a decidir cuáles poner primero según el puesto, no según lo que más te guste mencionar.",
    prompt:
      "Tengo esta lista de habilidades técnicas y blandas. Quiero postular a este tipo de puesto: [describe el puesto o pega la convocatoria]. Ordena mis habilidades de más a menos relevantes para ese puesto específico, agrúpalas en 2-3 categorías con nombres cortos (ejemplo: \"Herramientas\", \"Análisis de datos\"), y dime cuáles de las últimas del orden podría directamente quitar de esta versión del CV. Mis habilidades:\n\n[Lista todas tus habilidades sin filtrar]",
  },
  {
    numero: 5,
    titulo: "Revisa tono, gramática y consistencia",
    cuandoUsarlo: "Ya tienes una versión casi final y quieres una última pasada antes de enviarlo.",
    explicacion:
      "Un CV con errores de tipeo, tiempos verbales mezclados (pasado en un puesto, presente en otro) o repetición de las mismas palabras de acción se nota. Esta revisión final es distinta a las anteriores: acá no cambias contenido, solo forma.",
    prompt:
      "Revisa el siguiente CV solo en forma, no en contenido: errores de ortografía o gramática, tiempos verbales inconsistentes (si un puesto ya terminó debe ir en pasado, el actual en presente), palabras de acción repetidas al inicio de varias líneas (sugiéreme sinónimos), y frases demasiado largas para un CV. Dame la lista de correcciones puntuales con la línea original y tu sugerencia, no reescribas el documento entero. Este es mi CV:\n\n[Pega tu CV completo]",
  },
  {
    numero: 6,
    titulo: "Prepara una versión en inglés",
    cuandoUsarlo:
      "Vas a postular a una empresa internacional, una pasantía en el extranjero o un programa que pide CV en inglés.",
    explicacion:
      "Una traducción palabra por palabra suena forzada. Lo que necesitas es una adaptación que use las convenciones reales de un CV en inglés (que no son idénticas a las de uno en español), no una traducción literal.",
    prompt:
      "Adapta el siguiente CV al inglés para postulaciones en Estados Unidos/Europa, no lo traduzcas palabra por palabra. Usa las convenciones estándar de un CV/resume en inglés (verbos de acción fuertes al inicio de cada línea, sin pronombres personales, fechas en formato mes-año). Señala si alguna sección debería reformularse distinto en inglés por convención cultural, no solo por idioma. Este es mi CV en español:\n\n[Pega tu CV completo en español]",
  },
];

export const SITUACION_SIN_EXPERIENCIA = {
  titulo: "\u00bfY si todav\u00eda no tengo experiencia laboral?",
  texto:
    'Es la situaci\u00f3n m\u00e1s com\u00fan en un primer o segundo ciclo, no es un problema que resolver con relleno. En vez de inventar experiencia, usa el Paso 1 con lo que s\u00ed tienes: proyectos de curso con entregables reales, trabajos grupales donde tuviste un rol claro, voluntariados, organizaciones estudiantiles, cursos con certificado. La secci\u00f3n "Experiencia" de tu CV puede llamarse "Proyectos" en esta etapa, y es perfectamente v\u00e1lido.',
};
