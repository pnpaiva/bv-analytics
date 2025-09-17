import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CampaignAssignment {
  id: string;
  client_id: string;
  campaign_id: string;
  assigned_by: string;
  assigned_at: string;
  campaign?: {
    id: string;
    brand_name: string;
    campaign_date: string;
    status: string | null;
  };
  client?: {
    id: string;
    email: string;
  };
}

export function useClientCampaignAssignments(clientId: string) {
  return useQuery({
    queryKey: ['client-campaign-assignments', clientId],
    queryFn: async (): Promise<CampaignAssignment[]> => {
      // RLS policies handle organization-based filtering automatically
      const { data, error } = await supabase
        .from('client_campaign_assignments')
        .select(`
          *,
          campaign:campaigns(id, brand_name, campaign_date, status)
        `)
        .eq('client_id', clientId)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });
}

export function useAllCampaignAssignments() {
  return useQuery({
    queryKey: ['all-campaign-assignments'],
    queryFn: async (): Promise<CampaignAssignment[]> => {
      // RLS policies handle organization-based filtering automatically
      const { data, error } = await supabase
        .from('client_campaign_assignments')
        .select(`
          *,
          campaign:campaigns(id, brand_name, campaign_date, status)
        `)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useAssignCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, campaignId }: { clientId: string; campaignId: string }) => {
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

      const { error } = await supabase
        .from('client_campaign_assignments')
        .insert({
          client_id: clientId,
          campaign_id: campaignId,
          assigned_by: user.id,
          organization_id: organizationId,
        });

      if (error) throw error;
      return { clientId, campaignId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-campaign-assignments', data.clientId] });
      queryClient.invalidateQueries({ queryKey: ['all-campaign-assignments'] });
      toast.success('Campaign assigned successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign campaign: ${error.message}`);
    },
  });
}

export function useUnassignCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, campaignId }: { clientId: string; campaignId: string }) => {
      // RLS policies handle organization-based access control automatically
      const { error } = await supabase
        .from('client_campaign_assignments')
        .delete()
        .eq('client_id', clientId)
        .eq('campaign_id', campaignId);

      if (error) throw error;
      return { clientId, campaignId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-campaign-assignments', data.clientId] });
      queryClient.invalidateQueries({ queryKey: ['all-campaign-assignments'] });
      toast.success('Campaign unassigned successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to unassign campaign: ${error.message}`);
    },
  });
}

export function useUserAccessibleCampaigns() {
  return useQuery({
    queryKey: ['user-accessible-campaigns'],
    queryFn: async (): Promise<string[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // RLS policies handle organization-based filtering automatically
      // Simply fetch all accessible campaigns and return their IDs
      const { data, error } = await supabase
        .from('campaigns')
        .select('id');

      if (error) {
        console.error('Error fetching accessible campaigns:', error);
        return [];
      }

      return data?.map(item => item.id) || [];
    },
  });
}
