export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      apuntes: {
        Row: {
          autor_id: string
          carpeta_id: string | null
          contenido: Json
          created_at: string
          curso_id: string | null
          etiquetas: string[]
          favorito: boolean
          id: string
          titulo: string
          updated_at: string
          visibilidad: Database["public"]["Enums"]["apunte_visibilidad"]
        }
        Insert: {
          autor_id: string
          carpeta_id?: string | null
          contenido?: Json
          created_at?: string
          curso_id?: string | null
          etiquetas?: string[]
          favorito?: boolean
          id?: string
          titulo: string
          updated_at?: string
          visibilidad?: Database["public"]["Enums"]["apunte_visibilidad"]
        }
        Update: {
          autor_id?: string
          carpeta_id?: string | null
          contenido?: Json
          created_at?: string
          curso_id?: string | null
          etiquetas?: string[]
          favorito?: boolean
          id?: string
          titulo?: string
          updated_at?: string
          visibilidad?: Database["public"]["Enums"]["apunte_visibilidad"]
        }
        Relationships: [
          {
            foreignKeyName: "apuntes_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apuntes_carpeta_id_fkey"
            columns: ["carpeta_id"]
            isOneToOne: false
            referencedRelation: "carpetas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apuntes_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      bloques_horario: {
        Row: {
          color: string
          created_at: string
          dia_semana: number
          hora_fin: string
          hora_inicio: string
          id: string
          perfil_id: string
          titulo: string
        }
        Insert: {
          color?: string
          created_at?: string
          dia_semana: number
          hora_fin: string
          hora_inicio: string
          id?: string
          perfil_id: string
          titulo: string
        }
        Update: {
          color?: string
          created_at?: string
          dia_semana?: number
          hora_fin?: string
          hora_inicio?: string
          id?: string
          perfil_id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "bloques_horario_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendario_colaboradores: {
        Row: {
          colaborador_id: string
          created_at: string
          propietario_id: string
        }
        Insert: {
          colaborador_id: string
          created_at?: string
          propietario_id: string
        }
        Update: {
          colaborador_id?: string
          created_at?: string
          propietario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendario_colaboradores_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendario_colaboradores_propietario_id_fkey"
            columns: ["propietario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      carpetas: {
        Row: {
          color: string
          created_at: string
          descripcion: string | null
          icono: string | null
          id: string
          nombre: string
          propietario_id: string
          updated_at: string
        }
        Insert: {
          color: string
          created_at?: string
          descripcion?: string | null
          icono?: string | null
          id?: string
          nombre: string
          propietario_id: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          descripcion?: string | null
          icono?: string | null
          id?: string
          nombre?: string
          propietario_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carpetas_propietario_id_fkey"
            columns: ["propietario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      carreras: {
        Row: {
          facultad: string
          id: string
          nombre: string
        }
        Insert: {
          facultad: string
          id?: string
          nombre: string
        }
        Update: {
          facultad?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      colaboradores: {
        Row: {
          apunte_id: string
          created_at: string
          perfil_id: string
          permiso: Database["public"]["Enums"]["permiso_colaborador"]
        }
        Insert: {
          apunte_id: string
          created_at?: string
          perfil_id: string
          permiso?: Database["public"]["Enums"]["permiso_colaborador"]
        }
        Update: {
          apunte_id?: string
          created_at?: string
          perfil_id?: string
          permiso?: Database["public"]["Enums"]["permiso_colaborador"]
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_apunte_id_fkey"
            columns: ["apunte_id"]
            isOneToOne: false
            referencedRelation: "apuntes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaboradores_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comentarios: {
        Row: {
          autor_id: string
          created_at: string
          id: string
          publicacion_id: string
          texto: string
        }
        Insert: {
          autor_id: string
          created_at?: string
          id?: string
          publicacion_id: string
          texto: string
        }
        Update: {
          autor_id?: string
          created_at?: string
          id?: string
          publicacion_id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos: {
        Row: {
          carrera_id: string
          id: string
          nombre: string
        }
        Insert: {
          carrera_id: string
          id?: string
          nombre: string
        }
        Update: {
          carrera_id?: string
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "cursos_carrera_id_fkey"
            columns: ["carrera_id"]
            isOneToOne: false
            referencedRelation: "carreras"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          autor_id: string
          created_at: string
          estado: Database["public"]["Enums"]["feedback_estado"]
          id: string
          texto: string
        }
        Insert: {
          autor_id: string
          created_at?: string
          estado?: Database["public"]["Enums"]["feedback_estado"]
          id?: string
          texto: string
        }
        Update: {
          autor_id?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["feedback_estado"]
          id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_votos: {
        Row: {
          created_at: string
          feedback_id: string
          id: string
          perfil_id: string
        }
        Insert: {
          created_at?: string
          feedback_id: string
          id?: string
          perfil_id: string
        }
        Update: {
          created_at?: string
          feedback_id?: string
          id?: string
          perfil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_votos_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_votos_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guardados: {
        Row: {
          created_at: string
          id: string
          perfil_id: string
          publicacion_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          perfil_id: string
          publicacion_id: string
        }
        Update: {
          created_at?: string
          id?: string
          perfil_id?: string
          publicacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardados_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardados_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          carrera_actualizada_en: string | null
          carrera_id: string | null
          created_at: string
          id: string
          nombre: string
          universidad: string
          updated_at: string
          usuario: string
          usuario_actualizado_en: string | null
        }
        Insert: {
          avatar_url?: string | null
          carrera_actualizada_en?: string | null
          carrera_id?: string | null
          created_at?: string
          id: string
          nombre: string
          universidad?: string
          updated_at?: string
          usuario: string
          usuario_actualizado_en?: string | null
        }
        Update: {
          avatar_url?: string | null
          carrera_actualizada_en?: string | null
          carrera_id?: string | null
          created_at?: string
          id?: string
          nombre?: string
          universidad?: string
          updated_at?: string
          usuario?: string
          usuario_actualizado_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_carrera_id_fkey"
            columns: ["carrera_id"]
            isOneToOne: false
            referencedRelation: "carreras"
            referencedColumns: ["id"]
          },
        ]
      }
      publicaciones: {
        Row: {
          apunte_id: string
          created_at: string
          id: string
        }
        Insert: {
          apunte_id: string
          created_at?: string
          id?: string
        }
        Update: {
          apunte_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publicaciones_apunte_id_fkey"
            columns: ["apunte_id"]
            isOneToOne: true
            referencedRelation: "apuntes"
            referencedColumns: ["id"]
          },
        ]
      }
      reacciones: {
        Row: {
          created_at: string
          id: string
          perfil_id: string
          publicacion_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          perfil_id: string
          publicacion_id: string
        }
        Update: {
          created_at?: string
          id?: string
          perfil_id?: string
          publicacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reacciones_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reacciones_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_perfil_stats: {
        Args: never
        Returns: {
          aportes: number
          apuntes: number
          contactos: number
        }[]
      }
      get_publicacion_counts: {
        Args: { publicacion_ids: string[] }
        Returns: {
          comentarios: number
          guardados: number
          publicacion_id: string
          reacciones: number
        }[]
      }
    }
    Enums: {
      apunte_visibilidad: "private" | "group" | "community"
      feedback_estado: "nueva" | "en_revision" | "hecho"
      permiso_colaborador: "read" | "edit"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      apunte_visibilidad: ["private", "group", "community"],
      feedback_estado: ["nueva", "en_revision", "hecho"],
      permiso_colaborador: ["read", "edit"],
    },
  },
} as const

