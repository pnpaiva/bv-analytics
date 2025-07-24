import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MasterCampaign {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMasterCampaignData {
  name: string;
  start_date?: string;
  end_date?: string;
}

export interface UpdateMasterCampaignData {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
}

export function useMasterCampaigns() {
  return useQuery({
    queryKey: ['master-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('master_campaign_name')
        .not('master_campaign_name', 'is', null)
        .order('master_campaign_name');

      if (error) {
        toast.error('Failed to fetch master campaigns');
        throw error;
      }

      // Get unique master campaign names
      const uniqueNames = Array.from(new Set(data.map(item => item.master_campaign_name)));
      return uniqueNames.map(name => ({ name }));
    },
  });
}

export function useCreateMasterCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMasterCampaignData) => {
      // For now, we'll just create a template campaign that represents the master campaign
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert([{
          brand_name: 'Master Campaign Template',
          creator_id: '00000000-0000-0000-0000-000000000000', // Placeholder
          user_id: user.id,
          campaign_date: new Date().toISOString().split('T')[0],
          master_campaign_name: data.name,
          master_campaign_start_date: data.start_date,
          master_campaign_end_date: data.end_date,
          is_master_campaign_template: true,
          status: 'draft',
          total_views: 0,
          total_engagement: 0,
          engagement_rate: 0,
        }])
        .select()
        .single();

      if (error) throw error;
      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Master campaign created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create master campaign');
      console.error(error);
    },
  });
}

export function useUpdateMasterCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateMasterCampaignData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update all campaigns with this master campaign name
      const { error } = await supabase
        .from('campaigns')
        .update({
          master_campaign_name: data.name,
          master_campaign_start_date: data.start_date,
          master_campaign_end_date: data.end_date,
          updated_at: new Date().toISOString(),
        })
        .eq('master_campaign_name', data.id) // data.id is the old name
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Master campaign updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update master campaign');
      console.error(error);
    },
  });
}

export function useDeleteMasterCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (masterCampaignName: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Remove master campaign association from all campaigns
      const { error } = await supabase
        .from('campaigns')
        .update({
          master_campaign_name: null,
          master_campaign_start_date: null,
          master_campaign_end_date: null,
          updated_at: new Date().toISOString(),
        })
        .eq('master_campaign_name', masterCampaignName)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Master campaign deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete master campaign');
      console.error(error);
    },
  });
}