import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useGenerateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ creatorId, organizationId }: { creatorId: string; organizationId: string }) => {
      const { data, error } = await supabase.rpc('generate_creator_invitation', {
        p_creator_id: creatorId,
        p_organization_id: organizationId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator-invitations'] });
      toast.success('Invitation link generated successfully');
    },
    onError: (error: any) => {
      console.error('Error generating invitation:', error);
      toast.error(error.message || 'Failed to generate invitation link');
    },
  });
}

export function useValidateInvitation(token: string | null) {
  return useQuery({
    queryKey: ['creator-invitation', token],
    queryFn: async () => {
      if (!token) return null;

      const { data, error } = await supabase.rpc('validate_creator_invitation', {
        p_token: token,
      });

      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!token,
  });
}

export function useMarkInvitationUsed() {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.rpc('mark_invitation_used', {
        p_token: token,
      });

      if (error) throw error;
      return data;
    },
    onError: (error: any) => {
      console.error('Error marking invitation as used:', error);
      toast.error(error.message || 'Failed to mark invitation as used');
    },
  });
}

export function useYouTubeConnection(creatorId: string | null) {
  return useQuery({
    queryKey: ['youtube-connection', creatorId],
    queryFn: async () => {
      if (!creatorId) return null;

      const { data, error } = await supabase
        .from('youtube_channel_connections')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!creatorId,
  });
}

export function useDisconnectYouTube() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (creatorId: string) => {
      const { error } = await supabase
        .from('youtube_channel_connections')
        .update({ is_active: false })
        .eq('creator_id', creatorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['youtube-connection'] });
      toast.success('YouTube channel disconnected successfully');
    },
    onError: (error: any) => {
      console.error('Error disconnecting YouTube:', error);
      toast.error(error.message || 'Failed to disconnect YouTube channel');
    },
  });
}
