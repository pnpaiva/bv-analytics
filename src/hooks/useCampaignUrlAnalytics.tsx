import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CampaignUrlAnalytics {
  id: string;
  campaign_id: string;
  content_url: string;
  platform: string;
  date_recorded: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement: number;
  engagement_rate: number;
  analytics_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  fetched_at: string;
}

export const useCampaignUrlAnalytics = (campaignId: string) => {
  return useQuery({
    queryKey: ['campaign-url-analytics', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_url_analytics')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('date_recorded', { ascending: false });

      if (error) {
        console.error('Error fetching campaign URL analytics:', error);
        throw error;
      }

      return data as CampaignUrlAnalytics[];
    },
    enabled: !!campaignId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};