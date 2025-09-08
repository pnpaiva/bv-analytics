-- Fix get_campaign_timeline function to avoid nested aggregate functions
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
  WITH daily_totals AS (
    SELECT 
      cua.date_recorded,
      COALESCE(SUM(cua.views), 0) as total_views,
      COALESCE(SUM(cua.engagement), 0) as total_engagement,
      CASE 
        WHEN SUM(cua.views) > 0 
        THEN (SUM(cua.engagement)::numeric / SUM(cua.views)) * 100
        ELSE 0 
      END as engagement_rate
    FROM public.campaign_url_analytics cua
    WHERE cua.campaign_id = p_campaign_id
      AND cua.date_recorded >= (CURRENT_DATE - p_days_back)
    GROUP BY cua.date_recorded
  ),
  platform_breakdowns AS (
    SELECT 
      cua.date_recorded,
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
  )
  SELECT 
    dt.date_recorded,
    dt.total_views,
    dt.total_engagement,
    dt.engagement_rate,
    COALESCE(pb.platform_breakdown, '{}'::jsonb) as platform_breakdown
  FROM daily_totals dt
  LEFT JOIN platform_breakdowns pb ON dt.date_recorded = pb.date_recorded
  ORDER BY dt.date_recorded;
END;
$$;
