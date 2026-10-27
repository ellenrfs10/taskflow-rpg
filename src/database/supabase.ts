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
    PostgrestVersion: "14.18"
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
      avatar: {
        Row: {
          category: string | null
          created_at: string
          id: number
          image_url: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: number
          image_url: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: number
          image_url?: string
          name?: string
        }
        Relationships: []
      }
      profile: {
        Row: {
          active: boolean | null
          coins: number | null
          created_at: string
          current_xp: number | null
          email: string
          id: string
          id_avatar: number | null
          id_role: number | null
          level: number | null
          max_xp: number | null
          name: string
          streak_days: number | null
        }
        Insert: {
          active?: boolean | null
          coins?: number | null
          created_at?: string
          current_xp?: number | null
          email: string
          id: string
          id_avatar?: number | null
          id_role?: number | null
          level?: number | null
          max_xp?: number | null
          name: string
          streak_days?: number | null
        }
        Update: {
          active?: boolean | null
          coins?: number | null
          created_at?: string
          current_xp?: number | null
          email?: string
          id?: string
          id_avatar?: number | null
          id_role?: number | null
          level?: number | null
          max_xp?: number | null
          name?: string
          streak_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profile_avatar"
            columns: ["id_avatar"]
            isOneToOne: false
            referencedRelation: "avatar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_profile_role"
            columns: ["id_role"]
            isOneToOne: false
            referencedRelation: "role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_id_avatar_fkey"
            columns: ["id_avatar"]
            isOneToOne: false
            referencedRelation: "avatar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_id_role_fkey"
            columns: ["id_role"]
            isOneToOne: false
            referencedRelation: "role"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          category: string | null
          cost: number
          created_at: string
          description: string
          icon: string | null
          id: number
          title: string
        }
        Insert: {
          category?: string | null
          cost: number
          created_at?: string
          description: string
          icon?: string | null
          id?: number
          title: string
        }
        Update: {
          category?: string | null
          cost?: number
          created_at?: string
          description?: string
          icon?: string | null
          id?: number
          title?: string
        }
        Relationships: []
      }
      role: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          category: string | null
          coin_reward: number | null
          completed: boolean | null
          created_at: string
          description: string | null
          due_date: string | null
          id: number
          is_cooperative: boolean | null
          participants: string[] | null
          profile_id: string | null
          title: string
          urgency: string | null
          xp_reward: number | null
        }
        Insert: {
          category?: string | null
          coin_reward?: number | null
          completed?: boolean | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: number
          is_cooperative?: boolean | null
          participants?: string[] | null
          profile_id?: string | null
          title: string
          urgency?: string | null
          xp_reward?: number | null
        }
        Update: {
          category?: string | null
          coin_reward?: number | null
          completed?: boolean | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: number
          is_cooperative?: boolean | null
          participants?: string[] | null
          profile_id?: string | null
          title?: string
          urgency?: string | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      user_rewards: {
        Row: {
          id: number
          profile_id: string
          redeemed_at: string
          reward_id: number
        }
        Insert: {
          id?: number
          profile_id: string
          redeemed_at?: string
          reward_id: number
        }
        Update: {
          id?: number
          profile_id?: string
          redeemed_at?: string
          reward_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_rewards_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
    Enums: {},
  },
} as const
