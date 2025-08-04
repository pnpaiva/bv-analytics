import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UrlAnalytics {
  url: string;
  platform: string;
  total_views: number;
  total_engagement: number;
  avg_engagement_rate: number;
  latest_date: string;
  daily_data: Array<{
    date: string;
    views: number;
    engagement: number;
    engagement_rate: number;
    likes: number;
    comments: number;
    shares: number;
  }>;
}

export const useCampaignUrlAnalytics = (
  campaignId: string,
  startDate?: string,
  endDate?: string
) => {
  return useQuery({
    queryKey: ['campaign-url-analytics', campaignId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_campaign_url_analytics', {
        p_campaign_id: campaignId,
        p_start_date: startDate || null,
        p_end_date: endDate || null
      });

      if (error) {
        console.error('Error fetching campaign URL analytics:', error);
        throw error;
      }

      return data as UrlAnalytics[];
    },
    enabled: !!campaignId,
  });
};