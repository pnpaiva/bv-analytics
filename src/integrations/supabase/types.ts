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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      agencies: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          organization_id: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agencies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_data: {
        Row: {
          analytics_metadata: Json | null
          campaign_id: string
          content_url: string | null
          created_at: string
          date_recorded: string
          engagement: number | null
          engagement_rate: number | null
          id: string
          platform: string
          updated_at: string
          views: number | null
        }
        Insert: {
          analytics_metadata?: Json | null
          campaign_id: string
          content_url?: string | null
          created_at?: string
          date_recorded?: string
          engagement?: number | null
          engagement_rate?: number | null
          id?: string
          platform: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          analytics_metadata?: Json | null
          campaign_id?: string
          content_url?: string | null
          created_at?: string
          date_recorded?: string
          engagement?: number | null
          engagement_rate?: number | null
          id?: string
          platform?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_data_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      api_credentials: {
        Row: {
          created_at: string
          credential_type: string
          encrypted_value: string | null
          expires_at: string | null
          id: string
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_type: string
          encrypted_value?: string | null
          expires_at?: string | null
          id?: string
          platform: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credential_type?: string
          encrypted_value?: string | null
          expires_at?: string | null
          id?: string
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string
          banner_image_url: string | null
          content: string
          created_at: string
          excerpt: string | null
          id: string
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          banner_image_url?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          banner_image_url?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaign_creators: {
        Row: {
          campaign_id: string
          content_urls: Json | null
          created_at: string
          creator_id: string
          id: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          content_urls?: Json | null
          created_at?: string
          creator_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          content_urls?: Json | null
          created_at?: string
          creator_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_campaign_creators_campaign"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_campaign_creators_creator"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_milestones: {
        Row: {
          achieved_at: string
          campaign_id: string
          created_at: string
          email_sent: boolean
          email_sent_at: string | null
          id: string
          milestone_views: number
        }
        Insert: {
          achieved_at?: string
          campaign_id: string
          created_at?: string
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          milestone_views: number
        }
        Update: {
          achieved_at?: string
          campaign_id?: string
          created_at?: string
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          milestone_views?: number
        }
        Relationships: []
      }
      campaign_refresh_logs: {
        Row: {
          campaign_results: Json
          completed_at: string | null
          created_at: string
          created_by: string | null
          failed_campaigns: number
          id: string
          started_at: string
          successful_campaigns: number
          total_campaigns: number
          trigger_type: string
          updated_at: string
        }
        Insert: {
          campaign_results?: Json
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          failed_campaigns?: number
          id?: string
          started_at?: string
          successful_campaigns?: number
          total_campaigns?: number
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          campaign_results?: Json
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          failed_campaigns?: number
          id?: string
          started_at?: string
          successful_campaigns?: number
          total_campaigns?: number
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaign_url_analytics: {
        Row: {
          analytics_metadata: Json | null
          campaign_id: string
          comments: number | null
          content_url: string
          created_at: string
          date_recorded: string
          engagement: number | null
          engagement_rate: number | null
          fetched_at: string
          id: string
          likes: number | null
          platform: string
          shares: number | null
          updated_at: string
          views: number | null
        }
        Insert: {
          analytics_metadata?: Json | null
          campaign_id: string
          comments?: number | null
          content_url: string
          created_at?: string
          date_recorded?: string
          engagement?: number | null
          engagement_rate?: number | null
          fetched_at?: string
          id?: string
          likes?: number | null
          platform: string
          shares?: number | null
          updated_at?: string
          views?: number | null
        }
        Update: {
          analytics_metadata?: Json | null
          campaign_id?: string
          comments?: number | null
          content_url?: string
          created_at?: string
          date_recorded?: string
          engagement?: number | null
          engagement_rate?: number | null
          fetched_at?: string
          id?: string
          likes?: number | null
          platform?: string
          shares?: number | null
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_url_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          airtable_id: string | null
          analytics_data: Json | null
          analytics_updated_at: string | null
          brand_name: string
          campaign_date: string
          campaign_month: string | null
          client_id: string | null
          client_name: string | null
          content_urls: Json | null
          created_at: string
          creator_id: string | null
          deal_value: number | null
          engagement_rate: number | null
          fixed_deal_value: number | null
          id: string
          logo_url: string | null
          master_campaign_end_date: string | null
          master_campaign_logo_url: string | null
          master_campaign_name: string | null
          master_campaign_start_date: string | null
          old_creator_id: string | null
          organization_id: string
          status: string
          total_engagement: number | null
          total_views: number | null
          updated_at: string
          user_id: string
          variable_deal_value: number | null
        }
        Insert: {
          airtable_id?: string | null
          analytics_data?: Json | null
          analytics_updated_at?: string | null
          brand_name: string
          campaign_date?: string
          campaign_month?: string | null
          client_id?: string | null
          client_name?: string | null
          content_urls?: Json | null
          created_at?: string
          creator_id?: string | null
          deal_value?: number | null
          engagement_rate?: number | null
          fixed_deal_value?: number | null
          id?: string
          logo_url?: string | null
          master_campaign_end_date?: string | null
          master_campaign_logo_url?: string | null
          master_campaign_name?: string | null
          master_campaign_start_date?: string | null
          old_creator_id?: string | null
          organization_id: string
          status?: string
          total_engagement?: number | null
          total_views?: number | null
          updated_at?: string
          user_id: string
          variable_deal_value?: number | null
        }
        Update: {
          airtable_id?: string | null
          analytics_data?: Json | null
          analytics_updated_at?: string | null
          brand_name?: string
          campaign_date?: string
          campaign_month?: string | null
          client_id?: string | null
          client_name?: string | null
          content_urls?: Json | null
          created_at?: string
          creator_id?: string | null
          deal_value?: number | null
          engagement_rate?: number | null
          fixed_deal_value?: number | null
          id?: string
          logo_url?: string | null
          master_campaign_end_date?: string | null
          master_campaign_logo_url?: string | null
          master_campaign_name?: string | null
          master_campaign_start_date?: string | null
          old_creator_id?: string | null
          organization_id?: string
          status?: string
          total_engagement?: number | null
          total_views?: number | null
          updated_at?: string
          user_id?: string
          variable_deal_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_campaign_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string
          campaign_id: string
          client_id: string
          id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by: string
          campaign_id: string
          client_id: string
          id?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string
          campaign_id?: string
          client_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_campaign_assignments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          organization_id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          organization_id: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          organization_id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          demographics: Json
          email: string | null
          id: string
          location: string | null
          name: string
          niche: string[] | null
          organization_id: string
          phone: string | null
          platform_handles: Json | null
          platform_metrics: Json | null
          services: Json
          top_videos: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          demographics?: Json
          email?: string | null
          id?: string
          location?: string | null
          name: string
          niche?: string[] | null
          organization_id: string
          phone?: string | null
          platform_handles?: Json | null
          platform_metrics?: Json | null
          services?: Json
          top_videos?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          demographics?: Json
          email?: string | null
          id?: string
          location?: string | null
          name?: string
          niche?: string[] | null
          organization_id?: string
          phone?: string | null
          platform_handles?: Json | null
          platform_metrics?: Json | null
          services?: Json
          top_videos?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creators_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_campaign_performance: {
        Row: {
          campaign_id: string
          created_at: string
          date_recorded: string
          engagement_rate: number | null
          id: string
          platform_breakdown: Json | null
          total_engagement: number | null
          total_views: number | null
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          date_recorded?: string
          engagement_rate?: number | null
          id?: string
          platform_breakdown?: Json | null
          total_engagement?: number | null
          total_views?: number | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          date_recorded?: string
          engagement_rate?: number | null
          id?: string
          platform_breakdown?: Json | null
          total_engagement?: number | null
          total_views?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          context: Json | null
          created_at: string
          error_message: string
          id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          error_message: string
          id?: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          error_message?: string
          id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          permissions: Json | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          permissions?: Json | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          settings: Json | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      public_media_kits: {
        Row: {
          avatar_url: string | null
          created_at: string
          creator_id: string | null
          id: string
          name: string
          platform_handles: Json | null
          published: boolean
          published_at: string | null
          slug: string
          stats: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          creator_id?: string | null
          id?: string
          name: string
          platform_handles?: Json | null
          published?: boolean
          published_at?: string | null
          slug: string
          stats?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          creator_id?: string | null
          id?: string
          name?: string
          platform_handles?: Json | null
          published?: boolean
          published_at?: string | null
          slug?: string
          stats?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      refresh_logs: {
        Row: {
          campaign_count: number | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          operation_type: string
          started_at: string | null
          status: string | null
        }
        Insert: {
          campaign_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          operation_type: string
          started_at?: string | null
          status?: string | null
        }
        Update: {
          campaign_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          operation_type?: string
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_view_only: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_view_only?: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_view_only?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string | null
          email: string
          id: string
          metadata: Json | null
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          metadata?: Json | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          metadata?: Json | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_organization: {
        Args: { org_id: string; user_id: string }
        Returns: boolean
      }
      generate_blog_slug: {
        Args: { title_text: string }
        Returns: string
      }
      get_campaign_timeline: {
        Args: { p_campaign_id: string; p_days_back?: number }
        Returns: {
          date_recorded: string
          engagement_rate: number
          platform_breakdown: Json
          total_engagement: number
          total_views: number
        }[]
      }
      get_campaign_url_analytics: {
        Args: {
          p_campaign_id: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: {
          avg_engagement_rate: number
          daily_data: Json
          latest_date: string
          platform: string
          total_engagement: number
          total_views: number
          url: string
        }[]
      }
      get_creator_collaborations: {
        Args: { p_creator_id: string }
        Returns: {
          brand_name: string
          campaign_date: string
          campaign_id: string
        }[]
      }
      get_user_organization: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_profile: {
        Args: { user_id: string }
        Returns: {
          bio: string
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }[]
      }
      has_organization_role: {
        Args: {
          check_role: Database["public"]["Enums"]["app_role"]
          org_id: string
          user_id: string
        }
        Returns: boolean
      }
      is_admin_user: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_master_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      publish_public_media_kit: {
        Args: { p_creator_id: string; p_user_id: string }
        Returns: {
          slug: string
        }[]
      }
      unaccent: {
        Args: { "": string }
        Returns: string
      }
      unaccent_init: {
        Args: { "": unknown }
        Returns: unknown
      }
      upsert_campaign_url_analytics: {
        Args: {
          p_analytics_metadata?: Json
          p_campaign_id: string
          p_comments?: number
          p_content_url: string
          p_date_recorded: string
          p_engagement?: number
          p_engagement_rate?: number
          p_likes?: number
          p_platform: string
          p_shares?: number
          p_views?: number
        }
        Returns: undefined
      }
      upsert_daily_campaign_performance: {
        Args: {
          p_campaign_id: string
          p_date_recorded: string
          p_engagement_rate?: number
          p_platform_breakdown?: Json
          p_total_engagement?: number
          p_total_views?: number
        }
        Returns: undefined
      }
      upsert_user_profile: {
        Args: { p_bio?: string; p_display_name?: string; p_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "client"
        | "master_admin"
        | "local_admin"
        | "local_client"
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
    Enums: {
      app_role: [
        "admin",
        "client",
        "master_admin",
        "local_admin",
        "local_client",
      ],
    },
  },
} as const
