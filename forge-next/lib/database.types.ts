/* AUTO-GENERATED — do not edit */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
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
          plan_id: string | null
          plan_version_id: string | null
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
      complete_profile_role: {
        Args: {
          target_full_name?: string
          target_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: undefined
      }
      get_coach_athletes: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: {
          athlete_id: string
          current_assignment_status: Database["public"]["Enums"]["assignment_status"]
          current_plan_id: string
          current_plan_name: string
          email: string
          full_name: string
          linked_at: string
          total_count: number
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
      accept_coach_link: {
        Args: { p_relationship_id: string }
        Returns: undefined
      }
      cancel_coach_link_request: {
        Args: { p_relationship_id: string }
        Returns: undefined
      }
      count_coach_pending_invites: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
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
          current_plan_id: string | null
          current_plan_name: string | null
          linked_at: string
          relationship_id: string
          status: Database["public"]["Enums"]["coach_link_status"]
        }[]
      }
      assign_plan_to_athletes: {
        Args: { p_athlete_ids: string[]; p_plan_id: string }
        Returns: undefined
      }
      delete_coach_plan: {
        Args: { p_plan_id: string }
        Returns: undefined
      }
      get_coach_plan_delete_info: {
        Args: { p_plan_id: string }
        Returns: {
          active_assignment_count: number
          plan_title: string | null
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
      reject_coach_link: {
        Args: { p_relationship_id: string }
        Returns: undefined
      }
      request_coach_link: {
        Args: { p_invite_code: string }
        Returns: string
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
