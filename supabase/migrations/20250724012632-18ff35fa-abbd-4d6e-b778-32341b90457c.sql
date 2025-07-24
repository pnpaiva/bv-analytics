-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public) VALUES ('campaign-logos', 'campaign-logos', true);

-- Add logo_url column to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add logo_url column for master campaign logos
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS master_campaign_logo_url TEXT;

-- Create storage policies for campaign logos
CREATE POLICY "Campaign logos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'campaign-logos');

CREATE POLICY "Authenticated users can upload campaign logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'campaign-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own campaign logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'campaign-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own campaign logos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'campaign-logos' AND auth.uid() IS NOT NULL);