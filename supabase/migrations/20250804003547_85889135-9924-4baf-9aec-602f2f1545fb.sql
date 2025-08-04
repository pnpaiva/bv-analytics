-- Create table for daily URL analytics
CREATE TABLE public.campaign_url_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL,
  content_url text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('youtube', 'instagram', 'tiktok')),
  date_recorded date NOT NULL DEFAULT CURRENT_DATE,
  
  -- Daily metrics
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  engagement integer DEFAULT 0,
  engagement_rate numeric DEFAULT 0,
  
  -- Additional platform-specific metrics
  analytics_metadata jsonb DEFAULT '{}',
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(campaign_id, content_url, date_recorded),
  FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_campaign_url_analytics_campaign_id ON public.campaign_url_analytics(campaign_id);
CREATE INDEX idx_campaign_url_analytics_date ON public.campaign_url_analytics(date_recorded);
CREATE INDEX idx_campaign_url_analytics_platform ON public.campaign_url_analytics(platform);
CREATE INDEX idx_campaign_url_analytics_url ON public.campaign_url_analytics(content_url);

-- Enable RLS
ALTER TABLE public.campaign_url_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their campaign URL analytics" 
ON public.campaign_url_analytics FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c 
    WHERE c.id = campaign_url_analytics.campaign_id 
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert URL analytics" 
ON public.campaign_url_analytics FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update URL analytics" 
ON public.campaign_url_analytics FOR UPDATE 
USING (true);

CREATE POLICY "Users can manage their campaign URL analytics" 
ON public.campaign_url_analytics FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c 
    WHERE c.id = campaign_url_analytics.campaign_id 
    AND c.user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_campaign_url_analytics_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_url_analytics_updated_at
  BEFORE UPDATE ON public.campaign_url_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_campaign_url_analytics_updated_at();

-- Create function to get campaign URL analytics with aggregations
CREATE OR REPLACE FUNCTION public.get_campaign_url_analytics(
  p_campaign_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS TABLE(
  url text,
  platform text,
  total_views bigint,
  total_engagement bigint,
  avg_engagement_rate numeric,
  latest_date date,
  daily_data jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cua.content_url as url,
    cua.platform,
    COALESCE(SUM(cua.views), 0) as total_views,
    COALESCE(SUM(cua.engagement), 0) as total_engagement,
    COALESCE(AVG(cua.engagement_rate), 0) as avg_engagement_rate,
    MAX(cua.date_recorded) as latest_date,
    jsonb_agg(
      jsonb_build_object(
        'date', cua.date_recorded,
        'views', cua.views,
        'engagement', cua.engagement,
        'engagement_rate', cua.engagement_rate,
        'likes', cua.likes,
        'comments', cua.comments,
        'shares', cua.shares
      ) ORDER BY cua.date_recorded
    ) as daily_data
  FROM public.campaign_url_analytics cua
  WHERE cua.campaign_id = p_campaign_id
    AND (p_start_date IS NULL OR cua.date_recorded >= p_start_date)
    AND (p_end_date IS NULL OR cua.date_recorded <= p_end_date)
  GROUP BY cua.content_url, cua.platform
  ORDER BY total_views DESC;
END;
$$;

-- Create function to update or insert daily URL analytics
CREATE OR REPLACE FUNCTION public.upsert_campaign_url_analytics(
  p_campaign_id uuid,
  p_content_url text,
  p_platform text,
  p_date_recorded date,
  p_views integer DEFAULT 0,
  p_likes integer DEFAULT 0,
  p_comments integer DEFAULT 0,
  p_shares integer DEFAULT 0,
  p_engagement integer DEFAULT 0,
  p_engagement_rate numeric DEFAULT 0,
  p_analytics_metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.campaign_url_analytics (
    campaign_id,
    content_url,
    platform,
    date_recorded,
    views,
    likes,
    comments,
    shares,
    engagement,
    engagement_rate,
    analytics_metadata,
    fetched_at
  ) VALUES (
    p_campaign_id,
    p_content_url,
    p_platform,
    p_date_recorded,
    p_views,
    p_likes,
    p_comments,
    p_shares,
    p_engagement,
    p_engagement_rate,
    p_analytics_metadata,
    now()
  )
  ON CONFLICT (campaign_id, content_url, date_recorded)
  DO UPDATE SET
    views = EXCLUDED.views,
    likes = EXCLUDED.likes,
    comments = EXCLUDED.comments,
    shares = EXCLUDED.shares,
    engagement = EXCLUDED.engagement,
    engagement_rate = EXCLUDED.engagement_rate,
    analytics_metadata = EXCLUDED.analytics_metadata,
    fetched_at = EXCLUDED.fetched_at,
    updated_at = now();
END;
$$;

-- Create function to get campaign timeline data based on actual URL analytics
CREATE OR REPLACE FUNCTION public.get_campaign_timeline(
  p_campaign_id uuid,
  p_days_back integer DEFAULT 30
)
RETURNS TABLE(
  date_recorded date,
  total_views bigint,
  total_engagement bigint,
  engagement_rate numeric,
  platform_breakdown jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cua.date_recorded,
    COALESCE(SUM(cua.views), 0) as total_views,
    COALESCE(SUM(cua.engagement), 0) as total_engagement,
    CASE 
      WHEN SUM(cua.views) > 0 
      THEN (SUM(cua.engagement)::numeric / SUM(cua.views)) * 100
      ELSE 0 
    END as engagement_rate,
    jsonb_object_agg(
      cua.platform,
      jsonb_build_object(
        'views', COALESCE(SUM(cua.views), 0),
        'engagement', COALESCE(SUM(cua.engagement), 0),
        'url_count', COUNT(DISTINCT cua.content_url)
      )
    ) as platform_breakdown
  FROM public.campaign_url_analytics cua
  WHERE cua.campaign_id = p_campaign_id
    AND cua.date_recorded >= (CURRENT_DATE - p_days_back)
  GROUP BY cua.date_recorded
  ORDER BY cua.date_recorded;
END;
$$;