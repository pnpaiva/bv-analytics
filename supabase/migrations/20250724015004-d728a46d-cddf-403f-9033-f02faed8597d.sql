-- Make creator_id nullable in campaigns table since we now use campaign_creators
ALTER TABLE public.campaigns ALTER COLUMN creator_id DROP NOT NULL;