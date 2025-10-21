-- Create table for campaign sentiment analysis
CREATE TABLE IF NOT EXISTS public.campaign_sentiment_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  content_url TEXT NOT NULL,
  platform TEXT NOT NULL,
  sentiment_score NUMERIC DEFAULT 0,
  sentiment_label TEXT,
  main_topics JSONB DEFAULT '[]'::jsonb,
  key_themes JSONB DEFAULT '[]'::jsonb,
  total_comments_analyzed INTEGER DEFAULT 0,
  analysis_metadata JSONB DEFAULT '{}'::jsonb,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(campaign_id, content_url, platform)
);

-- Enable RLS
ALTER TABLE public.campaign_sentiment_analysis ENABLE ROW LEVEL SECURITY;

-- RLS policies for sentiment analysis
CREATE POLICY "Users can view sentiment analysis in their organization"
  ON public.campaign_sentiment_analysis
  FOR SELECT
  USING (can_access_organization(auth.uid(), organization_id));

CREATE POLICY "System can manage sentiment analysis"
  ON public.campaign_sentiment_analysis
  FOR ALL
  USING (true);

-- Create index for faster lookups
CREATE INDEX idx_campaign_sentiment_campaign_id ON public.campaign_sentiment_analysis(campaign_id);
CREATE INDEX idx_campaign_sentiment_organization_id ON public.campaign_sentiment_analysis(organization_id);

-- Function to upsert sentiment analysis
CREATE OR REPLACE FUNCTION public.upsert_campaign_sentiment_analysis(
  p_campaign_id UUID,
  p_content_url TEXT,
  p_platform TEXT,
  p_sentiment_score NUMERIC,
  p_sentiment_label TEXT,
  p_main_topics JSONB,
  p_key_themes JSONB,
  p_total_comments_analyzed INTEGER,
  p_analysis_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_organization_id UUID;
  v_sentiment_id UUID;
BEGIN
  -- Get organization_id from campaign
  SELECT organization_id INTO v_organization_id
  FROM campaigns
  WHERE id = p_campaign_id;
  
  IF v_organization_id IS NULL THEN
    RAISE EXCEPTION 'Campaign not found: %', p_campaign_id;
  END IF;
  
  -- Upsert sentiment analysis
  INSERT INTO campaign_sentiment_analysis (
    campaign_id,
    organization_id,
    content_url,
    platform,
    sentiment_score,
    sentiment_label,
    main_topics,
    key_themes,
    total_comments_analyzed,
    analysis_metadata,
    analyzed_at,
    created_at,
    updated_at
  ) VALUES (
    p_campaign_id,
    v_organization_id,
    p_content_url,
    p_platform,
    p_sentiment_score,
    p_sentiment_label,
    p_main_topics,
    p_key_themes,
    p_total_comments_analyzed,
    p_analysis_metadata,
    now(),
    now(),
    now()
  )
  ON CONFLICT (campaign_id, content_url, platform)
  DO UPDATE SET
    sentiment_score = EXCLUDED.sentiment_score,
    sentiment_label = EXCLUDED.sentiment_label,
    main_topics = EXCLUDED.main_topics,
    key_themes = EXCLUDED.key_themes,
    total_comments_analyzed = EXCLUDED.total_comments_analyzed,
    analysis_metadata = EXCLUDED.analysis_metadata,
    analyzed_at = EXCLUDED.analyzed_at,
    updated_at = now()
  RETURNING id INTO v_sentiment_id;
  
  RETURN v_sentiment_id;
END;
$$;

-- Set up daily cron job to refresh campaigns automatically
-- This will run the scheduled-daily-refresh function every day at 2 AM UTC
SELECT cron.schedule(
  'daily-campaign-refresh',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url:='https://hepscjgcjnlofdpoewqx.supabase.co/functions/v1/scheduled-daily-refresh',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcHNjamdjam5sb2ZkcG9ld3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyOTQ4MDcsImV4cCI6MjA2Njg3MDgwN30.IoRGDWItYeRPIYb-6PHttOFMS_9IQGQ950pAr8oVYbQ"}'::jsonb,
    body:='{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);