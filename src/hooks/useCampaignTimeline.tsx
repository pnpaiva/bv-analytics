import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TimelineData {
  date_recorded: string;
  total_views: number;
  total_engagement: number;
  engagement_rate: number;
  platform_breakdown: Record<string, {
    views: number;
    engagement: number;
    url_count: number;
  }>;
}

export const useCampaignTimeline = (campaignId: string, daysBack: number = 30) => {
  return useQuery({
    queryKey: ['campaign-timeline', campaignId, daysBack],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_campaign_timeline', {
        p_campaign_id: campaignId,
        p_days_back: daysBack
      });

      if (error) {
        console.error('Error fetching campaign timeline:', error);
        throw error;
      }

      return data as TimelineData[];
    },
    enabled: !!campaignId,
  });
};