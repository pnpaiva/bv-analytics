import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StoredAnalysis {
  id: string;
  content_url: string;
  platform: string;
  transcript: string | null;
  analysis: string;
  analyzed_at: string;
}

export const useStoredScriptAnalysis = (campaignId: string, contentUrl: string) => {
  return useQuery({
    queryKey: ['script-analysis', campaignId, contentUrl],
    queryFn: async (): Promise<StoredAnalysis | null> => {
      const { data, error } = await supabase
        .from('video_script_analysis')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('content_url', contentUrl)
        .order('analyzed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching stored analysis:', error);
        return null;
      }

      return data;
    },
    enabled: !!campaignId && !!contentUrl,
  });
};
