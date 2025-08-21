-- Add platform_metrics jsonb column to creators to store platform-specific metrics entered in the UI
ALTER TABLE public.creators
ADD COLUMN IF NOT EXISTS platform_metrics JSONB DEFAULT '{}'::jsonb;

-- Optional: provide a comment for clarity
COMMENT ON COLUMN public.creators.platform_metrics IS 'Platform-specific metrics per platform (youtube/instagram/tiktok): followers, engagementRate, reach, avgViews as strings.';