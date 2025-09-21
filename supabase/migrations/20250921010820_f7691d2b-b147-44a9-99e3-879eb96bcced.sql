-- Update the upsert_campaign_url_analytics function to automatically get organization_id from campaign
DROP FUNCTION IF EXISTS public.upsert_campaign_url_analytics(uuid, text, text, date, integer, integer, integer, integer, integer, numeric, jsonb);

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
  p_analytics_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_organization_id uuid;
BEGIN
  -- Get organization_id from the campaign
  SELECT organization_id INTO v_organization_id
  FROM public.campaigns 
  WHERE id = p_campaign_id;
  
  IF v_organization_id IS NULL THEN
    RAISE EXCEPTION 'Campaign not found or missing organization_id: %', p_campaign_id;
  END IF;

  INSERT INTO public.campaign_url_analytics (
    campaign_id,
    content_url,
    platform,
    organization_id,
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
    v_organization_id,
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
$function$;