import type { Json } from "@/lib/types/database.types";

// Documento Tiptap/ProseMirror inicial para un CV recién creado: las mismas
// secciones que antes dibujaba generar-cv-pdf.ts a mano con jsPDF (Perfil
// profesional, Educación, Experiencia x2, Habilidades, Idiomas), pero como
// contenido real y editable en vez de placeholders entre corchetes (que se
// leen como "marcado de plantilla" y no como texto a sobrescribir). Vive
// como datos puros (sin depender de Tiptap en tiempo de ejecución) porque
// solo necesita ser un JSON válido para el esquema que ya usan los apuntes
// (crearExtensionesEsquema()), igual que PASOS_GUIA_CV en guia.ts.
export const PLANTILLA_CV_INICIAL: Json = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Tu nombre completo" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "tu.correo@pucp.edu.pe · +51 999 999 999 · Lima, Perú · linkedin.com/in/tu-perfil",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Perfil profesional" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Dos o tres líneas resumiendo quién eres, qué buscas y qué te diferencia. Escribe esto al final, cuando ya tengas el resto del CV listo.",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Educación" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          marks: [{ type: "bold" }],
          text: "Nombre de tu carrera",
        },
        { type: "text", text: " — Pontificia Universidad Católica del Perú" },
      ],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "2022 — actualidad" }],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Experiencia" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", marks: [{ type: "bold" }], text: "Puesto o rol" },
        { type: "text", text: " — Nombre de la organización" },
      ],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "Mes 2023 — Mes 2024" }],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Logro o responsabilidad concreta, con un verbo de acción y, si puedes, un número.",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", marks: [{ type: "bold" }], text: "Puesto o rol" },
        { type: "text", text: " — Nombre de la organización" },
      ],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "Mes 2022 — Mes 2023" }],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Logro o responsabilidad concreta, con un verbo de acción y, si puedes, un número.",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Habilidades" }],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Herramienta o habilidad técnica" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Otra herramienta o habilidad" }],
            },
          ],
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Idiomas" }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "Español (nativo), inglés (nivel)" }],
    },
  ],
};
