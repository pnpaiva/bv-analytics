-- Remove the problematic security barrier setting
DROP VIEW IF EXISTS public.public_collaborations;

-- Create a simple view without security definer properties
CREATE VIEW public.public_collaborations AS
SELECT 
    c.id,
    c.brand_name,
    c.logo_url,
    c.campaign_date,
    c.status,
    c.total_views,
    c.total_engagement,
    c.engagement_rate,
    cc.creator_id
FROM public.campaigns c
JOIN public.campaign_creators cc ON c.id = cc.campaign_id
WHERE public.is_creator_published(cc.creator_id);

-- Grant read access to the view
GRANT SELECT ON public.public_collaborations TO anon, authenticated;