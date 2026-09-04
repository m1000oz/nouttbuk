import { redirect } from "next/navigation";

import { DescargarPlantillaBoton } from "@/components/cv/descargar-plantilla-boton";
import { PromptCard } from "@/components/cv/prompt-card";
import { createClient } from "@/lib/supabase/server";
import { PASOS_GUIA_CV, SITUACION_SIN_EXPERIENCIA } from "@/lib/cv/guia";

export default async function CvPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?login=1");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">
          Arma tu CV con ayuda de IA
        </h1>
        <p className="text-sm text-muted-foreground">
          Una guía paso a paso con prompts listos para pegar en ChatGPT,
          Gemini o Claude, más una plantilla en PDF para empezar desde una
          base ordenada.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-foreground">
            ¿Prefieres empezar por la plantilla?
          </h2>
          <p className="text-sm text-muted-foreground">
            Un esqueleto de una página con las secciones y el formato ya
            armados, para completar o pegar en tu editor de preferencia.
          </p>
        </div>
        <DescargarPlantillaBoton />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-foreground">
          Guía paso a paso
        </h2>
        {PASOS_GUIA_CV.map((paso) => (
          <PromptCard key={paso.numero} paso={paso} />
        ))}
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-muted/50 p-4">
        <h2 className="font-semibold text-foreground">
          {SITUACION_SIN_EXPERIENCIA.titulo}
        </h2>
        <p className="text-sm text-muted-foreground">
          {SITUACION_SIN_EXPERIENCIA.texto}
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
        <h2 className="font-semibold text-foreground">
          Antes de enviar tu CV, revisa que...
        </h2>
        <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <li>• No pase de una página (dos como máximo si ya tienes bastante experiencia).</li>
          <li>• Cada verbo de acción sea distinto, no repitas &quot;encargado de&quot; en cada línea.</li>
          <li>• Los tiempos verbales sean correctos: pasado para lo terminado, presente para lo actual.</li>
          <li>• El nombre del archivo sea claro, por ejemplo &quot;CV-Nombre-Apellido.pdf&quot;, no &quot;final2-v3.pdf&quot;.</li>
          <li>• Lo hayas adaptado a esta postulación específica con el Paso 3, no reenvíes siempre el mismo.</li>
        </ul>
      </div>
    </div>
  );
}
