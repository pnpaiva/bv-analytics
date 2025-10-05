import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganizationContext } from './useOrganizationContext';

export function useYouTubeChannelInfo(creatorId: string | null) {
  return useQuery({
    queryKey: ['youtube-channel-info', creatorId],
    queryFn: async () => {
      if (!creatorId) return null;

      const { data, error } = await supabase.functions.invoke('youtube-get-channel-info', {
        body: { creatorId },
      });

      if (error) throw error;
      return data;
    },
    enabled: !!creatorId,
  });
}

export function useYouTubeVideoList(creatorId: string | null, maxResults = 50) {
  return useQuery({
    queryKey: ['youtube-video-list', creatorId, maxResults],
    queryFn: async () => {
      if (!creatorId) return null;

      const { data, error } = await supabase.functions.invoke('youtube-get-video-list', {
        body: { creatorId, maxResults },
      });

      if (error) throw error;
      return data;
    },
    enabled: !!creatorId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
}

export function useYouTubeVideoRetention(
  creatorId: string | null,
  videoId: string | null,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: ['youtube-video-retention', creatorId, videoId, startDate, endDate],
    queryFn: async () => {
      if (!creatorId || !videoId) return null;

      const { data, error } = await supabase.functions.invoke('youtube-get-video-retention', {
        body: {
          creatorId,
          videoId,
          startDate,
          endDate,
        },
      });

      if (error) {
        console.error('Error fetching retention data:', error);
        toast.error('Failed to fetch video retention data');
        throw error;
      }

      return data;
    },
    enabled: !!creatorId && !!videoId,
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
  });
}

export function useFetchYouTubeDemographics() {
  const queryClient = useQueryClient();
  const { selectedOrganizationId } = useOrganizationContext();

  return useMutation({
    mutationFn: async (creatorId: string) => {
      if (!selectedOrganizationId) {
        throw new Error('No organization selected');
      }

      const { data, error } = await supabase.functions.invoke('youtube-fetch-demographics', {
        body: { 
          creatorId,
          organizationId: selectedOrganizationId 
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creators'] });
      toast.success('YouTube demographics updated successfully');
    },
    onError: (error) => {
      console.error('Error fetching demographics:', error);
      toast.error('Failed to fetch YouTube demographics');
    },
  });
}
