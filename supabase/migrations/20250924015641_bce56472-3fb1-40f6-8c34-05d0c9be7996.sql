-- Drop and recreate get_creator_collaborations function with complete data
DROP FUNCTION IF EXISTS public.get_creator_collaborations(uuid);

CREATE OR REPLACE FUNCTION public.get_creator_collaborations(p_creator_id uuid)
RETURNS TABLE(
  campaign_id uuid, 
  brand_name text, 
  campaign_date date,
  total_views integer,
  total_engagement integer,
  engagement_rate numeric,
  logo_url text
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cc.campaign_id,
    c.brand_name,
    c.campaign_date,
    c.total_views,
    c.total_engagement,
    c.engagement_rate,
    c.logo_url
  FROM public.campaign_creators cc
  JOIN public.campaigns c ON cc.campaign_id = c.id
  WHERE cc.creator_id = p_creator_id
  ORDER BY c.campaign_date DESC;
$$;