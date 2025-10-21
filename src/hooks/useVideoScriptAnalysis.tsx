import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AnalyzeScriptParams {
  videoUrl: string;
  platform: string;
}

interface AnalysisResult {
  success: boolean;
  analysis: string;
  transcript: string;
  videoId: string;
  error?: string;
}

export const useVideoScriptAnalysis = () => {
  return useMutation({
    mutationFn: async ({ videoUrl, platform }: AnalyzeScriptParams): Promise<AnalysisResult> => {
      toast.info('Analyzing video script...', {
        description: 'This may take a minute',
      });

      const { data, error } = await supabase.functions.invoke('analyze-video-script', {
        body: { videoUrl, platform },
      });

      if (error) {
        console.error('Error analyzing video script:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze video script');
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Video script analyzed successfully!');
    },
    onError: (error: Error) => {
      console.error('Video script analysis error:', error);
      toast.error('Failed to analyze video script', {
        description: error.message,
      });
    },
  });
};
