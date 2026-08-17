// Generado a mano como placeholder temporal, porque este entorno todavía no
// tiene Docker para correr `supabase start`. En cuanto el stack local esté
// arriba, regenerar con:
//   npx supabase gen types typescript --local > src/lib/types/database.types.ts
// y borrar este comentario. No editar los tipos de tabla a mano después de
// esa primera generación real.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ApunteVisibilidad = "private" | "group" | "community";
export type PermisoColaborador = "read" | "edit";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nombre: string;
          usuario: string;
          carrera: string | null;
          universidad: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nombre: string;
          usuario: string;
          carrera?: string | null;
          universidad?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      carpetas: {
        Row: {
          id: string;
          nombre: string;
          color: string;
          icono: string | null;
          descripcion: string | null;
          propietario_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          color: string;
          icono?: string | null;
          descripcion?: string | null;
          propietario_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["carpetas"]["Insert"]>;
        Relationships: [];
      };
      apuntes: {
        Row: {
          id: string;
          titulo: string;
          contenido: Json;
          etiquetas: string[];
          carpeta_id: string | null;
          autor_id: string;
          favorito: boolean;
          visibilidad: ApunteVisibilidad;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          titulo: string;
          contenido?: Json;
          etiquetas?: string[];
          carpeta_id?: string | null;
          autor_id: string;
          favorito?: boolean;
          visibilidad?: ApunteVisibilidad;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["apuntes"]["Insert"]>;
        Relationships: [];
      };
      publicaciones: {
        Row: {
          id: string;
          apunte_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          apunte_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["publicaciones"]["Insert"]>;
        Relationships: [];
      };
      reacciones: {
        Row: {
          id: string;
          publicacion_id: string;
          perfil_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          publicacion_id: string;
          perfil_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reacciones"]["Insert"]>;
        Relationships: [];
      };
      guardados: {
        Row: {
          id: string;
          publicacion_id: string;
          perfil_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          publicacion_id: string;
          perfil_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["guardados"]["Insert"]>;
        Relationships: [];
      };
      comentarios: {
        Row: {
          id: string;
          publicacion_id: string;
          autor_id: string;
          texto: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          publicacion_id: string;
          autor_id: string;
          texto: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["comentarios"]["Insert"]>;
        Relationships: [];
      };
      colaboradores: {
        Row: {
          apunte_id: string;
          perfil_id: string;
          permiso: PermisoColaborador;
          created_at: string;
        };
        Insert: {
          apunte_id: string;
          perfil_id: string;
          permiso?: PermisoColaborador;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["colaboradores"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
