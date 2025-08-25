import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DailyCampaignPerformance {
  id: string;
  campaign_id: string;
  date_recorded: string;
  total_views: number;
  total_engagement: number;
  engagement_rate: number;
  platform_breakdown: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const useDailyCampaignPerformance = (campaignId: string, days: number = 30) => {
  return useQuery({
    queryKey: ['daily-campaign-performance', campaignId, days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('daily_campaign_performance')
        .select('*')
        .eq('campaign_id', campaignId)
        .gte('date_recorded', startDate.toISOString().split('T')[0])
        .order('date_recorded', { ascending: true });

      if (error) {
        console.error('Error fetching daily campaign performance:', error);
        throw error;
      }

      return data as DailyCampaignPerformance[];
    },
    enabled: !!campaignId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};