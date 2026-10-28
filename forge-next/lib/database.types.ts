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
          plan_data: NonNullable<Json>
          plan_id: string | null
          plan_version_id: string | null
          status: Database["public"]["Enums"]["assignment_status"]
          unassigned_at: string | null
        }
        ComputedFields: never
        Insert: {
          assigned_at?: string
          athlete_id: string
          coach_id: string
          completed_at?: string | null
          id?: string
          plan_data: NonNullable<Json>
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
          plan_data?: NonNullable<Json>
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
          entry_order: number
          exercise_id: string
          id: string
          logged_at: string
          source: string
          source_assignment_id: string | null
          source_set_key: string | null
          unit: string
          value: number
          voided_at: string | null
        }
        ComputedFields: never
        Insert: {
          athlete_id: string
          entry_order?: never
          exercise_id: string
          id?: string
          logged_at?: string
          source: string
          source_assignment_id?: string | null
          source_set_key?: string | null
          unit: string
          value: number
          voided_at?: string | null
        }
        Update: {
          athlete_id?: string
          entry_order?: never
          exercise_id?: string
          id?: string
          logged_at?: string
          source?: string
          source_assignment_id?: string | null
          source_set_key?: string | null
          unit?: string
          value?: number
          voided_at?: string | null
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
          snapshot: NonNullable<Json>
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          snapshot?: NonNullable<Json>
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          snapshot?: NonNullable<Json>
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
        ComputedFields: never
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
        ComputedFields: never
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
          archived_at: string | null
          created_at: string
          id: string
          name: string
          normalized_name: string
          owner_coach_id: string | null
          template_exercise_id: string | null
          video_url: string | null
        }
        ComputedFields: never
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name: string
          normalized_name: string
          owner_coach_id?: string | null
          template_exercise_id?: string | null
          video_url?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name?: string
          normalized_name?: string
          owner_coach_id?: string | null
          template_exercise_id?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_owner_coach_id_fkey"
            columns: ["owner_coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_template_exercise_id_fkey"
            columns: ["template_exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
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
          plan_data: NonNullable<Json>
          plan_id: string
        }
        ComputedFields: never
        Insert: {
          change_summary?: string | null
          created_at?: string
          created_by: string
          id?: string
          plan_data: NonNullable<Json>
          plan_id: string
        }
        Update: {
          change_summary?: string | null
          created_at?: string
          created_by?: string
          id?: string
          plan_data?: NonNullable<Json>
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
        ComputedFields: never
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
          contact_info: NonNullable<Json>
          created_at: string
          deleted_at: string | null
          full_name: string | null
          id: string
          invite_code: string | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        ComputedFields: never
        Insert: {
          contact_info?: NonNullable<Json>
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          id: string
          invite_code?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          contact_info?: NonNullable<Json>
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
      claim_coach_exercise: {
        Args: { p_exercise_id?: string; p_name?: string }
        Returns: {
          archived_at: string | null
          created_at: string
          id: string
          name: string
          normalized_name: string
          owner_coach_id: string | null
          template_exercise_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "exercises"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      coach_exercise_usage: { Args: { p_exercise_id: string }; Returns: Json }
      complete_profile_role: {
        Args: {
          target_full_name?: string
          target_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: undefined
      }
      complete_workout_day: {
        Args: { p_assignment_id: string; p_day_pos: number; p_week_pos: number }
        Returns: Json
      }
      count_coach_pending_invites: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_coach_plan: {
        Args: { p_change_summary?: string; p_plan_data: Json }
        Returns: {
          plan_id: string
          version_id: string
        }[]
      }
      delete_coach_plan: { Args: { p_plan_id: string }; Returns: undefined }
      get_athlete_coach_link: {
        Args: Record<PropertyKey, never>
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
        Args: Record<PropertyKey, never>
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
          entry_order: number
          exercise_id: string
          id: string
          logged_at: string
          source: string
          source_assignment_id: string | null
          source_set_key: string | null
          unit: string
          value: number
          voided_at: string | null
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
          entry_order: number
          exercise_id: string
          id: string
          logged_at: string
          source: string
          source_assignment_id: string | null
          source_set_key: string | null
          unit: string
          value: number
          voided_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "athlete_maxes"
          isOneToOne: false
          isSetofReturn: true
        }
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
      manage_coach_exercise: {
        Args: {
          p_archive?: boolean
          p_exercise_id: string
          p_name?: string
          p_replacement_id?: string
        }
        Returns: undefined
      }
      normalize_invite_code: { Args: { p_code: string }; Returns: string }
      plan_uses_exercise: {
        Args: { p_id: string; p_plan: Json }
        Returns: boolean
      }
      reject_coach_link: {
        Args: { p_relationship_id: string }
        Returns: undefined
      }
      replace_plan_exercise: {
        Args: {
          p_name: string
          p_new: string
          p_old: string
          p_plan: Json
          p_preserve_logged: boolean
        }
        Returns: Json
      }
      request_coach_link: { Args: { p_invite_code: string }; Returns: string }
      rewrite_coach_exercise_references: {
        Args: { p_coach: string; p_name: string; p_new: string; p_old: string }
        Returns: undefined
      }
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
      save_workout_set_actuals: {
        Args: {
          p_actual: Json
          p_assignment_id: string
          p_day_pos: number
          p_exercise_pos: number
          p_expected_catalog_id: string
          p_expected_exercise_id: string
          p_expected_set_id: string
          p_set_pos: number
          p_week_pos: number
        }
        Returns: boolean
      }
      search_coach_exercises: {
        Args: {
          p_coach_id: string
          p_include_templates?: boolean
          p_limit?: number
          p_query: string
        }
        Returns: {
          id: string
          name: string
        }[]
      }
      set_coach_exercise_video: {
        Args: { p_exercise_id: string; p_video_url: string }
        Returns: undefined
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
