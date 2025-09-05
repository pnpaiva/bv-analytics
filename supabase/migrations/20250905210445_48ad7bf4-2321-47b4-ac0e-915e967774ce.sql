-- Create table to track milestone achievements
CREATE TABLE public.campaign_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  milestone_views BIGINT NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, milestone_views)
);

-- Enable RLS
ALTER TABLE public.campaign_milestones ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view milestones for their campaigns"
ON public.campaign_milestones
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM campaigns c 
    WHERE c.id = campaign_milestones.campaign_id 
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert milestone records"
ON public.campaign_milestones
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update milestone records"
ON public.campaign_milestones
FOR UPDATE
USING (true);

-- Create function to check and record milestone achievements
CREATE OR REPLACE FUNCTION public.check_campaign_milestones(
  p_campaign_id UUID,
  p_new_views INTEGER
) 
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
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