import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserPermissions } from './useUserRoles';
import { Campaign } from './useCampaigns';
import { toast } from 'sonner';

export function useAccessibleCampaigns() {
  const { isMasterAdmin, isLocalAdmin, isLocalClient, organizationId } = useUserPermissions();
  
  return useQuery({
    queryKey: ['accessible-campaigns', organizationId, isLocalClient ? 'client-assignments' : null],
    queryFn: async () => {
      console.log('useAccessibleCampaigns - fetching with permissions:', {
        isMasterAdmin,
        isLocalAdmin,
        isLocalClient,
        organizationId
      });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let campaignsQuery = supabase
        .from('campaigns')
        .select(`
          *,
          clients (name)
        `)
        .order('created_at', { ascending: false });

      // For local clients, only show campaigns assigned to them
      if (isLocalClient) {
        console.log('Local client detected, fetching assigned campaigns...');
        
        // First get assigned campaign IDs
        const { data: assignments } = await supabase
          .from('client_campaign_assignments')
          .select('campaign_id')
          .eq('client_id', user.id);
        
        console.log('Campaign assignments:', assignments);
        
        const assignedCampaignIds = assignments?.map(a => a.campaign_id) || [];
        
        if (assignedCampaignIds.length === 0) {
          console.log('No campaigns assigned to this client');
          return []; // No campaigns assigned
        }
        
        campaignsQuery = campaignsQuery.in('id', assignedCampaignIds);
      }
      // For other roles, RLS policies handle filtering automatically

      const { data, error } = await campaignsQuery;

      if (error) {
        console.error('useAccessibleCampaigns - fetch error:', error);
        toast.error('Failed to fetch campaigns');
        throw error;
      }

      // Fetch creator data separately (also filtered by RLS)
      if (data && data.length > 0) {
        const campaignIds = data.map(c => c.id);
        
        const { data: creatorData, error: creatorError } = await supabase
          .from('campaign_creators')
          .select(`
            campaign_id,
            creator_id,
            content_urls,
            creators!left(
              id,
              name,
              avatar_url,
              platform_handles
            )
          `)
          .in('campaign_id', campaignIds);

        if (creatorError) {
          console.error('Error fetching creator data:', creatorError);
        } else {
          // Attach creator data to campaigns
          data.forEach(campaign => {
            const campaignCreators = creatorData?.filter(cd => cd.campaign_id === campaign.id) || [];
            (campaign as any).campaign_creators = campaignCreators;
          });
        }
      }

      console.log('useAccessibleCampaigns - campaigns fetched:', data?.length || 0);
      return data as Campaign[];
    },
    enabled: !!organizationId || isMasterAdmin, // Enable for users with organization or master admins
  });
}