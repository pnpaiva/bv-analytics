-- Remove the overly permissive campaign policy that exposes sensitive data
DROP POLICY IF EXISTS "Public access to campaigns for published creators" ON public.campaigns;

-- Create a secure view for public media kits that only exposes safe collaboration data
CREATE OR REPLACE VIEW public.public_collaborations AS
SELECT 
    c.id,
    c.brand_name,
    c.logo_url,
    c.campaign_date,
    c.status,
    -- Only expose aggregated/safe metrics, not detailed analytics or deal values
    c.total_views,
    c.total_engagement,
    c.engagement_rate,
    -- Do NOT expose: deal_value, client_id, client_name, detailed analytics_data, internal fields
    cc.creator_id
FROM public.campaigns c
JOIN public.campaign_creators cc ON c.id = cc.campaign_id
WHERE public.is_creator_published(cc.creator_id);

-- Grant read access to the secure view
GRANT SELECT ON public.public_collaborations TO anon, authenticated;

-- Create RLS policy for the view (though views inherit permissions)
ALTER VIEW public.public_collaborations SET (security_barrier = true);

-- Create a helper function for media kits to get safe collaboration data
CREATE OR REPLACE FUNCTION public.get_creator_collaborations(p_creator_id uuid)
RETURNS TABLE (
    brand_name text,
    logo_url text,
    total_views integer,
    total_engagement integer,
    engagement_rate numeric,
    campaign_date date
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT 
        pc.brand_name,
        pc.logo_url,
        pc.total_views,
        pc.total_engagement,
        pc.engagement_rate,
        pc.campaign_date
    FROM public.public_collaborations pc
    WHERE pc.creator_id = p_creator_id
    ORDER BY pc.campaign_date DESC;
$$;