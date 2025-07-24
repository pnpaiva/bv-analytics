-- Remove the outdated constraint that requires creator_id to be non-null
-- since we now use the campaign_creators table for creator relationships
ALTER TABLE public.campaigns DROP CONSTRAINT master_campaign_template_check;