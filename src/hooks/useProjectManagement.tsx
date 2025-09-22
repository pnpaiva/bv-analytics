import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganizationContext } from './useOrganizationContext';

// Types
export interface ProjectStage {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
  color: string;
  organization_id: string;
}

export interface CampaignCreatorProject {
  id: string;
  campaign_id: string;
  creator_id: string;
  stage: string;
  payment_amount: number;
  payment_status: 'pending' | 'paid' | 'overdue';
  payment_due_date?: string;
  notes?: string;
  contact_status: 'not_contacted' | 'contacted' | 'responded' | 'no_response';
  deadline?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  content_urls?: any;
  organization_id: string;
  created_at: string;
  updated_at: string;
  creators?: {
    id: string;
    name: string;
    email?: string;
    avatar_url?: string;
  };
  campaigns?: {
    id: string;
    brand_name: string;
    status: string;
  };
}

export interface ProjectNote {
  id: string;
  campaign_id: string;
  creator_id?: string;
  note_type: 'general' | 'payment' | 'content' | 'contact';
  title?: string;
  content: string;
  created_by: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

// Hook to fetch project stages
export function useProjectStages() {
  const { selectedOrganizationId } = useOrganizationContext();
  
  return useQuery({
    queryKey: ['project-stages', selectedOrganizationId],
    queryFn: async () => {
      if (!selectedOrganizationId) return [];
      
      const { data, error } = await supabase
        .from('campaign_project_stages')
        .select('*')
        .eq('organization_id', selectedOrganizationId)
        .order('sort_order');

      if (error) throw error;
      return data as ProjectStage[];
    },
    enabled: !!selectedOrganizationId,
  });
}

// Hook to fetch campaign creators with project management data
export function useCampaignCreatorsProject(campaignId?: string) {
  const { selectedOrganizationId } = useOrganizationContext();
  
  return useQuery({
    queryKey: ['campaign-creators-project', campaignId, selectedOrganizationId],
    queryFn: async () => {
      if (!selectedOrganizationId) return [];
      
      let query = supabase
        .from('campaign_creators')
        .select(`
          id,
          campaign_id,
          creator_id,
          stage,
          payment_amount,
          payment_status,
          payment_due_date,
          notes,
          contact_status,
          deadline,
          priority,
          content_urls,
          organization_id,
          created_at,
          updated_at,
          creators (
            id,
            name,
            email,
            avatar_url
          ),
          campaigns (
            id,
            brand_name,
            status
          )
        `)
        .eq('organization_id', selectedOrganizationId);

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CampaignCreatorProject[];
    },
    enabled: !!selectedOrganizationId,
  });
}

// Hook to update campaign creator project data
export function useUpdateCampaignCreatorProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      stage?: string;
      payment_amount?: number;
      payment_status?: string;
      payment_due_date?: string;
      notes?: string;
      contact_status?: string;
      deadline?: string;
      priority?: string;
    }) => {
      const { error } = await supabase
        .from('campaign_creators')
        .update({
          stage: data.stage,
          payment_amount: data.payment_amount,
          payment_status: data.payment_status,
          payment_due_date: data.payment_due_date,
          notes: data.notes,
          contact_status: data.contact_status,
          deadline: data.deadline,
          priority: data.priority,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-creators-project'] });
      toast.success('Project details updated successfully');
    },
    onError: (error) => {
      console.error('Error updating project details:', error);
      toast.error('Failed to update project details');
    },
  });
}

// Hook to fetch project notes
export function useProjectNotes(campaignId?: string, creatorId?: string) {
  const { selectedOrganizationId } = useOrganizationContext();
  
  return useQuery({
    queryKey: ['project-notes', campaignId, creatorId, selectedOrganizationId],
    queryFn: async () => {
      if (!selectedOrganizationId) return [];
      
      let query = supabase
        .from('campaign_project_notes')
        .select('*')
        .eq('organization_id', selectedOrganizationId)
        .order('created_at', { ascending: false });

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }
      
      if (creatorId) {
        query = query.eq('creator_id', creatorId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ProjectNote[];
    },
    enabled: !!selectedOrganizationId,
  });
}

// Hook to create project note
export function useCreateProjectNote() {
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useOrganizationContext();

  return useMutation({
    mutationFn: async (data: {
      campaign_id: string;
      creator_id?: string;
      note_type: string;
      title?: string;
      content: string;
      created_by: string;
    }) => {
      if (!selectedOrganizationId) throw new Error('No organization selected');

      const { error } = await supabase
        .from('campaign_project_notes')
        .insert({
          ...data,
          organization_id: selectedOrganizationId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-notes'] });
      toast.success('Note added successfully');
    },
    onError: (error) => {
      console.error('Error creating note:', error);
      toast.error('Failed to add note');
    },
  });
}

// Hook to get project overview stats
export function useProjectOverview() {
  const { selectedOrganizationId } = useOrganizationContext();
  
  return useQuery({
    queryKey: ['project-overview', selectedOrganizationId],
    queryFn: async () => {
      if (!selectedOrganizationId) return null;
      
      const { data, error } = await supabase
        .from('campaign_creators')
        .select(`
          id,
          stage,
          payment_status,
          payment_amount,
          priority,
          campaigns (brand_name, status)
        `)
        .eq('organization_id', selectedOrganizationId);

      if (error) throw error;

      // Calculate stats
      const totalProjects = data.length;
      const stageStats = data.reduce((acc, item) => {
        acc[item.stage] = (acc[item.stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const paymentStats = data.reduce((acc, item) => {
        acc[item.payment_status] = (acc[item.payment_status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalPaymentAmount = data.reduce((sum, item) => sum + (item.payment_amount || 0), 0);

      return {
        totalProjects,
        stageStats,
        paymentStats,
        totalPaymentAmount,
        data
      };
    },
    enabled: !!selectedOrganizationId,
  });
}