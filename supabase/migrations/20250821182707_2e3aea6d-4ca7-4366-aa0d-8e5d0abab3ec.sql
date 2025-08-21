-- Helper functions to avoid RLS recursion for public media kit access
CREATE OR REPLACE FUNCTION public.is_creator_published(p_creator_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.public_media_kits pmk
    WHERE pmk.creator_id = p_creator_id
      AND pmk.published = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_campaign_public(p_campaign_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.campaign_creators cc
    JOIN public.public_media_kits pmk ON pmk.creator_id = cc.creator_id AND pmk.published = true
    WHERE cc.campaign_id = p_campaign_id
  );
$$;

-- Replace recursive policies with function-based ones to prevent infinite recursion
DROP POLICY IF EXISTS "Public access to campaigns for published creators" ON public.campaigns;
CREATE POLICY "Public access to campaigns for published creators"
ON public.campaigns
FOR SELECT
USING (public.is_campaign_public(id));

DROP POLICY IF EXISTS "Public access to campaign_creators for published creators" ON public.campaign_creators;
CREATE POLICY "Public access to campaign_creators for published creators"
ON public.campaign_creators
FOR SELECT
USING (public.is_creator_published(creator_id));