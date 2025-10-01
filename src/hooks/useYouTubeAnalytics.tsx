import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
