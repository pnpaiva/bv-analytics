-- Create a table to link campaigns with multiple creators and their content URLs
CREATE TABLE public.campaign_creators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  content_urls JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT fk_campaign_creators_campaign 
    FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE,
  CONSTRAINT fk_campaign_creators_creator 
    FOREIGN KEY (creator_id) REFERENCES public.creators(id) ON DELETE CASCADE,
    
  -- Ensure unique campaign-creator pairs
  CONSTRAINT unique_campaign_creator UNIQUE (campaign_id, creator_id)
);

-- Enable RLS
ALTER TABLE public.campaign_creators ENABLE ROW LEVEL SECURITY;

-- RLS policies for campaign_creators
CREATE POLICY "Users can view their campaign creators"
  ON public.campaign_creators FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.campaigns c 
    WHERE c.id = campaign_creators.campaign_id 
    AND c.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their campaign creators"
  ON public.campaign_creators FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.campaigns c 
    WHERE c.id = campaign_creators.campaign_id 
    AND c.user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX idx_campaign_creators_campaign_id ON public.campaign_creators(campaign_id);
CREATE INDEX idx_campaign_creators_creator_id ON public.campaign_creators(creator_id);

-- Migrate existing data: create campaign_creators entries for existing campaigns
INSERT INTO public.campaign_creators (campaign_id, creator_id, content_urls)
SELECT 
  c.id as campaign_id,
  c.creator_id,
  c.content_urls
FROM public.campaigns c
WHERE c.creator_id IS NOT NULL;

-- Add a backup field for the old creator_id (we'll remove it later after confirming migration works)
ALTER TABLE public.campaigns ADD COLUMN old_creator_id UUID;
UPDATE public.campaigns SET old_creator_id = creator_id;

-- Clear the single creator_id and content_urls from campaigns table since they're now in campaign_creators
UPDATE public.campaigns SET creator_id = NULL, content_urls = '{}';

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_campaign_creators_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_creators_updated_at
  BEFORE UPDATE ON public.campaign_creators
  FOR EACH ROW
  EXECUTE FUNCTION public.update_campaign_creators_updated_at();