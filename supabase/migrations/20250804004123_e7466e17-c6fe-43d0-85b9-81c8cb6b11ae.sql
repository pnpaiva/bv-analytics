-- Fix security issues by adding SET search_path to the new functions

-- Update get_campaign_url_analytics function
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
SET search_path TO 'public'
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

-- Update upsert_campaign_url_analytics function
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
SET search_path TO 'public'
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

-- Update get_campaign_timeline function
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
SET search_path TO 'public'
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