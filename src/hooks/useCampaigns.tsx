import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Campaign {
  id: string;
  brand_name: string;
  creator_id?: string; // Made optional since we now use campaign_creators table
  user_id: string;
  status: 'draft' | 'analyzing' | 'completed' | 'error';
  total_views: number;
  total_engagement: number;
  engagement_rate: number;
  campaign_date: string;
  campaign_month?: string;
  deal_value?: number;
  client_id?: string;
  master_campaign_name?: string;
  master_campaign_start_date?: string;
  master_campaign_end_date?: string;
  logo_url?: string;
  master_campaign_logo_url?: string;
  airtable_id?: string;
  content_urls?: Record<string, string[]>;
  analytics_data?: any;
  analytics_updated_at?: string;
  created_at: string;
  updated_at: string;
  creators?: {
    name: string;
  };
  clients?: {
    name: string;
  };
}

export interface CreateCampaignData {
  brand_name: string;
  campaign_date: string;
  campaign_month?: string;
  deal_value?: number;
  client_id?: string;
  master_campaign_name?: string;
  logo_url?: string;
  creators: Array<{
    creator_id: string;
    content_urls: {
      youtube: string[];
      instagram: string[];
      tiktok: string[];
    };
  }>;
}

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          clients (name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to fetch campaigns');
        throw error;
      }

      return data as Campaign[];
    },
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCampaignData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { creators, ...campaignData } = data;
      
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert({
          ...campaignData,
          user_id: user.id,
          status: 'draft',
          total_views: 0,
          total_engagement: 0,
          engagement_rate: 0,
          creator_id: null, // Set to null since we're using campaign_creators now
          content_urls: {},
        })
        .select()
        .single();

      if (error) throw error;

      // Insert campaign creators
      if (creators && creators.length > 0) {
        const campaignCreatorsData = creators.map(creator => ({
          campaign_id: campaign.id,
          creator_id: creator.creator_id,
          content_urls: creator.content_urls,
        }));

        const { error: creatorsError } = await supabase
          .from('campaign_creators')
          .insert(campaignCreatorsData);

        if (creatorsError) throw creatorsError;
      }

      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create campaign');
      console.error(error);
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete campaign');
      console.error(error);
    },
  });
}

export function useUpdateCampaignStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('campaigns')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (error) => {
      toast.error('Failed to update campaign status');
      console.error(error);
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, content_urls }: { id: string; content_urls: Record<string, string[]> }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('campaigns')
        .update({
          content_urls,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update campaign');
      console.error(error);
    },
  });
}