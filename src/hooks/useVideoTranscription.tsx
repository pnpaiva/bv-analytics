import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TranscribeVideoParams {
  videoUrl: string;
  platform: string;
}

interface TranscriptionResult {
  success: boolean;
  transcript: any;
  videoUrl: string;
  error?: string;
}

export const useVideoTranscription = () => {
  return useMutation({
    mutationFn: async ({ videoUrl, platform }: TranscribeVideoParams): Promise<TranscriptionResult> => {
      toast.info('Transcribing video...', {
        description: 'This may take a minute',
      });

      const { data, error } = await supabase.functions.invoke('transcribe-video', {
        body: { videoUrl, platform },
      });

      if (error) {
        console.error('Error transcribing video:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to transcribe video');
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Video transcribed successfully!');
    },
    onError: (error: Error) => {
      console.error('Video transcription error:', error);
      toast.error('Failed to transcribe video', {
        description: error.message,
      });
    },
  });
};
