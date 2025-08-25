-- Create daily campaign performance tracking table
CREATE TABLE public.daily_campaign_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
  total_views INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  engagement_rate NUMERIC DEFAULT 0,
  platform_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, date_recorded)
);

-- Enable Row Level Security
ALTER TABLE public.daily_campaign_performance ENABLE ROW LEVEL SECURITY;

-- Create policies for daily campaign performance
CREATE POLICY "Users can view their daily campaign performance" 
ON public.daily_campaign_performance 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.campaigns c 
  WHERE c.id = daily_campaign_performance.campaign_id 
  AND c.user_id = auth.uid()
));

CREATE POLICY "System can insert daily campaign performance" 
ON public.daily_campaign_performance 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update daily campaign performance" 
ON public.daily_campaign_performance 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_daily_campaign_performance_updated_at
BEFORE UPDATE ON public.daily_campaign_performance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to upsert daily campaign performance
CREATE OR REPLACE FUNCTION public.upsert_daily_campaign_performance(
  p_campaign_id UUID,
  p_date_recorded DATE,
  p_total_views INTEGER DEFAULT 0,
  p_total_engagement INTEGER DEFAULT 0,
  p_engagement_rate NUMERIC DEFAULT 0,
  p_platform_breakdown JSONB DEFAULT '{}'
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.daily_campaign_performance (
    campaign_id,
    date_recorded,
    total_views,
    total_engagement,
    engagement_rate,
    platform_breakdown
  ) VALUES (
    p_campaign_id,
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
$$;