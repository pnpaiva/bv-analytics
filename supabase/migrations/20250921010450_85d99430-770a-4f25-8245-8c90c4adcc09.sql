-- Create missing update_campaign_analytics function that the edge function is trying to call
CREATE OR REPLACE FUNCTION public.update_campaign_analytics(
  p_campaign_id uuid,
  p_total_views integer DEFAULT 0,
  p_total_engagement integer DEFAULT 0,
  p_engagement_rate numeric DEFAULT 0,
  p_analytics_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.campaigns 
  SET 
    total_views = p_total_views,
    total_engagement = p_total_engagement,
    engagement_rate = p_engagement_rate,
    analytics_data = p_analytics_data,
    analytics_updated_at = now(),
    updated_at = now()
  WHERE id = p_campaign_id;
END;
$function$;

-- Create missing set_campaign_status function that the edge function is also trying to call
CREATE OR REPLACE FUNCTION public.set_campaign_status(
  p_campaign_id uuid,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.campaigns 
  SET 
    status = p_status,
    updated_at = now()
  WHERE id = p_campaign_id;
END;
$function$;