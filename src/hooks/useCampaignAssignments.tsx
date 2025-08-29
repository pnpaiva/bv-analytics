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
      const { data, error } = await supabase
        .from('client_campaign_assignments')
        .select(`
          *,
          campaign:campaigns(id, brand_name, campaign_date, status),
          client:profiles(id, email)
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

      const { error } = await supabase
        .from('client_campaign_assignments')
        .insert({
          client_id: clientId,
          campaign_id: campaignId,
          assigned_by: user.id,
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

      // Check if user is admin
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (userRole?.role === 'admin') {
        // Admins can see all campaigns
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id');
        return campaigns?.map(c => c.id) || [];
      } else {
        // Clients can only see assigned campaigns
        const { data: assignments } = await supabase
          .from('client_campaign_assignments')
          .select('campaign_id')
          .eq('client_id', user.id);
        return assignments?.map(a => a.campaign_id) || [];
      }
    },
  });
}
