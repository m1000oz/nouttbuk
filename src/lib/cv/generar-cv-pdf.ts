import { jsPDF } from "jspdf";

// Genera el PDF-esqueleto de CV enteramente en el navegador (jsPDF dibuja
// texto vectorial real, no una captura de pantalla, así el resultado se
// puede seleccionar/copiar), evitando depender de un servicio externo o de
// un binario del sistema (wkhtmltopdf/LibreOffice/Chrome headless, ninguno
// disponible en este entorno) solo para convertir una plantilla a PDF.
// Colores tomados de --primary/--color-folder-cyan de globals.css, no
// inventados para esta pieza.
const INDIGO: [number, number, number] = [79, 70, 229];
const SLATE_700: [number, number, number] = [51, 65, 85];
const SLATE_400: [number, number, number] = [148, 163, 184];

const MARGEN_X = 20;
const ANCHO_PAGINA = 210;
const ANCHO_CONTENIDO = ANCHO_PAGINA - MARGEN_X * 2;

export function generarPlantillaCvPdf(): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 22;

  function encabezadoSeccion(titulo: string) {
    y += 3;
    doc.setFillColor(...INDIGO);
    doc.rect(MARGEN_X, y - 3.5, 2.2, 5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...INDIGO);
    doc.text(titulo.toUpperCase(), MARGEN_X + 5, y);
    y += 5;
  }

  // Línea de "completa esto": una guía en itálica gris + una regla en blanco
  // debajo para escribir a mano si se imprime, o simplemente como referencia
  // visual de cuánto espacio ocupa ese campo si se edita en un editor de PDF.
  function campoAcompletar(guia: string, alturaLinea = 6) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...SLATE_400);
    doc.text(guia, MARGEN_X, y);
    y += alturaLinea;
  }

  function parrafoGuia(texto: string) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...SLATE_700);
    const lineas = doc.splitTextToSize(texto, ANCHO_CONTENIDO);
    doc.text(lineas, MARGEN_X, y);
    y += lineas.length * 4.6 + 2;
  }

  function lineaDivisoria() {
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGEN_X, y, ANCHO_PAGINA - MARGEN_X, y);
    y += 6;
  }

  // --- Encabezado ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...SLATE_700);
  doc.text("[Tu Nombre Completo]", MARGEN_X, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...SLATE_400);
  doc.text(
    "[correo@pucp.edu.pe]  |  [+51 999 999 999]  |  [linkedin.com/in/tu-usuario]  |  [Lima, Perú]",
    MARGEN_X,
    y,
  );
  y += 8;
  lineaDivisoria();

  // --- Perfil profesional ---
  encabezadoSeccion("Perfil profesional");
  parrafoGuia(
    "2-3 líneas: quién eres, tu carrera/año, y qué buscas (práctica, primer empleo). " +
      "Adapta esto a cada postulación con el prompt 1 de la guía, no uses el mismo texto para todo.",
  );
  campoAcompletar("[Escribe aquí tu resumen profesional...]", 10);

  // --- Educación ---
  encabezadoSeccion("Educación");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...SLATE_700);
  doc.text("[Nombre de tu carrera]", MARGEN_X, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...SLATE_400);
  doc.text("[2023 - presente]", ANCHO_PAGINA - MARGEN_X, y, { align: "right" });
  y += 5;
  campoAcompletar("Pontificia Universidad Católica del Perú, [Promedio ponderado, si suma]");
  y += 2;

  // --- Experiencia ---
  encabezadoSeccion("Experiencia");
  parrafoGuia(
    "Un bloque por experiencia (trabajo, práctica, proyecto de curso relevante, voluntariado). " +
      "Usa el prompt 2 de la guía para convertir tareas sueltas en logros con resultados medibles.",
  );
  for (let i = 0; i < 2; i++) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...SLATE_700);
    doc.text("[Puesto o rol]", MARGEN_X, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SLATE_400);
    doc.text("[Mes año - Mes año]", ANCHO_PAGINA - MARGEN_X, y, { align: "right" });
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...SLATE_400);
    doc.text("[Organización o empresa]", MARGEN_X, y);
    y += 5;
    campoAcompletar("• [Logro o responsabilidad, con un número o resultado si es posible]");
    campoAcompletar("• [Segundo logro o responsabilidad]");
    y += 2;
  }

  // --- Habilidades e idiomas ---
  encabezadoSeccion("Habilidades");
  parrafoGuia(
    "Lista corta y específica (herramientas, lenguajes, software), no adjetivos genéricos como " +
      '"proactivo". Usa el prompt 3 de la guía para elegir cuáles poner según la oferta.',
  );
  campoAcompletar("[Habilidad], [Habilidad], [Habilidad], [Habilidad], [Habilidad]", 10);

  encabezadoSeccion("Idiomas");
  campoAcompletar("[Idioma], [Nivel, ej. Avanzado B2]", 10);

  // --- Pie ---
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...SLATE_400);
  doc.text(
    "Plantilla generada por Nouttbuk, ver la guía completa en la sección CV para los prompts mencionados arriba.",
    MARGEN_X,
    287,
  );

  doc.save("plantilla-cv-nouttbuk.pdf");
}
