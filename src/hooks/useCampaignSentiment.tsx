import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CampaignSentiment {
  id: string;
  campaign_id: string;
  content_url: string;
  platform: string;
  sentiment_score: number;
  sentiment_label: string;
  main_topics: string[];
  key_themes: string[];
  total_comments_analyzed: number;
  analyzed_at: string;
}

export const useCampaignSentiment = (campaignId: string) => {
  return useQuery({
    queryKey: ['campaign-sentiment', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_sentiment_analysis')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('analyzed_at', { ascending: false });

      if (error) {
        console.error('Error fetching campaign sentiment:', error);
        throw error;
      }

      return data as CampaignSentiment[];
    },
    enabled: !!campaignId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useAggregateCampaignSentiment = (campaignId: string) => {
  const { data: sentiments = [], isLoading } = useCampaignSentiment(campaignId);

  const aggregate = React.useMemo(() => {
    if (sentiments.length === 0) {
      return null;
    }

    // Calculate average sentiment
    const avgSentiment = sentiments.reduce((sum, s) => sum + s.sentiment_score, 0) / sentiments.length;
    
    // Determine overall label
    let overallLabel = 'neutral';
    if (avgSentiment > 0.3) overallLabel = 'positive';
    else if (avgSentiment < -0.3) overallLabel = 'negative';

    // Aggregate all topics and themes
    const allTopics = sentiments.flatMap(s => s.main_topics);
    const allThemes = sentiments.flatMap(s => s.key_themes);

    // Count occurrences
    const topicCounts = allTopics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const themeCounts = allThemes.reduce((acc, theme) => {
      acc[theme] = (acc[theme] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get top 5 topics and themes
    const topTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);

    const topThemes = Object.entries(themeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([theme]) => theme);

    const totalComments = sentiments.reduce((sum, s) => sum + s.total_comments_analyzed, 0);

    return {
      avgSentiment,
      overallLabel,
      topTopics,
      topThemes,
      totalComments,
      urlsAnalyzed: sentiments.length
    };
  }, [sentiments]);

  return { aggregate, isLoading };
};
