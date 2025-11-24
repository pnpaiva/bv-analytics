-- Fix upsert_daily_campaign_performance to include organization_id
CREATE OR REPLACE FUNCTION public.upsert_daily_campaign_performance(
  p_campaign_id uuid, 
  p_date_recorded date, 
  p_total_views integer DEFAULT 0, 
  p_total_engagement integer DEFAULT 0, 
  p_engagement_rate numeric DEFAULT 0, 
  p_platform_breakdown jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_organization_id UUID;
BEGIN
  -- Get organization_id from the campaign
  SELECT organization_id INTO v_organization_id
  FROM public.campaigns
  WHERE id = p_campaign_id;
  
  -- If campaign not found, raise error
  IF v_organization_id IS NULL THEN
    RAISE EXCEPTION 'Campaign not found: %', p_campaign_id;
  END IF;

  -- Insert or update daily performance data
  INSERT INTO public.daily_campaign_performance (
    campaign_id,
    organization_id,
    date_recorded,
    total_views,
    total_engagement,
    engagement_rate,
    platform_breakdown
  ) VALUES (
    p_campaign_id,
    v_organization_id,
    p_date_recorded,
    p_total_views,
    p_total_engagement,
    p_engagement_rate,
    p_platform_breakdown
  )
  ON CONFLICT (campaign_id, date_recorded)
  DO UPDATE SET
    total_views = EXCLUDED.total_views,
    total_engagement = EXCLUDED.total_engagement,
    engagement_rate = EXCLUDED.engagement_rate,
    platform_breakdown = EXCLUDED.platform_breakdown,
    updated_at = now();
END;
$function$;