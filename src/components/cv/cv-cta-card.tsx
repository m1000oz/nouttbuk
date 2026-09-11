import Link from "next/link";
import { FileTextIcon } from "@phosphor-icons/react/dist/ssr";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fechaRelativa } from "@/lib/fecha/relativa";

type CvCtaCardProps = {
  actualizadoEn: string | null;
};

// Reemplaza la tarjeta de "descargar plantilla" (jsPDF, siempre el mismo
// esqueleto vacío desconectado de la persona) por el punto de entrada al
// documento real y editable en /cv/editar (ver cv-editor.tsx). El copy del
// botón varía según si ya existe una fila en la tabla `cv`: "Empezar" para
// quien nunca lo abrió, "Continuar" con la fecha de la última edición para
// quien ya tiene contenido propio.
export function CvCtaCard({ actualizadoEn }: CvCtaCardProps) {
  const tieneCv = Boolean(actualizadoEn);

  return (
    <Card className="border border-primary/30 bg-primary/5 shadow-[var(--shadow-card)] ring-0">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <FileTextIcon className="size-5" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">Tu CV</CardTitle>
            <p className="text-sm text-muted-foreground">
              {tieneCv
                ? `Última edición: ${fechaRelativa(actualizadoEn!)}.`
                : "Una plantilla ya estructurada, para completar directamente en la app."}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          nativeButton={false}
          render={<Link href="/cv/editar" />}
        >
          {tieneCv ? "Continuar editando mi CV" : "Empezar mi CV"}
        </Button>
      </CardContent>
    </Card>
  );
}
