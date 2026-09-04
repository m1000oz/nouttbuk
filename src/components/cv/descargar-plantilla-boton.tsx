"use client";

import { useState } from "react";
import { DownloadSimpleIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

// El PDF se genera enteramente en el navegador (ver src/lib/cv/generar-cv-pdf.ts)
// al hacer click, no hay archivo estático que mantener ni backend involucrado.
// jsPDF es una dependencia pesada (~350KB) para dibujar texto vectorial, así
// que se importa dinámicamente y solo corre cuando la persona realmente pide
// el PDF, no en cada carga de /cv.
export function DescargarPlantillaBoton() {
  const [generando, setGenerando] = useState(false);

  async function handleDescargar() {
    setGenerando(true);
    try {
      const { generarPlantillaCvPdf } = await import("@/lib/cv/generar-cv-pdf");
      generarPlantillaCvPdf();
    } catch {
      toast.add({
        title: "No se pudo generar la plantilla. Intenta de nuevo.",
        type: "error",
      });
    } finally {
      setGenerando(false);
    }
  }

  return (
    <Button type="button" onClick={handleDescargar} loading={generando}>
      <DownloadSimpleIcon aria-hidden />
      Descargar plantilla en PDF
    </Button>
  );
}
