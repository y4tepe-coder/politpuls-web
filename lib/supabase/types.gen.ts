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
  public: {
    Tables: {
      decisions: {
        Row: {
          choice_id: string
          decided_at: string
          dossier_id: string
          id: string
          spektrum_after: Json
          spektrum_before: Json
          user_id: string
        }
        Insert: {
          choice_id: string
          decided_at?: string
          dossier_id: string
          id?: string
          spektrum_after: Json
          spektrum_before: Json
          user_id: string
        }
        Update: {
          choice_id?: string
          decided_at?: string
          dossier_id?: string
          id?: string
          spektrum_after?: Json
          spektrum_before?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      dossier_generation_log: {
        Row: {
          created_at: string
          dossier_id: string | null
          error: string | null
          finished_at: string | null
          id: string
          passes: Json
          started_at: string
          status: string
        }
        Insert: {
          created_at?: string
          dossier_id?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          passes?: Json
          started_at?: string
          status: string
        }
        Update: {
          created_at?: string
          dossier_id?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          passes?: Json
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossier_generation_log_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      dossiers: {
        Row: {
          balance_score: number | null
          body: Json
          choices: Json
          consequences: Json
          created_at: string
          deck: string | null
          factcheck_passed: boolean
          facts: Json
          generation_log_id: string | null
          glossar: Json
          headline: string
          id: string
          kicker: string | null
          model_version: string | null
          phase: string
          prompt_version: string | null
          publish_date: string
          published: boolean
          published_at: string | null
          slug: string
          sources: Json
          streitfrage: string | null
          topic_tags: string[]
        }
        Insert: {
          balance_score?: number | null
          body?: Json
          choices?: Json
          consequences?: Json
          created_at?: string
          deck?: string | null
          factcheck_passed?: boolean
          facts?: Json
          generation_log_id?: string | null
          glossar?: Json
          headline: string
          id?: string
          kicker?: string | null
          model_version?: string | null
          phase?: string
          prompt_version?: string | null
          publish_date: string
          published?: boolean
          published_at?: string | null
          slug: string
          sources?: Json
          streitfrage?: string | null
          topic_tags?: string[]
        }
        Update: {
          balance_score?: number | null
          body?: Json
          choices?: Json
          consequences?: Json
          created_at?: string
          deck?: string | null
          factcheck_passed?: boolean
          facts?: Json
          generation_log_id?: string | null
          glossar?: Json
          headline?: string
          id?: string
          kicker?: string | null
          model_version?: string | null
          phase?: string
          prompt_version?: string | null
          publish_date?: string
          published?: boolean
          published_at?: string | null
          slug?: string
          sources?: Json
          streitfrage?: string | null
          topic_tags?: string[]
        }
        Relationships: []
      }
      evergreen_dossiers: {
        Row: {
          body: Json
          choices: Json
          consequences: Json
          created_at: string
          deck: string | null
          facts: Json
          glossar: Json
          headline: string
          id: string
          kicker: string | null
          last_used_date: string | null
          slug: string
          sources: Json
          streitfrage: string | null
          topic_tags: string[]
        }
        Insert: {
          body?: Json
          choices?: Json
          consequences?: Json
          created_at?: string
          deck?: string | null
          facts?: Json
          glossar?: Json
          headline: string
          id?: string
          kicker?: string | null
          last_used_date?: string | null
          slug: string
          sources?: Json
          streitfrage?: string | null
          topic_tags?: string[]
        }
        Update: {
          body?: Json
          choices?: Json
          consequences?: Json
          created_at?: string
          deck?: string | null
          facts?: Json
          glossar?: Json
          headline?: string
          id?: string
          kicker?: string | null
          last_used_date?: string | null
          slug?: string
          sources?: Json
          streitfrage?: string | null
          topic_tags?: string[]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          current_streak: number
          difficulty: string
          display_name: string | null
          is_anonymous: boolean
          last_briefing_date: string | null
          longest_streak: number
          party_id: string | null
          role: string | null
          spektrum: Json
          spektrum_raw: Json
          streak_saves_left: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          current_streak?: number
          difficulty?: string
          display_name?: string | null
          is_anonymous?: boolean
          last_briefing_date?: string | null
          longest_streak?: number
          party_id?: string | null
          role?: string | null
          spektrum?: Json
          spektrum_raw?: Json
          streak_saves_left?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          current_streak?: number
          difficulty?: string
          display_name?: string | null
          is_anonymous?: boolean
          last_briefing_date?: string | null
          longest_streak?: number
          party_id?: string | null
          role?: string | null
          spektrum?: Json
          spektrum_raw?: Json
          streak_saves_left?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      streaks: {
        Row: {
          created_at: string
          date: string
          event: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          event: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          event?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
