/* AUTO-GENERATED — do not edit */
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
      assigned_plans: {
        Row: {
          assigned_at: string
          athlete_id: string
          coach_id: string
          completed_at: string | null
          id: string
          plan_data: Json
          plan_id: string | null
          plan_version_id: string | null
          status: Database["public"]["Enums"]["assignment_status"]
          unassigned_at: string | null
        }
        Insert: {
          assigned_at?: string
          athlete_id: string
          coach_id: string
          completed_at?: string | null
          id?: string
          plan_data: Json
          plan_id?: string | null
          plan_version_id?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          unassigned_at?: string | null
        }
        Update: {
          assigned_at?: string
          athlete_id?: string
          coach_id?: string
          completed_at?: string | null
          id?: string
          plan_data?: Json
          plan_id?: string | null
          plan_version_id?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          unassigned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assigned_plans_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_plans_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assigned_plans_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_maxes: {
        Row: {
          athlete_id: string
          exercise_id: string
          id: string
          logged_at: string
          source: string
          unit: string
          value: number
        }
        Insert: {
          athlete_id: string
          exercise_id: string
          id?: string
          logged_at?: string
          source: string
          unit: string
          value: number
        }
        Update: {
          athlete_id?: string
          exercise_id?: string
          id?: string
          logged_at?: string
          source?: string
          unit?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "athlete_maxes_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_maxes_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          snapshot: Json
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          snapshot?: Json
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          snapshot?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_athletes: {
        Row: {
          athlete_id: string
          coach_id: string
          created_at: string
          id: string
          linked_at: string | null
          status: Database["public"]["Enums"]["coach_link_status"]
          unlinked_at: string | null
        }
        Insert: {
          athlete_id: string
          coach_id: string
          created_at?: string
          id?: string
          linked_at?: string | null
          status?: Database["public"]["Enums"]["coach_link_status"]
          unlinked_at?: string | null
        }
        Update: {
          athlete_id?: string
          coach_id?: string
          created_at?: string
          id?: string
          linked_at?: string | null
          status?: Database["public"]["Enums"]["coach_link_status"]
          unlinked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_athletes_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_athletes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_embeddings: {
        Row: {
          created_at: string
          embedding: string
          exercise_id: string
          source_text: string
        }
        Insert: {
          created_at?: string
          embedding: string
          exercise_id: string
          source_text: string
        }
        Update: {
          created_at?: string
          embedding?: string
          exercise_id?: string
          source_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_embeddings_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: true
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          id: string
          name: string
          normalized_name: string
          owner_coach_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          normalized_name: string
          owner_coach_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          normalized_name?: string
          owner_coach_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_owner_coach_id_fkey"
            columns: ["owner_coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_versions: {
        Row: {
          change_summary: string | null
          created_at: string
          created_by: string
          id: string
          plan_data: Json
          plan_id: string
        }
        Insert: {
          change_summary?: string | null
          created_at?: string
          created_by: string
          id?: string
          plan_data: Json
          plan_id: string
        }
        Update: {
          change_summary?: string | null
          created_at?: string
          created_by?: string
          id?: string
          plan_data?: Json
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_versions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active_version_id: string | null
          coach_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          active_version_id?: string | null
          coach_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          active_version_id?: string | null
          coach_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_active_version_id_fkey"
            columns: ["active_version_id"]
            isOneToOne: false
            referencedRelation: "plan_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          contact_info: Json
          created_at: string
          deleted_at: string | null
          full_name: string | null
          id: string
          invite_code: string | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          contact_info?: Json
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          id: string
          invite_code?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          contact_info?: Json
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          id?: string
          invite_code?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_coach_link: {
        Args: { p_relationship_id: string }
        Returns: undefined
      }
      assign_plan_to_athletes: {
        Args: { p_athlete_ids: string[]; p_plan_id: string }
        Returns: undefined
      }
      cancel_coach_link_request: {
        Args: { p_relationship_id: string }
        Returns: undefined
      }
      complete_profile_role: {
        Args: {
          target_full_name?: string
          target_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: undefined
      }
      count_coach_pending_invites: { Args: never; Returns: number }
      create_coach_plan: {
        Args: { p_change_summary?: string; p_plan_data: Json }
        Returns: {
          plan_id: string
          version_id: string
        }[]
      }
      delete_athlete_max: { Args: { p_max_id: string }; Returns: undefined }
      delete_coach_plan: { Args: { p_plan_id: string }; Returns: undefined }
      get_athlete_coach_link: {
        Args: never
        Returns: {
          coach_id: string
          coach_name: string
          linked_at: string
          relationship_id: string
          requested_at: string
          status: Database["public"]["Enums"]["coach_link_status"]
        }[]
      }
      get_coach_athlete_relationship: {
        Args: { p_athlete_id: string }
        Returns: {
          athlete_email: string
          athlete_id: string
          athlete_name: string
          current_plan_id: string
          current_plan_name: string
          linked_at: string
          relationship_id: string
          status: Database["public"]["Enums"]["coach_link_status"]
        }[]
      }
      get_coach_athletes: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: {
          athlete_id: string
          completion_percent: number
          current_assignment_status: Database["public"]["Enums"]["assignment_status"]
          current_plan_id: string
          current_plan_name: string
          email: string
          full_name: string
          linked_at: string
          total_count: number
        }[]
      }
      get_coach_pending_invites: {
        Args: never
        Returns: {
          athlete_email: string
          athlete_id: string
          athlete_name: string
          relationship_id: string
          requested_at: string
        }[]
      }
      get_coach_plan_delete_info: {
        Args: { p_plan_id: string }
        Returns: {
          active_assignment_count: number
          plan_title: string
        }[]
      }
      get_coach_plans: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: {
          created_at: string
          plan_id: string
          title: string
          total_count: number
          week_count: number
        }[]
      }
      insert_athlete_max: {
        Args: {
          p_athlete_id: string
          p_exercise_id: string
          p_source: string
          p_unit: string
          p_value: number
        }
        Returns: {
          athlete_id: string
          exercise_id: string
          id: string
          logged_at: string
          source: string
          unit: string
          value: number
        }
        SetofOptions: {
          from: "*"
          to: "athlete_maxes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      list_athlete_maxes: {
        Args: { p_athlete_id: string; p_exercise_ids?: string[] }
        Returns: {
          athlete_id: string
          exercise_id: string
          id: string
          logged_at: string
          source: string
          unit: string
          value: number
        }[]
      }
      list_coach_plan_versions: {
        Args: { p_plan_id: string }
        Returns: {
          change_summary: string
          created_at: string
          created_by: string
          is_active: boolean
          version_id: string
        }[]
      }
      normalize_invite_code: { Args: { p_code: string }; Returns: string }
      reject_coach_link: {
        Args: { p_relationship_id: string }
        Returns: undefined
      }
      request_coach_link: { Args: { p_invite_code: string }; Returns: string }
      save_coach_plan_version: {
        Args: {
          p_change_summary?: string
          p_plan_data: Json
          p_plan_id: string
        }
        Returns: {
          version_id: string
        }[]
      }
      search_exercises: {
        Args: { p_coach_id: string; p_embedding: string; p_limit?: number }
        Returns: {
          id: string
          name: string
          owner_coach_id: string
          score: number
        }[]
      }
      unlink_coach_athlete: {
        Args: { p_relationship_id: string }
        Returns: undefined
      }
    }
    Enums: {
      assignment_status: "active" | "completed" | "unassigned"
      coach_link_status: "pending" | "active"
      user_role: "coach" | "athlete"
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
      assignment_status: ["active", "completed", "unassigned"],
      coach_link_status: ["pending", "active"],
      user_role: ["coach", "athlete"],
    },
  },
} as const
