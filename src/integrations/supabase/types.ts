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
      analytics_data: {
        Row: {
          campaign_id: string
          comments: number | null
          content_url: string
          created_at: string
          engagement: number | null
          engagement_rate: number | null
          fetched_at: string
          id: string
          likes: number | null
          platform: string
          sentiment_label: string | null
          sentiment_score: number | null
          shares: number | null
          updated_at: string
          views: number | null
        }
        Insert: {
          campaign_id: string
          comments?: number | null
          content_url: string
          created_at?: string
          engagement?: number | null
          engagement_rate?: number | null
          fetched_at?: string
          id?: string
          likes?: number | null
          platform: string
          sentiment_label?: string | null
          sentiment_score?: number | null
          shares?: number | null
          updated_at?: string
          views?: number | null
        }
        Update: {
          campaign_id?: string
          comments?: number | null
          content_url?: string
          created_at?: string
          engagement?: number | null
          engagement_rate?: number | null
          fetched_at?: string
          id?: string
          likes?: number | null
          platform?: string
          sentiment_label?: string | null
          sentiment_score?: number | null
          shares?: number | null
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
          {
            foreignKeyName: "analytics_data_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "dashboard_analytics"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "analytics_data_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "public_collaborations"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_jobs: {
        Row: {
          campaign_id: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          platform: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          platform: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          platform?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_jobs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_jobs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "dashboard_analytics"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "analytics_jobs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "public_collaborations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_cache: {
        Row: {
          cache_key: string
          created_at: string
          expires_at: string
          id: string
          platform: string
          response_data: Json
        }
        Insert: {
          cache_key: string
          created_at?: string
          expires_at: string
          id?: string
          platform: string
          response_data: Json
        }
        Update: {
          cache_key?: string
          created_at?: string
          expires_at?: string
          id?: string
          platform?: string
          response_data?: Json
        }
        Relationships: []
      }
      api_credentials: {
        Row: {
          created_at: string
          credential_type: string
          encrypted_value: string
          expires_at: string | null
          id: string
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_type: string
          encrypted_value: string
          expires_at?: string | null
          id?: string
          platform: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credential_type?: string
          encrypted_value?: string
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
            foreignKeyName: "fk_campaign_creators_campaign"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "dashboard_analytics"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "fk_campaign_creators_campaign"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "public_collaborations"
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
          {
            foreignKeyName: "campaign_url_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "dashboard_analytics"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_url_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "public_collaborations"
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
          is_master_campaign_template: boolean | null
          logo_url: string | null
          master_campaign_end_date: string | null
          master_campaign_id: string | null
          master_campaign_logo_url: string | null
          master_campaign_name: string | null
          master_campaign_start_date: string | null
          status: string | null
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
          campaign_date: string
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
          is_master_campaign_template?: boolean | null
          logo_url?: string | null
          master_campaign_end_date?: string | null
          master_campaign_id?: string | null
          master_campaign_logo_url?: string | null
          master_campaign_name?: string | null
          master_campaign_start_date?: string | null
          status?: string | null
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
          is_master_campaign_template?: boolean | null
          logo_url?: string | null
          master_campaign_end_date?: string | null
          master_campaign_id?: string | null
          master_campaign_logo_url?: string | null
          master_campaign_name?: string | null
          master_campaign_start_date?: string | null
          status?: string | null
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
            foreignKeyName: "campaigns_master_campaign_id_fkey"
            columns: ["master_campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_master_campaign_id_fkey"
            columns: ["master_campaign_id"]
            isOneToOne: false
            referencedRelation: "dashboard_analytics"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaigns_master_campaign_id_fkey"
            columns: ["master_campaign_id"]
            isOneToOne: false
            referencedRelation: "public_collaborations"
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
          {
            foreignKeyName: "client_campaign_assignments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "dashboard_analytics"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "client_campaign_assignments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "public_collaborations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      creator_analytics: {
        Row: {
          created_at: string
          creator_roster_id: string
          date_recorded: string | null
          fetched_at: string
          id: string
          metric_type: string
          metric_value: number
          platform: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_roster_id: string
          date_recorded?: string | null
          fetched_at?: string
          id?: string
          metric_type: string
          metric_value?: number
          platform: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_roster_id?: string
          date_recorded?: string | null
          fetched_at?: string
          id?: string
          metric_type?: string
          metric_value?: number
          platform?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_analytics_creator_roster_id_fkey"
            columns: ["creator_roster_id"]
            isOneToOne: false
            referencedRelation: "creator_roster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_analytics_creator_roster_id_fkey"
            columns: ["creator_roster_id"]
            isOneToOne: false
            referencedRelation: "roster_analytics_summary"
            referencedColumns: ["creator_roster_id"]
          },
        ]
      }
      creator_roster: {
        Row: {
          channel_links: Json | null
          channel_stats: Json | null
          created_at: string
          creator_name: string
          id: string
          last_updated: string | null
          social_media_handles: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_links?: Json | null
          channel_stats?: Json | null
          created_at?: string
          creator_name: string
          id?: string
          last_updated?: string | null
          social_media_handles?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_links?: Json | null
          channel_stats?: Json | null
          created_at?: string
          creator_name?: string
          id?: string
          last_updated?: string | null
          social_media_handles?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          phone?: string | null
          platform_handles?: Json | null
          platform_metrics?: Json | null
          services?: Json
          top_videos?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          created_at: string | null
          error_message: string
          id: number
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          error_message: string
          id?: number
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          error_message?: string
          id?: number
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
          bio: string | null
          created_at: string
          creator_id: string | null
          demographics: Json | null
          id: string
          location: string | null
          name: string
          platform_handles: Json | null
          platform_metrics: Json | null
          published: boolean
          published_at: string | null
          services: Json | null
          slug: string
          stats: Json | null
          top_videos: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          creator_id?: string | null
          demographics?: Json | null
          id?: string
          location?: string | null
          name: string
          platform_handles?: Json | null
          platform_metrics?: Json | null
          published?: boolean
          published_at?: string | null
          services?: Json | null
          slug: string
          stats?: Json | null
          top_videos?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          creator_id?: string | null
          demographics?: Json | null
          id?: string
          location?: string | null
          name?: string
          platform_handles?: Json | null
          platform_metrics?: Json | null
          published?: boolean
          published_at?: string | null
          services?: Json | null
          slug?: string
          stats?: Json | null
          top_videos?: Json | null
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
      roster_analytics: {
        Row: {
          created_at: string
          fetched_at: string
          id: string
          metric_type: string
          metric_value: number | null
          platform: string
          roster_id: string
        }
        Insert: {
          created_at?: string
          fetched_at?: string
          id?: string
          metric_type: string
          metric_value?: number | null
          platform: string
          roster_id: string
        }
        Update: {
          created_at?: string
          fetched_at?: string
          id?: string
          metric_type?: string
          metric_value?: number | null
          platform?: string
          roster_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_analytics_roster_id_fkey"
            columns: ["roster_id"]
            isOneToOne: false
            referencedRelation: "creator_roster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_analytics_roster_id_fkey"
            columns: ["roster_id"]
            isOneToOne: false
            referencedRelation: "roster_analytics_summary"
            referencedColumns: ["creator_roster_id"]
          },
        ]
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
      youtube_analytics: {
        Row: {
          channel_handle: string | null
          channel_id: string | null
          channel_name: string | null
          comments: number | null
          created_at: string
          creator_roster_id: string
          daily_comments: number | null
          daily_likes: number | null
          daily_subscribers: number | null
          daily_views: number | null
          date_recorded: string | null
          engagement_rate: number | null
          fetched_at: string
          id: string
          likes: number | null
          published_at: string | null
          subscribers: number | null
          title: string | null
          updated_at: string
          video_id: string | null
          views: number | null
          watch_time_hours: number | null
        }
        Insert: {
          channel_handle?: string | null
          channel_id?: string | null
          channel_name?: string | null
          comments?: number | null
          created_at?: string
          creator_roster_id: string
          daily_comments?: number | null
          daily_likes?: number | null
          daily_subscribers?: number | null
          daily_views?: number | null
          date_recorded?: string | null
          engagement_rate?: number | null
          fetched_at?: string
          id?: string
          likes?: number | null
          published_at?: string | null
          subscribers?: number | null
          title?: string | null
          updated_at?: string
          video_id?: string | null
          views?: number | null
          watch_time_hours?: number | null
        }
        Update: {
          channel_handle?: string | null
          channel_id?: string | null
          channel_name?: string | null
          comments?: number | null
          created_at?: string
          creator_roster_id?: string
          daily_comments?: number | null
          daily_likes?: number | null
          daily_subscribers?: number | null
          daily_views?: number | null
          date_recorded?: string | null
          engagement_rate?: number | null
          fetched_at?: string
          id?: string
          likes?: number | null
          published_at?: string | null
          subscribers?: number | null
          title?: string | null
          updated_at?: string
          video_id?: string | null
          views?: number | null
          watch_time_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "youtube_analytics_creator_roster_id_fkey"
            columns: ["creator_roster_id"]
            isOneToOne: false
            referencedRelation: "creator_roster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "youtube_analytics_creator_roster_id_fkey"
            columns: ["creator_roster_id"]
            isOneToOne: false
            referencedRelation: "roster_analytics_summary"
            referencedColumns: ["creator_roster_id"]
          },
        ]
      }
    }
    Views: {
      creator_latest_stats: {
        Row: {
          channel_id: string | null
          channel_name: string | null
          creator_name: string | null
          creator_roster_id: string | null
          date_recorded: string | null
          fetched_at: string | null
          subscribers: number | null
          user_id: string | null
          views: number | null
        }
        Relationships: [
          {
            foreignKeyName: "youtube_analytics_creator_roster_id_fkey"
            columns: ["creator_roster_id"]
            isOneToOne: false
            referencedRelation: "creator_roster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "youtube_analytics_creator_roster_id_fkey"
            columns: ["creator_roster_id"]
            isOneToOne: false
            referencedRelation: "roster_analytics_summary"
            referencedColumns: ["creator_roster_id"]
          },
        ]
      }
      daily_youtube_summary: {
        Row: {
          creator_name: string | null
          daily_engagement: number | null
          daily_subscribers: number | null
          daily_views: number | null
          date_recorded: string | null
          fetched_at: string | null
          total_subscribers: number | null
          total_views: number | null
        }
        Relationships: []
      }
      dashboard_analytics: {
        Row: {
          analytics_id: string | null
          brand_name: string | null
          campaign_date: string | null
          campaign_engagement_rate: number | null
          campaign_id: string | null
          campaign_month: string | null
          campaign_total_engagement: number | null
          campaign_total_views: number | null
          client_id: string | null
          client_name: string | null
          client_name_full: string | null
          comments: number | null
          content_engagement_rate: number | null
          content_url: string | null
          creator_id: string | null
          creator_name: string | null
          deal_value: number | null
          engagement: number | null
          fetched_at: string | null
          likes: number | null
          platform: string | null
          platform_handles: Json | null
          sentiment_label: string | null
          sentiment_score: number | null
          shares: number | null
          status: string | null
          views: number | null
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
        ]
      }
      public_collaborations: {
        Row: {
          brand_name: string | null
          campaign_date: string | null
          creator_id: string | null
          engagement_rate: number | null
          id: string | null
          logo_url: string | null
          status: string | null
          total_engagement: number | null
          total_views: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_campaign_creators_creator"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_analytics_summary: {
        Row: {
          avg_engagement_rate: number | null
          creator_name: string | null
          creator_roster_id: string | null
          current_engagement_rate: number | null
          current_subscribers: number | null
          current_views: number | null
          data_points: number | null
          last_update_date: string | null
          total_engagement: number | null
          total_views: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_create_user: {
        Args: {
          email: string
          is_view_only?: boolean
          password: string
          role: string
        }
        Returns: Json
      }
      calculate_accurate_daily_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      calculate_channel_engagement: {
        Args: { p_subscribers: number; p_views: number }
        Returns: number
      }
      calculate_daily_youtube_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      calculate_proper_daily_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      can_user_create_content: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_user_delete_content: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_user_edit_content: {
        Args: { _user_id: string }
        Returns: boolean
      }
      check_campaign_milestones: {
        Args: { p_campaign_id: string; p_new_views?: number }
        Returns: undefined
      }
      cleanup_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_admin_account: {
        Args: { admin_email: string; admin_password: string }
        Returns: string
      }
      create_secure_admin_account: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      direct_update_campaign: {
        Args: {
          p_campaign_id: string
          p_comments: number
          p_likes: number
          p_video_url: string
          p_views: number
        }
        Returns: undefined
      }
      direct_update_roster: {
        Args: {
          p_channel_id: string
          p_channel_name: string
          p_creator_roster_id: string
          p_subscribers: number
          p_total_views: number
        }
        Returns: undefined
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
      get_campaign_trends: {
        Args: {
          end_date?: string
          group_by_period?: string
          start_date?: string
        }
        Returns: {
          avg_engagement_rate: number
          campaign_count: number
          period: string
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
          engagement_rate: number
          logo_url: string
          total_engagement: number
          total_views: number
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_dashboard_metrics: {
        Args:
          | {
              campaign_ids?: string[]
              client_ids?: string[]
              creator_ids?: string[]
              end_date?: string
              master_campaigns?: string[]
              platforms?: string[]
              start_date?: string
            }
          | {
              campaign_ids?: string[]
              client_ids?: string[]
              creator_ids?: string[]
              end_date?: string
              platforms?: string[]
              start_date?: string
            }
        Returns: {
          avg_engagement_rate: number
          creator_performance: Json
          monthly_trends: Json
          platform_breakdown: Json
          total_campaigns: number
          total_deal_value: number
          total_engagement: number
          total_views: number
        }[]
      }
      get_roster_daily_analytics: {
        Args: {
          p_creator_ids?: string[]
          p_end_date?: string
          p_start_date?: string
        }
        Returns: {
          creator_count: number
          date_recorded: string
          total_daily_engagement: number
          total_daily_subscribers: number
          total_daily_views: number
        }[]
      }
      get_top_content: {
        Args: { limit_count?: number; order_by?: string }
        Returns: {
          brand_name: string
          campaign_date: string
          campaign_id: string
          content_url: string
          creator_name: string
          engagement: number
          engagement_rate: number
          platform: string
          views: number
        }[]
      }
      get_user_accessible_campaigns: {
        Args: { _user_id: string }
        Returns: {
          campaign_id: string
        }[]
      }
      get_user_credential_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          credential_type: string
          expires_at: string
          has_credentials: boolean
          id: string
          platform: string
        }[]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_campaign_public: {
        Args: { p_campaign_id: string }
        Returns: boolean
      }
      is_creator_published: {
        Args: { p_creator_id: string }
        Returns: boolean
      }
      log_campaign_refresh_completion: {
        Args: {
          p_campaign_results: Json
          p_failed_campaigns: number
          p_log_id: string
          p_successful_campaigns: number
          p_total_campaigns: number
        }
        Returns: undefined
      }
      publish_public_media_kit: {
        Args: { p_creator_id: string; p_slug?: string }
        Returns: string
      }
      refresh_all_campaigns_nightly: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_creator_youtube_data: {
        Args: {
          p_creator_roster_id: string
          p_engagement_rate?: number
          p_subscribers?: number
          p_views?: number
        }
        Returns: undefined
      }
      rotate_api_credential: {
        Args: {
          credential_id: string
          new_encrypted_value: string
          new_expires_at?: string
        }
        Returns: boolean
      }
      schedule_daily_campaign_refresh: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      set_campaign_status: {
        Args: { p_campaign_id: string; p_status: string }
        Returns: undefined
      }
      slugify_name: {
        Args: { input: string }
        Returns: string
      }
      trigger_manual_refresh: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      update_campaign_analytics: {
        Args: {
          p_analytics_data?: Json
          p_campaign_id: string
          p_engagement_rate?: number
          p_total_engagement?: number
          p_total_views?: number
        }
        Returns: undefined
      }
      update_campaign_totals: {
        Args: { campaign_uuid: string }
        Returns: undefined
      }
      update_creator_youtube_stats: {
        Args: {
          p_channel_url: string
          p_creator_roster_id: string
          p_subscribers?: number
          p_video_count?: number
          p_views?: number
        }
        Returns: Json
      }
      update_youtube_channel_analytics: {
        Args: {
          p_channel_handle: string
          p_channel_id?: string
          p_channel_name?: string
          p_creator_roster_id: string
          p_subscribers?: number
          p_total_views?: number
          p_video_count?: number
        }
        Returns: undefined
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
        Args: {
          bio_param?: string
          display_name_param?: string
          profile_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "client"
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
      app_role: ["admin", "client"],
    },
  },
} as const
