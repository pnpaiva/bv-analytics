import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserPermissions } from './useUserRoles';
import { useOrganizationContext } from './useOrganizationContext';

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
  logo_url?: string;
}

export interface UpdateMasterCampaignData {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  logo_url?: string;
}

export function useMasterCampaigns() {
  const { organization, isMasterAdmin } = useUserPermissions();
  const { selectedOrganizationId } = useOrganizationContext();
  
  return useQuery({
    queryKey: ['master-campaigns', selectedOrganizationId || organization?.id],
    queryFn: async () => {
      let query = supabase
        .from('campaigns')
        .select('master_campaign_name, master_campaign_start_date, master_campaign_end_date, master_campaign_logo_url, organization_id')
        .not('master_campaign_name', 'is', null)
        .order('master_campaign_name');

      // For master admins, filter by selected organization if any
      if (isMasterAdmin && selectedOrganizationId) {
        query = query.eq('organization_id', selectedOrganizationId);
      } else if (organization?.id && !isMasterAdmin) {
        // For non-master admins, filter by their organization
        query = query.eq('organization_id', organization.id);
      }

      const { data, error } = await query;

      if (error) {
        toast.error('Failed to fetch master campaigns');
        throw error;
      }

      // Group by master campaign name and get the most recent data
      const grouped = data.reduce((acc, item) => {
        const name = item.master_campaign_name;
        if (!acc[name] || !acc[name].master_campaign_start_date) {
          acc[name] = {
            name,
            start_date: item.master_campaign_start_date,
            end_date: item.master_campaign_end_date,
            logo_url: item.master_campaign_logo_url,
            organization_id: item.organization_id,
          };
        }
        return acc;
      }, {} as Record<string, any>);

      return Object.values(grouped);
    },
    enabled: !!organization || isMasterAdmin,
  });
}

export function useCreateMasterCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMasterCampaignData) => {
      // For now, we'll just create a template campaign that represents the master campaign
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user's organization
      const { data: userOrg, error: orgError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (orgError && orgError.code !== 'PGRST116') throw orgError;

      const organizationId = userOrg?.organization_id || 'default-org-id'; // Fallback

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert([
          {
            brand_name: 'Master Campaign Template',
            user_id: user.id,
            organization_id: organizationId,
            campaign_date: new Date().toISOString().split('T')[0],
            master_campaign_name: data.name,
            master_campaign_start_date: data.start_date,
            master_campaign_end_date: data.end_date,
            master_campaign_logo_url: data.logo_url,
            status: 'draft',
            total_views: 0,
            total_engagement: 0,
            engagement_rate: 0,
          },
        ])
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

      // RLS policies handle organization-based access control automatically
      const { error } = await supabase
        .from('campaigns')
        .update({
          master_campaign_name: data.name,
          master_campaign_start_date: data.start_date,
          master_campaign_end_date: data.end_date,
          master_campaign_logo_url: data.logo_url,
          updated_at: new Date().toISOString(),
        })
        .eq('master_campaign_name', data.id); // data.id is the old name

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

      // RLS policies handle organization-based access control automatically
      const { error } = await supabase
        .from('campaigns')
        .update({
          master_campaign_name: null,
          master_campaign_start_date: null,
          master_campaign_end_date: null,
          updated_at: new Date().toISOString(),
        })
        .eq('master_campaign_name', masterCampaignName);

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