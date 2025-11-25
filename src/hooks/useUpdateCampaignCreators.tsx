import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UpdateCampaignCreatorsData {
  campaign_id: string;
  creators: Array<{
    id?: string; // For existing creators
    creator_id: string;
    content_urls: {
      youtube: (string | { url: string; insertionStart?: string; insertionEnd?: string })[];
      instagram: (string | { url: string; insertionStart?: string; insertionEnd?: string })[];
      tiktok: (string | { url: string; insertionStart?: string; insertionEnd?: string })[];
    };
  }>;
}

export function useUpdateCampaignCreators() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCampaignCreatorsData) => {
      const { campaign_id, creators } = data;
      
      // Get campaign's organization_id
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('organization_id')
        .eq('id', campaign_id)
        .single();
      
      if (!campaign?.organization_id) throw new Error('Campaign organization not found');
      
      // First, delete all existing campaign creators for this campaign
      const { error: deleteError } = await supabase
        .from('campaign_creators')
        .delete()
        .eq('campaign_id', campaign_id);

      if (deleteError) throw deleteError;

      // Then insert all the new/updated creators
      if (creators.length > 0) {
        const campaignCreatorsData = creators.map(creator => ({
          campaign_id,
          creator_id: creator.creator_id,
          organization_id: campaign.organization_id,
          content_urls: {
            youtube: creator.content_urls.youtube
              .map(item => typeof item === 'string' ? { url: item } : item)
              .filter(item => item.url.trim() !== ''),
            instagram: creator.content_urls.instagram
              .map(item => typeof item === 'string' ? { url: item } : item)
              .filter(item => item.url.trim() !== ''),
            tiktok: creator.content_urls.tiktok
              .map(item => typeof item === 'string' ? { url: item } : item)
              .filter(item => item.url.trim() !== ''),
          },
        }));

        const { error: insertError } = await supabase
          .from('campaign_creators')
          .insert(campaignCreatorsData);

        if (insertError) throw insertError;
      }

      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-creators', variables.campaign_id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign creators updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update campaign creators');
      console.error(error);
    },
  });
}