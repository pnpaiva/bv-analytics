-- Create table for video script analysis results
CREATE TABLE IF NOT EXISTS public.video_script_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  content_url TEXT NOT NULL,
  platform TEXT NOT NULL,
  video_id TEXT,
  transcript TEXT,
  analysis TEXT NOT NULL,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(campaign_id, content_url, platform)
);

-- Enable RLS
ALTER TABLE public.video_script_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view script analysis for accessible campaigns"
  ON public.video_script_analysis
  FOR SELECT
  USING (
    public.can_access_campaign(auth.uid(), campaign_id)
  );

CREATE POLICY "Users can insert script analysis for accessible campaigns"
  ON public.video_script_analysis
  FOR INSERT
  WITH CHECK (
    public.can_access_campaign(auth.uid(), campaign_id)
  );

-- Create index for faster lookups
CREATE INDEX idx_video_script_analysis_campaign_id ON public.video_script_analysis(campaign_id);
CREATE INDEX idx_video_script_analysis_url ON public.video_script_analysis(content_url);

-- Create trigger for updated_at
CREATE TRIGGER update_video_script_analysis_updated_at
  BEFORE UPDATE ON public.video_script_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_trigger();