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
      console.log(`Fetching URL analytics for campaign: ${campaignId}`);
      
      // RLS policies handle organization-based filtering automatically
      // Users can only access analytics for campaigns in their organization
      const { data, error } = await supabase
        .from('campaign_url_analytics')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('date_recorded', { ascending: false });

      if (error) {
        console.error('Error fetching campaign URL analytics:', error);
        throw error;
      }

      console.log(`🔍 URL ANALYTICS FETCH for campaign ${campaignId}:`, {
        recordCount: data?.length || 0,
        rawData: data?.slice(0, 3), // Show first 3 records
        summary: data ? {
          totalViews: data.reduce((sum, entry) => sum + (entry.views || 0), 0),
          totalEngagement: data.reduce((sum, entry) => sum + (entry.engagement || 0), 0),
          platforms: [...new Set(data.map(entry => entry.platform))],
          latestDate: Math.max(...data.map(entry => new Date(entry.date_recorded).getTime()))
        } : null
      });

      // Additional debugging for empty data
      if (!data || data.length === 0) {
        console.warn(`⚠️ No URL analytics data found for campaign ${campaignId}. This means the UI will fall back to campaign totals.`);
      } else {
        console.log(`✅ URL analytics data summary for campaign ${campaignId}:`, {
          totalRecords: data.length,
          totalViews: data.reduce((sum, entry) => sum + (entry.views || 0), 0),
          totalEngagement: data.reduce((sum, entry) => sum + (entry.engagement || 0), 0),
          platforms: [...new Set(data.map(entry => entry.platform))],
          dateRange: {
            earliest: Math.min(...data.map(entry => new Date(entry.date_recorded).getTime())),
            latest: Math.max(...data.map(entry => new Date(entry.date_recorded).getTime()))
          }
        });
      }
      
      return data as CampaignUrlAnalytics[];
    },
    enabled: !!campaignId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};