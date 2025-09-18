
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserPermissions } from './useUserRoles';
import { useOrganizationContext } from './useOrganizationContext';

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
  const { organization, isMasterAdmin } = useUserPermissions();
  const { selectedOrganizationId } = useOrganizationContext();
  
  return useQuery({
    queryKey: ['creators', selectedOrganizationId || organization?.id],
    queryFn: async () => {
      console.log('Fetching creators with full campaign data...');
      
      let query = supabase
        .from('creators')
        .select('*')
        .order('name');

      // For master admins, filter by selected organization if any
      if (isMasterAdmin && selectedOrganizationId) {
        query = query.eq('organization_id', selectedOrganizationId);
      } else if (organization?.id && !isMasterAdmin) {
        // For non-master admins, filter by their organization
        query = query.eq('organization_id', organization.id);
      }

      const { data: creators, error: creatorsError } = await query;

      if (creatorsError) {
        console.error('Error fetching creators:', creatorsError);
        toast.error('Failed to fetch creators');
        throw creatorsError;
      }

      // Fetch campaign_creators relationships (also filtered by RLS)
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
    enabled: !!organization || isMasterAdmin,
  });
}
