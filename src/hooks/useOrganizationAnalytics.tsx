import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OrganizationAnalytics {
  organizationId: string;
  totalCampaigns: number;
  activeCampaigns: number;
  totalViews: number;
  totalEngagement: number;
  avgEngagementRate: number;
  totalFixedDealValue: number;
  totalVariableDealValue: number;
  totalDealValue: number;
  totalUsers: number;
  totalCreators: number;
  totalClients: number;
}

export function useOrganizationAnalytics(organizationId: string) {
  return useQuery({
    queryKey: ['organization-analytics', organizationId],
    queryFn: async (): Promise<OrganizationAnalytics> => {
      // Get campaigns data
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organization_id', organizationId);

      if (campaignsError) throw campaignsError;

      // Get organization members count
      const { data: members, error: membersError } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId);

      if (membersError) throw membersError;

      // Get creators count
      const { data: creators, error: creatorsError } = await supabase
        .from('creators')
        .select('id')
        .eq('organization_id', organizationId);

      if (creatorsError) throw creatorsError;

      // Get clients count
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id')
        .eq('organization_id', organizationId);

      if (clientsError) throw clientsError;

      // Calculate metrics
      const totalCampaigns = campaigns?.length || 0;
      const activeCampaigns = campaigns?.filter(c => c.status === 'active')?.length || 0;
      const totalViews = campaigns?.reduce((sum, c) => sum + (c.total_views || 0), 0) || 0;
      const totalEngagement = campaigns?.reduce((sum, c) => sum + (c.total_engagement || 0), 0) || 0;
      const avgEngagementRate = totalCampaigns > 0 
        ? campaigns.reduce((sum, c) => sum + (c.engagement_rate || 0), 0) / totalCampaigns 
        : 0;
      const totalFixedDealValue = campaigns?.reduce((sum, c) => sum + (c.fixed_deal_value || 0), 0) || 0;
      const totalVariableDealValue = campaigns?.reduce((sum, c) => sum + (c.variable_deal_value || 0), 0) || 0;
      const totalDealValue = totalFixedDealValue + totalVariableDealValue;
      
      // Count users by role
      const usersByRole = members?.reduce((acc, member) => {
        acc[member.role] = (acc[member.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        organizationId,
        totalCampaigns,
        activeCampaigns,
        totalViews,
        totalEngagement,
        avgEngagementRate,
        totalFixedDealValue,
        totalVariableDealValue,
        totalDealValue,
        totalUsers: members?.length || 0,
        totalCreators: creators?.length || 0,
        totalClients: clients?.length || 0,
      };
    },
    enabled: !!organizationId,
  });
}

export function useAllOrganizationsAnalytics() {
  const { data: organizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name');
      
      if (error) throw error;
      return data;
    },
  });

  return useQuery({
    queryKey: ['all-organizations-analytics', organizations?.map(o => o.id)],
    queryFn: async (): Promise<Record<string, OrganizationAnalytics>> => {
      if (!organizations) return {};

      const analyticsPromises = organizations.map(async (org) => {
        // Get campaigns data
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('*')
          .eq('organization_id', org.id);

        // Get organization members count
        const { data: members } = await supabase
          .from('organization_members')
          .select('role')
          .eq('organization_id', org.id);

        // Get creators count
        const { data: creators } = await supabase
          .from('creators')
          .select('id')
          .eq('organization_id', org.id);

        // Get clients count
        const { data: clients } = await supabase
          .from('clients')
          .select('id')
          .eq('organization_id', org.id);

        // Calculate metrics
        const totalCampaigns = campaigns?.length || 0;
        const activeCampaigns = campaigns?.filter(c => c.status === 'active')?.length || 0;
        const totalViews = campaigns?.reduce((sum, c) => sum + (c.total_views || 0), 0) || 0;
        const totalEngagement = campaigns?.reduce((sum, c) => sum + (c.total_engagement || 0), 0) || 0;
        const avgEngagementRate = totalCampaigns > 0 
          ? campaigns.reduce((sum, c) => sum + (c.engagement_rate || 0), 0) / totalCampaigns 
          : 0;
         const totalFixedDealValue = campaigns?.reduce((sum, c) => sum + (c.fixed_deal_value || 0), 0) || 0;
         const totalVariableDealValue = campaigns?.reduce((sum, c) => sum + (c.variable_deal_value || 0), 0) || 0;
         const totalDealValue = totalFixedDealValue + totalVariableDealValue;

         return {
          [org.id]: {
            organizationId: org.id,
            totalCampaigns,
            activeCampaigns,
            totalViews,
            totalEngagement,
            avgEngagementRate,
            totalFixedDealValue,
            totalVariableDealValue,
            totalDealValue,
            totalUsers: members?.length || 0,
            totalCreators: creators?.length || 0,
            totalClients: clients?.length || 0,
          }
         };
      });

      const results = await Promise.all(analyticsPromises);
      return results.reduce((acc, result) => ({ ...acc, ...result }), {});
    },
    enabled: !!organizations && organizations.length > 0,
  });
}