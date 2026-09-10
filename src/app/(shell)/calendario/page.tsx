import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { BloqueSheet } from "@/components/calendario/bloque-sheet";
import { CalendarioSemana } from "@/components/calendario/calendario-semana";
import { CompartirCalendarioSheet } from "@/components/calendario/compartir-calendario-sheet";
import { CruceCalendarios } from "@/components/calendario/cruce-calendarios";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  consultaBloquesDe,
  consultaCalendariosCompartidosConmigo,
  consultaConQuienComparto,
} from "@/lib/calendario/consultas";

export default async function CalendarioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?login=1");
  }

  const [{ data: perfil }, { data: compartidosConmigo }, { data: conQuienComparto }] =
    await Promise.all([
      supabase.from("profiles").select("nombre").eq("id", user.id).single(),
      consultaCalendariosCompartidosConmigo(supabase, user.id),
      consultaConQuienComparto(supabase, user.id),
    ]);

  const personasCompartidas = (compartidosConmigo ?? [])
    .filter((fila) => fila.propietario)
    .map((fila) => ({
      id: fila.propietario!.id,
      nombre: fila.propietario!.nombre,
    }));

  const idsCruce = [user.id, ...personasCompartidas.map((persona) => persona.id)];
  const { data: bloquesCruce } = await consultaBloquesDe(supabase, idsCruce);
  const bloquesPropios = (bloquesCruce ?? []).filter(
    (bloque) => bloque.perfil_id === user.id,
  );

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-6 md:gap-6 md:px-6 md:py-8 min-w-0">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Calendario</h1>
        <CompartirCalendarioSheet
          perfilId={user.id}
          conQuienComparto={conQuienComparto ?? []}
        />
      </div>

      <Tabs defaultValue="propio" className="flex flex-col gap-4 min-w-0">
        <TabsList className="w-full sm:w-auto grid grid-cols-2">
          <TabsTrigger value="propio">Mi calendario</TabsTrigger>
          <TabsTrigger value="cruce">Cruce de horarios</TabsTrigger>
        </TabsList>

        <TabsContent value="propio" className="flex flex-col gap-3 min-w-0">
          <div className="flex justify-end">
            <BloqueSheet perfilId={user.id} />
          </div>
          <CalendarioSemana bloques={bloquesPropios} perfilId={user.id} />
          <p className="text-xs text-muted-foreground">
            Pasa el cursor sobre un día para agregar un bloque, o toca uno
            existente para editarlo.
          </p>
        </TabsContent>

        <TabsContent value="cruce" className="flex flex-col gap-3 min-w-0">
          {personasCompartidas.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-muted/50 px-3 py-6 text-center text-sm text-muted-foreground">
              Todavía nadie compartió su calendario contigo. Pídeles a tus
              compañeros que lo hagan desde su propio &quot;Compartir mi
              calendario&quot; para ver en qué horarios pueden reunirse.
            </p>
          ) : (
            <CruceCalendarios
              personas={[
                { id: user.id, nombre: perfil?.nombre ?? "Yo" },
                ...personasCompartidas,
              ]}
              bloques={bloquesCruce ?? []}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
