-- Add missing columns to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS master_campaign_name TEXT,
ADD COLUMN IF NOT EXISTS master_campaign_start_date DATE,
ADD COLUMN IF NOT EXISTS master_campaign_end_date DATE;

-- Create missing functions that the code is expecting
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id UUID)
RETURNS TABLE(
  id UUID,
  display_name TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name, p.bio, p.created_at, p.updated_at
  FROM public.profiles p
  WHERE p.id = $1;
$$;

CREATE OR REPLACE FUNCTION public.upsert_user_profile(
  p_id UUID,
  p_display_name TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.profiles (id, display_name, bio, created_at, updated_at)
  VALUES (p_id, p_display_name, p_bio, NOW(), NOW())
  ON CONFLICT (id) 
  DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    bio = COALESCE(EXCLUDED.bio, profiles.bio),
    updated_at = NOW();
$$;

CREATE OR REPLACE FUNCTION public.publish_public_media_kit(
  p_creator_id UUID,
  p_user_id UUID
)
RETURNS TABLE(slug TEXT)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.public_media_kits (
    creator_id,
    user_id,
    name,
    slug,
    published,
    published_at,
    created_at,
    updated_at
  )
  SELECT 
    p_creator_id,
    p_user_id,
    c.name,
    lower(regexp_replace(c.name, '[^a-zA-Z0-9]+', '-', 'g')),
    true,
    NOW(),
    NOW(),
    NOW()
  FROM public.creators c
  WHERE c.id = p_creator_id
  ON CONFLICT (creator_id) 
  DO UPDATE SET
    published = true,
    published_at = NOW(),
    updated_at = NOW()
  RETURNING public_media_kits.slug;
$$;

CREATE OR REPLACE FUNCTION public.get_creator_collaborations(p_creator_id UUID)
RETURNS TABLE(
  campaign_id UUID,
  brand_name TEXT,
  campaign_date DATE
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cc.campaign_id,
    c.brand_name,
    c.campaign_date
  FROM public.campaign_creators cc
  JOIN public.campaigns c ON cc.campaign_id = c.id
  WHERE cc.creator_id = p_creator_id
  ORDER BY c.campaign_date DESC;
$$;