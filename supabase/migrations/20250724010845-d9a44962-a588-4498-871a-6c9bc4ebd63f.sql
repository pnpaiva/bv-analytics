-- Add campaign_month column to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS campaign_month TEXT;