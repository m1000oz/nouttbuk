import type { Database } from "@/lib/types/database.types";

// Alias de conveniencia sobre los enums generados: database.types.ts se
// regenera con `npm run db:types` y no hay que tocarlo a mano, así que estos
// tipos viven aparte para no perderse en cada regeneración.
export type ApunteVisibilidad = Database["public"]["Enums"]["apunte_visibilidad"];
export type PermisoColaborador = Database["public"]["Enums"]["permiso_colaborador"];
