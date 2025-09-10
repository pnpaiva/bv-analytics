
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Creator {
  id: string;
  name: string;
  platform_handles?: Record<string, string>;
  avatar_url?: string;
  user_id: string;
  niche?: string[];
  campaign_creators?: Array<{
    campaign_id: string;
    content_urls: Record<string, string[]>;
    campaigns: {
      id: string;
      brand_name: string;
      campaign_date: string;
      total_views: number;
      total_engagement: number;
      engagement_rate: number;
      logo_url?: string;
      analytics_data?: any;
      status: string;
      fixed_deal_value?: number;
      variable_deal_value?: number;
      clients?: {
        name: string;
      };
    };
  }>;
}

export function useCreators() {
  return useQuery({
    queryKey: ['creators'],
    queryFn: async () => {
      console.log('Fetching creators with full campaign data...');
      
      // First, fetch all creators
      const { data: creators, error: creatorsError } = await supabase
        .from('creators')
        .select('*')
        .order('name');

      if (creatorsError) {
        console.error('Error fetching creators:', creatorsError);
        toast.error('Failed to fetch creators');
        throw creatorsError;
      }

      // Then, fetch all campaign_creators relationships
      const { data: campaignCreators, error: ccError } = await supabase
        .from('campaign_creators')
        .select(`
          campaign_id,
          creator_id,
          content_urls,
          campaigns!left(
            id,
            brand_name,
            campaign_date,
            total_views,
            total_engagement,
            engagement_rate,
            logo_url,
            analytics_data,
            status,
            fixed_deal_value,
            variable_deal_value,
            clients!left(name)
          )
        `);

      if (ccError) {
        console.error('Error fetching campaign creators:', ccError);
        toast.error('Failed to fetch campaign creators');
        throw ccError;
      }

      // Manually attach campaign data to creators
      const creatorsWithCampaigns = creators?.map(creator => ({
        ...creator,
        campaign_creators: campaignCreators?.filter(cc => cc.creator_id === creator.id) || []
      })) || [];

      console.log('Creators with campaign data fetched:', creatorsWithCampaigns);
      return creatorsWithCampaigns as Creator[];
    },
  });
}
