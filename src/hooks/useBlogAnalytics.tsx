import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserPermissions } from './useUserRoles';

export interface BlogAnalyticsSummary {
  total_views: number;
  total_unique_views: number;
  avg_time_on_page: number;
  avg_bounce_rate: number;
  top_posts: Array<{
    title: string;
    slug: string;
    total_views: number;
    avg_time_on_page: number;
  }>;
  daily_views: Array<{
    date: string;
    views: number;
    unique_views: number;
  }>;
}

export interface BlogAnalyticsData {
  id: string;
  blog_post_id: string;
  date_recorded: string;
  views: number;
  unique_views: number;
  time_on_page: number;
  bounce_rate: number;
  referrer_source?: string;
  created_at: string;
  updated_at: string;
}

export function useBlogAnalyticsSummary(startDate?: string, endDate?: string) {
  const { organization } = useUserPermissions();

  return useQuery({
    queryKey: ['blog-analytics-summary', organization?.id, startDate, endDate],
    queryFn: async (): Promise<BlogAnalyticsSummary> => {
      if (!organization?.id) {
        throw new Error('Organization not found');
      }

      const { data, error } = await supabase.rpc('get_blog_analytics_summary', {
        p_organization_id: organization.id,
        p_start_date: startDate || null,
        p_end_date: endDate || null,
      });

      if (error) {
        console.error('Error fetching blog analytics summary:', error);
        toast.error('Failed to fetch blog analytics');
        throw error;
      }

      const result = data?.[0];
      if (!result) {
        return {
          total_views: 0,
          total_unique_views: 0,
          avg_time_on_page: 0,
          avg_bounce_rate: 0,
          top_posts: [],
          daily_views: [],
        };
      }

      return {
        total_views: result.total_views || 0,
        total_unique_views: result.total_unique_views || 0,
        avg_time_on_page: result.avg_time_on_page || 0,
        avg_bounce_rate: result.avg_bounce_rate || 0,
        top_posts: Array.isArray(result.top_posts) ? result.top_posts as any[] : [],
        daily_views: Array.isArray(result.daily_views) ? result.daily_views as any[] : [],
      };
    },
    enabled: !!organization?.id,
  });
}

export function useBlogAnalytics() {
  const { organization } = useUserPermissions();

  return useQuery({
    queryKey: ['blog-analytics', organization?.id],
    queryFn: async (): Promise<BlogAnalyticsData[]> => {
      if (!organization?.id) {
        throw new Error('Organization not found');
      }

      const { data, error } = await supabase
        .from('blog_analytics')
        .select('*')
        .eq('organization_id', organization.id)
        .order('date_recorded', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching blog analytics:', error);
        toast.error('Failed to fetch blog analytics');
        throw error;
      }

      return data || [];
    },
    enabled: !!organization?.id,
  });
}

export function useTrackBlogView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      blogPostId,
      timeOnPage = 0,
      referrerSource,
    }: {
      blogPostId: string;
      timeOnPage?: number;
      referrerSource?: string;
    }) => {
      console.log('Calling upsert_blog_analytics with:', {
        blogPostId,
        timeOnPage,
        referrerSource,
      });

      const { data, error } = await supabase.rpc('upsert_blog_analytics', {
        p_blog_post_id: blogPostId,
        p_views: 1,
        p_unique_views: 1,
        p_time_on_page: timeOnPage,
        p_referrer_source: referrerSource,
      });

      if (error) {
        console.error('Error tracking blog view:', error);
        throw error;
      }

      console.log('Blog view tracked successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-analytics-summary'] });
      queryClient.invalidateQueries({ queryKey: ['blog-analytics'] });
      console.log('Analytics queries invalidated');
    },
    onError: (error) => {
      console.error('Failed to track blog view:', error);
      // Don't show toast for tracking errors to avoid annoying users
    },
  });
}