-- Allow public access to creators that have published media kits
CREATE POLICY "Public access to creators with published media kits" 
ON public.creators 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.public_media_kits pmk 
    WHERE pmk.creator_id = creators.id 
      AND pmk.published = true
  )
);

-- Allow public access to campaigns for creators with published media kits
CREATE POLICY "Public access to campaigns for published creators" 
ON public.campaigns 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.campaign_creators cc
    JOIN public.public_media_kits pmk ON cc.creator_id = pmk.creator_id
    WHERE cc.campaign_id = campaigns.id 
      AND pmk.published = true
  )
);

-- Allow public access to campaign_creators for published creators
CREATE POLICY "Public access to campaign_creators for published creators" 
ON public.campaign_creators 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.public_media_kits pmk 
    WHERE pmk.creator_id = campaign_creators.creator_id 
      AND pmk.published = true
  )
);