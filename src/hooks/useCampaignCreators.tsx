import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CampaignCreator {
  id: string;
  campaign_id: string;
  creator_id: string;
  content_urls: Record<string, string[]>;
  created_at: string;
  updated_at: string;
  creators?: {
    name: string;
    niche: string[];
  };
}

export interface CreateCampaignCreatorData {
  campaign_id: string;
  creator_id: string;
  content_urls: Record<string, string[]>;
  organization_id: string;
}

export function useCampaignCreators(campaignId?: string) {
  return useQuery({
    queryKey: ['campaign-creators', campaignId],
    queryFn: async () => {
      const query = supabase
        .from('campaign_creators')
        .select(`
          *,
          creators (name, niche)
        `);
      
      if (campaignId) {
        query.eq('campaign_id', campaignId);
      }
      
      const { data, error } = await query;

      if (error) {
        toast.error('Failed to fetch campaign creators');
        throw error;
      }

      return data as CampaignCreator[];
    },
    enabled: true,
  });
}

export function useCreateCampaignCreator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCampaignCreatorData) => {
      const { data: campaignCreator, error } = await supabase
        .from('campaign_creators')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return campaignCreator;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-creators', variables.campaign_id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Creator added to campaign successfully');
    },
    onError: (error) => {
      toast.error('Failed to add creator to campaign');
      console.error(error);
    },
  });
}

export function useUpdateCampaignCreator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, content_urls }: { id: string; content_urls: Record<string, string[]> }) => {
      const { data, error } = await supabase
        .from('campaign_creators')
        .update({
          content_urls,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-creators', data.campaign_id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign creator updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update campaign creator');
      console.error(error);
    },
  });
}

export function useDeleteCampaignCreator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campaign_creators')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-creators'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Creator removed from campaign successfully');
    },
    onError: (error) => {
      toast.error('Failed to remove creator from campaign');
      console.error(error);
    },
  });
}