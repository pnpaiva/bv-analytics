-- Update the existing update_campaign_analytics function to check for milestones
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
    status = 'completed',
    updated_at = now()
  WHERE id = p_campaign_id;

  -- Check for milestone achievements
  PERFORM public.check_campaign_milestones(p_campaign_id, p_total_views);
END;
$function$;

-- Fix the search path for the check_campaign_milestones function
CREATE OR REPLACE FUNCTION public.check_campaign_milestones(
  p_campaign_id UUID,
  p_new_views INTEGER
) 
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  milestone BIGINT;
  campaign_owner UUID;
  campaign_brand_name TEXT;
  campaign_client_name TEXT;
BEGIN
  -- Get campaign owner and info
  SELECT user_id, brand_name, client_name
  INTO campaign_owner, campaign_brand_name, campaign_client_name
  FROM campaigns 
  WHERE id = p_campaign_id;
  
  IF campaign_owner IS NULL THEN
    RETURN;
  END IF;
  
  -- Check each milestone threshold
  FOR milestone IN SELECT unnest(ARRAY[50000, 100000, 250000, 500000, 1000000]) LOOP
    -- If campaign has reached this milestone and we haven't recorded it yet
    IF p_new_views >= milestone AND NOT EXISTS (
      SELECT 1 FROM campaign_milestones 
      WHERE campaign_id = p_campaign_id 
      AND milestone_views = milestone
    ) THEN
      -- Record the milestone achievement
      INSERT INTO campaign_milestones (
        campaign_id, 
        milestone_views, 
        email_sent
      ) VALUES (
        p_campaign_id, 
        milestone, 
        false
      );
      
      -- Call edge function to send celebration email
      PERFORM net.http_post(
        url := 'https://hepscjgcjnlofdpoewqx.supabase.co/functions/v1/send-milestone-celebration',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcHNjamdjam5sb2ZkcG9ld3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyOTQ4MDcsImV4cCI6MjA2Njg3MDgwN30.IoRGDWItYeRPIYb-6PHttOFMS_9IQGQ950pAr8oVYbQ'
        ),
        body := jsonb_build_object(
          'campaignId', p_campaign_id,
          'milestone', milestone,
          'userId', campaign_owner,
          'brandName', campaign_brand_name,
          'clientName', campaign_client_name
        )
      );
    END IF;
  END LOOP;
END;
$function$;