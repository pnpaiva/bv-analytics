import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserAccessibleCampaigns } from './useCampaignAssignments';
import { Campaign } from './useCampaigns';
import { toast } from 'sonner';

export function useAccessibleCampaigns() {
  console.log('useAccessibleCampaigns - Hook initialized');
  const { data: accessibleCampaignIds = [] } = useUserAccessibleCampaigns();
  
  console.log('useAccessibleCampaigns - accessibleCampaignIds:', accessibleCampaignIds);
  
  return useQuery({
    queryKey: ['accessible-campaigns', accessibleCampaignIds],
    queryFn: async () => {
      console.log('useAccessibleCampaigns - queryFn called with accessibleCampaignIds:', accessibleCampaignIds);
      
      if (accessibleCampaignIds.length === 0) {
        console.log('useAccessibleCampaigns - Admin mode: fetching all campaigns');
        // Admin sees all campaigns - fetch all
        const { data, error } = await supabase
          .from('campaigns')
          .select(`
            *,
            clients (name)
          `)
          .order('created_at', { ascending: false });

        // If we got campaigns, fetch creator data separately
        if (data && data.length > 0) {
          const campaignIds = data.map(c => c.id);
          
          // Fetch creator relationships separately - SIMPLIFIED QUERY
          console.log('useAccessibleCampaigns - Admin: About to fetch creator data for campaign IDs:', campaignIds);
          
          const { data: creatorData, error: creatorError } = await supabase
            .from('campaign_creators')
            .select(`
              campaign_id,
              creator_id,
              content_urls
            `)
            .in('campaign_id', campaignIds);

          if (creatorError) {
            console.error('Error fetching creator data:', creatorError);
          } else {
            console.log('useAccessibleCampaigns - Admin creator data fetched:', creatorData);
            
            // Attach creator data to campaigns
            data.forEach(campaign => {
              const campaignCreators = creatorData?.filter(cd => cd.campaign_id === campaign.id) || [];
              (campaign as any).campaign_creators = campaignCreators;
              
              console.log(`useAccessibleCampaigns - Admin: Attaching creators to campaign ${campaign.brand_name}:`, {
                campaignId: campaign.id,
                foundCreators: campaignCreators,
                finalCampaignCreators: (campaign as any).campaign_creators
              });
            });
          }
        }

        if (error) {
          console.error('useAccessibleCampaigns - Admin fetch error:', error);
          toast.error('Failed to fetch campaigns');
          throw error;
        }

        console.log('useAccessibleCampaigns - Admin campaigns fetched:', data);
        return data as Campaign[];
      } else {
        console.log('useAccessibleCampaigns - Client mode: fetching campaigns with IDs:', accessibleCampaignIds);
        console.log('useAccessibleCampaigns - About to query campaigns table...');
        
        // Client sees only assigned campaigns
        const { data, error } = await supabase
          .from('campaigns')
          .select(`
            *,
            clients (name)
          `)
          .in('id', accessibleCampaignIds)
          .order('created_at', { ascending: false });

        // If we got campaigns, fetch creator data separately
        if (data && data.length > 0) {
          const campaignIds = data.map(c => c.id);
          
          // Fetch creator relationships separately - SIMPLIFIED QUERY
          console.log('useAccessibleCampaigns - Client: About to fetch creator data for campaign IDs:', campaignIds);
          
          // First, let's check what's actually in the campaign_creators table
          console.log('useAccessibleCampaigns - Client: Checking raw campaign_creators table data...');
          const { data: rawCreatorData, error: rawError } = await supabase
            .from('campaign_creators')
            .select('*')
            .in('campaign_id', campaignIds);
          console.log('useAccessibleCampaigns - Client: Raw campaign_creators table data:', { rawCreatorData, rawError });
          
          // Now try the simplified query
          const { data: creatorData, error: creatorError } = await supabase
            .from('campaign_creators')
            .select(`
              campaign_id,
              creator_id,
              content_urls
            `)
            .in('campaign_id', campaignIds);

          console.log('useAccessibleCampaigns - Client: Simplified creator query result:', { creatorData, creatorError, campaignIds });

          if (creatorError) {
            console.error('Error fetching creator data:', creatorError);
          } else {
            console.log('useAccessibleCampaigns - Creator data fetched:', creatorData);
            
            // Debug: Check what's actually in the campaign_creators table for these campaigns
            console.log('useAccessibleCampaigns - Client: Checking raw campaign_creators table data...');
            const { data: rawCreatorData, error: rawError } = await supabase
              .from('campaign_creators')
              .select('*')
              .in('campaign_id', campaignIds);
            console.log('useAccessibleCampaigns - Client: Raw campaign_creators table data:', { rawCreatorData, rawError });
            
            // Attach creator data to campaigns
            data.forEach(campaign => {
              const campaignCreators = creatorData?.filter(cd => cd.campaign_id === campaign.id) || [];
              (campaign as any).campaign_creators = campaignCreators;
              
              console.log(`useAccessibleCampaigns - Attaching creators to campaign ${campaign.brand_name}:`, {
                campaignId: campaign.id,
                foundCreators: campaignCreators,
                finalCampaignCreators: (campaign as any).campaign_creators
              });
            });
          }
        }

        if (error) {
          console.error('useAccessibleCampaigns - Client fetch error:', error);
          toast.error('Failed to fetch accessible campaigns');
          throw error;
        }

        console.log('useAccessibleCampaigns - Client campaigns fetched:', data);
        console.log('useAccessibleCampaigns - Client fetch error (if any):', error);
        console.log('useAccessibleCampaigns - Raw query result:', { data, error });
        
        // Debug: Check if any campaigns were found (AFTER creator data attachment)
        if (data && data.length > 0) {
          console.log('useAccessibleCampaigns - Found campaigns:', data.map(c => ({ id: c.id, brand_name: c.brand_name })));
          // Debug: Check creator data for each campaign (AFTER attachment)
          data.forEach((campaign, index) => {
            console.log(`useAccessibleCampaigns - Campaign ${index + 1} creator data:`, {
              id: campaign.id,
              brand_name: campaign.brand_name,
              campaign_creators: (campaign as any).campaign_creators
            });
          });
        } else {
          console.log('useAccessibleCampaigns - No campaigns found in database for IDs:', accessibleCampaignIds);
          
          // Additional debug: Check what's in the database
          console.log('useAccessibleCampaigns - Checking what campaigns exist in database...');
          const { data: allCampaigns, error: allError } = await supabase
            .from('campaigns')
            .select('id, brand_name')
            .limit(10);
          console.log('useAccessibleCampaigns - All campaigns in database (first 10):', allCampaigns);
          console.log('useAccessibleCampaigns - All campaigns error:', allError);
        }
        
        return data as Campaign[];
      }
    },
    enabled: accessibleCampaignIds.length > 0 || accessibleCampaignIds.length === 0, // Always enabled
  });
}
