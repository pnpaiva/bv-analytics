-- Add missing content_urls column to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS content_urls JSONB DEFAULT '{}';

-- Add analytics_data column for storing processed analytics
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS analytics_data JSONB DEFAULT '{}';

-- Add analytics_updated_at column
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS analytics_updated_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_content_urls ON public.campaigns USING GIN(content_urls);

-- Update existing campaigns to have empty content_urls if null
UPDATE public.campaigns 
SET content_urls = '{}' 
WHERE content_urls IS NULL;

-- Create a simplified function to update campaign analytics
CREATE OR REPLACE FUNCTION public.update_campaign_analytics(
  p_campaign_id UUID,
  p_total_views INTEGER DEFAULT 0,
  p_total_engagement INTEGER DEFAULT 0,
  p_engagement_rate NUMERIC DEFAULT 0,
  p_analytics_data JSONB DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
END;
$$;

-- Create function to set campaign status
CREATE OR REPLACE FUNCTION public.set_campaign_status(
  p_campaign_id UUID,
  p_status TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.campaigns 
  SET 
    status = p_status,
    updated_at = now()
  WHERE id = p_campaign_id;
END;
$$;