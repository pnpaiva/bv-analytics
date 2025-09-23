import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganizationContext } from './useOrganizationContext';
import { useUserPermissions } from './useUserRoles';

// Enhanced types for project management
export interface ProjectFile {
  id: string;
  campaign_id: string;
  creator_id?: string;
  file_type: 'contract' | 'brief' | 'video_for_approval' | 'final_video_url' | 'other';
  file_name: string;
  file_path?: string;
  file_url?: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by: string;
  organization_id: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TimelineActivity {
  id: string;
  campaign_id: string;
  creator_id?: string;
  activity_type: 'stage_change' | 'file_upload' | 'file_approval' | 'note_added' | 'deadline_update' | 'payment_update';
  title: string;
  description?: string;
  old_value?: string;
  new_value?: string;
  performed_by: string;
  organization_id: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface CampaignCreatorEnhanced {
  id: string;
  campaign_id: string;
  creator_id: string;
  stage?: string;
  priority?: string;
  contact_status?: string;
  notes?: string;
  payment_status?: string;
  payment_amount?: number;
  payment_due_date?: string;
  deadline?: string;
  organization_id: string;
  content_urls?: Record<string, any>;
  contract_status?: string;
  brief_status?: string;
  video_approval_status?: string;
  final_video_url?: string;
  contract_sent_date?: string;
  contract_deadline?: string;
  video_submission_deadline?: string;
  final_delivery_date?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  creators?: any;
  campaigns?: any;
}

// Hook to fetch project files
export function useProjectFiles(campaignId?: string, creatorId?: string) {
  const { selectedOrganizationId } = useOrganizationContext();
  const { organization, isMasterAdmin } = useUserPermissions();
  
  // Use selected org for master admins, user's org for others
  const currentOrgId = isMasterAdmin ? selectedOrganizationId : organization?.id;
  
  return useQuery({
    queryKey: ['project-files', campaignId, creatorId, currentOrgId],
    queryFn: async () => {
      if (!currentOrgId) return [];
      
      let query = supabase
        .from('campaign_project_files')
        .select('*')
        .eq('organization_id', currentOrgId)
        .order('created_at', { ascending: false });

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }
      
      if (creatorId) {
        query = query.eq('creator_id', creatorId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ProjectFile[];
    },
    enabled: !!currentOrgId,
  });
}

// Hook to fetch timeline activities
export function useProjectTimeline(campaignId?: string, creatorId?: string) {
  const { selectedOrganizationId } = useOrganizationContext();
  const { organization, isMasterAdmin } = useUserPermissions();
  
  // Use selected org for master admins, user's org for others
  const currentOrgId = isMasterAdmin ? selectedOrganizationId : organization?.id;
  
  return useQuery({
    queryKey: ['project-timeline', campaignId, creatorId, currentOrgId],
    queryFn: async () => {
      if (!currentOrgId) return [];
      
      let query = supabase
        .from('campaign_project_timeline')
        .select('*')
        .eq('organization_id', currentOrgId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }
      
      if (creatorId) {
        query = query.eq('creator_id', creatorId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TimelineActivity[];
    },
    enabled: !!currentOrgId,
  });
}

// Hook to upload project files
export function useUploadProjectFile() {
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useOrganizationContext();
  const { organization, isMasterAdmin } = useUserPermissions();
  
  // Use selected org for master admins, user's org for others
  const currentOrgId = isMasterAdmin ? selectedOrganizationId : organization?.id;

  return useMutation({
    mutationFn: async ({
      file,
      campaignId,
      creatorId,
      fileType,
      description
    }: {
      file: File;
      campaignId: string;
      creatorId?: string;
      fileType: string;
      description?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !currentOrgId) throw new Error('User not authenticated');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create file record
      const { data, error } = await supabase
        .from('campaign_project_files')
        .insert({
          campaign_id: campaignId,
          creator_id: creatorId,
          file_type: fileType,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id,
          organization_id: currentOrgId,
          description,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Log timeline activity
      await supabase.rpc('log_project_activity', {
        p_campaign_id: campaignId,
        p_creator_id: creatorId,
        p_activity_type: 'file_upload',
        p_title: `File uploaded: ${file.name}`,
        p_description: `${fileType} file uploaded`,
        p_organization_id: currentOrgId
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-files'] });
      queryClient.invalidateQueries({ queryKey: ['project-timeline'] });
      toast.success('File uploaded successfully');
    },
    onError: (error) => {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    },
  });
}

// Hook to add external URL
export function useAddProjectUrl() {
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useOrganizationContext();
  const { organization, isMasterAdmin } = useUserPermissions();
  
  // Use selected org for master admins, user's org for others
  const currentOrgId = isMasterAdmin ? selectedOrganizationId : organization?.id;

  return useMutation({
    mutationFn: async ({
      url,
      campaignId,
      creatorId,
      fileType,
      fileName,
      description
    }: {
      url: string;
      campaignId: string;
      creatorId?: string;
      fileType: string;
      fileName: string;
      description?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !currentOrgId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('campaign_project_files')
        .insert({
          campaign_id: campaignId,
          creator_id: creatorId,
          file_type: fileType,
          file_name: fileName,
          file_url: url,
          uploaded_by: user.id,
          organization_id: currentOrgId,
          description,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Log timeline activity
      await supabase.rpc('log_project_activity', {
        p_campaign_id: campaignId,
        p_creator_id: creatorId,
        p_activity_type: 'file_upload',
        p_title: `URL added: ${fileName}`,
        p_description: `${fileType} URL added`,
        p_organization_id: currentOrgId
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-files'] });
      queryClient.invalidateQueries({ queryKey: ['project-timeline'] });
      toast.success('URL added successfully');
    },
    onError: (error) => {
      console.error('Error adding URL:', error);
      toast.error('Failed to add URL');
    },
  });
}

// Hook to update file status
export function useUpdateFileStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fileId,
      status,
      campaignId,
      creatorId
    }: {
      fileId: string;
      status: string;
      campaignId: string;
      creatorId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('campaign_project_files')
        .update({
          status,
          approved_by: status === 'approved' ? user.id : null,
          approved_at: status === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', fileId)
        .select()
        .single();

      if (error) throw error;

      // Log timeline activity
      await supabase.rpc('log_project_activity', {
        p_campaign_id: campaignId,
        p_creator_id: creatorId,
        p_activity_type: 'file_approval',
        p_title: `File ${status}`,
        p_description: `File status changed to ${status}`
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-files'] });
      queryClient.invalidateQueries({ queryKey: ['project-timeline'] });
      toast.success('File status updated');
    },
    onError: (error) => {
      console.error('Error updating file status:', error);
      toast.error('Failed to update file status');
    },
  });
}

// Hook to update campaign creator enhanced data
export function useUpdateCampaignCreatorEnhanced() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<CampaignCreatorEnhanced>) => {
      const { data, error } = await supabase
        .from('campaign_creators')
        .update(updates)
        .eq('id', updates.id)
        .select()
        .single();

      if (error) throw error;

      // Log timeline activity for stage changes
      if (updates.stage) {
        await supabase.rpc('log_project_activity', {
          p_campaign_id: updates.campaign_id,
          p_creator_id: updates.creator_id,
          p_activity_type: 'stage_change',
          p_title: `Stage changed to ${updates.stage}`,
          p_new_value: updates.stage
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-creators-project'] });
      queryClient.invalidateQueries({ queryKey: ['project-timeline'] });
      toast.success('Updated successfully');
    },
    onError: (error) => {
      console.error('Error updating campaign creator:', error);
      toast.error('Failed to update');
    },
  });
}