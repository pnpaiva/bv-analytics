-- Public Media Kit support: secure RPCs for anonymous access
-- Create helper function to find a creator by slug or id (UUID)
CREATE OR REPLACE FUNCTION public.find_creator_by_slug(p_slug text)
RETURNS TABLE (
  id uuid,
  name text,
  avatar_url text,
  platform_handles jsonb
) AS $$
DECLARE
  v_uuid uuid;
  v_normalized text;
BEGIN
  -- Try UUID match
  BEGIN
    v_uuid := p_slug::uuid;
  EXCEPTION WHEN others THEN
    v_uuid := NULL;
  END;

  IF v_uuid IS NOT NULL THEN
    RETURN QUERY
      SELECT c.id, c.name, c.avatar_url, c.platform_handles
      FROM public.creators c
      WHERE c.id = v_uuid
      LIMIT 1;
    RETURN;
  END IF;

  -- Normalize slug: remove diacritics, lower, replace non-alnum with -
  v_normalized := regexp_replace(
                    lower(unaccent(p_slug)),
                    '[^a-z0-9]+', '-', 'g'
                  );

  RETURN QUERY
    SELECT c.id, c.name, c.avatar_url, c.platform_handles
    FROM public.creators c
    WHERE regexp_replace(lower(unaccent(c.name)), '[^a-z0-9]+', '-', 'g') = v_normalized
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.find_creator_by_slug(text) TO anon;

-- Aggregate public stats for a creator without exposing raw tables broadly
CREATE OR REPLACE FUNCTION public.get_public_media_kit(p_creator_id uuid)
RETURNS JSONB AS $$
DECLARE
  v_total_views bigint := 0;
  v_total_engagement bigint := 0;
  v_avg_engagement numeric := 0;
  v_campaign_count int := 0;
  v_top JSONB := '[]'::jsonb;
BEGIN
  SELECT
    COALESCE(SUM(c.total_views), 0),
    COALESCE(SUM(c.total_engagement), 0),
    COALESCE(AVG(NULLIF(c.engagement_rate, 0)), 0),
    COUNT(*)
  INTO v_total_views, v_total_engagement, v_avg_engagement, v_campaign_count
  FROM public.campaigns c
  JOIN public.campaign_creators cc ON cc.campaign_id = c.id
  WHERE cc.creator_id = p_creator_id;

  -- Top videos from analytics_data
  WITH all_analytics AS (
    SELECT a.platform, a.content_url, a.views, a.engagement
    FROM public.analytics_data a
    JOIN public.campaigns c ON c.id = a.campaign_id
    JOIN public.campaign_creators cc ON cc.campaign_id = c.id
    WHERE cc.creator_id = p_creator_id AND a.content_url IS NOT NULL
  ), ranked AS (
    SELECT platform, content_url, COALESCE(views,0) AS views, COALESCE(engagement,0) AS engagement
    FROM all_analytics
    ORDER BY views DESC NULLS LAST
    LIMIT 6
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'platform', platform,
           'url', content_url,
           'views', views,
           'engagement', engagement
         )), '[]'::jsonb)
  INTO v_top
  FROM ranked;

  RETURN jsonb_build_object(
    'totalViews', COALESCE(v_total_views, 0),
    'totalEngagement', COALESCE(v_total_engagement, 0),
    'avgEngagementRate', COALESCE(v_avg_engagement, 0),
    'campaignCount', COALESCE(v_campaign_count, 0),
    'topVideos', v_top
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_public_media_kit(uuid) TO anon;


