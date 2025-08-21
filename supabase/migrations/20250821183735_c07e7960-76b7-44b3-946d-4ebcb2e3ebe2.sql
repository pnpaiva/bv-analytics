-- Fix creator table security issue by removing public access to sensitive contact information

-- Drop the overly permissive public access policy that exposes sensitive data
DROP POLICY IF EXISTS "Public access to creators with published media kits" ON public.creators;

-- The public_media_kits table already stores safe creator information (name, avatar_url, platform_handles)
-- This ensures public access only gets non-sensitive data through the published media kits

-- Update the public_media_kits table to include additional safe creator fields if needed
ALTER TABLE public.public_media_kits 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS demographics JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS platform_metrics JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS top_videos JSONB DEFAULT '[]'::jsonb;

-- Update the publish_public_media_kit function to include safe creator data
CREATE OR REPLACE FUNCTION public.publish_public_media_kit(p_creator_id uuid, p_slug text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_name TEXT;
  v_avatar TEXT;
  v_handles JSONB := '{}'::jsonb;
  v_bio TEXT;
  v_location TEXT;
  v_services JSONB := '[]'::jsonb;
  v_demographics JSONB := '{}'::jsonb;
  v_platform_metrics JSONB := '{}'::jsonb;
  v_top_videos JSONB := '[]'::jsonb;
  v_user UUID;
  desired_slug TEXT;
  final_slug TEXT;
  tries INT := 0;
BEGIN
  -- Verify the creator belongs to the caller and get safe data only
  SELECT 
    name, 
    avatar_url, 
    platform_handles, 
    bio,
    location,
    services,
    demographics,
    platform_metrics,
    top_videos,
    user_id
  INTO 
    v_name, 
    v_avatar, 
    v_handles, 
    v_bio,
    v_location,
    v_services,
    v_demographics,
    v_platform_metrics,
    v_top_videos,
    v_user
  FROM public.creators
  WHERE id = p_creator_id AND user_id = auth.uid();

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Creator not found or access denied';
  END IF;

  desired_slug := COALESCE(p_slug, public.slugify_name(v_name));
  IF desired_slug IS NULL OR length(desired_slug) = 0 THEN
    desired_slug := substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  END IF;

  final_slug := desired_slug;

  -- Ensure slug uniqueness
  WHILE EXISTS (SELECT 1 FROM public.public_media_kits WHERE slug = final_slug AND creator_id <> p_creator_id) LOOP
    tries := tries + 1;
    final_slug := desired_slug || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
    EXIT WHEN tries > 5;
  END LOOP;

  -- Upsert the public record with safe data only (no email, phone, or other sensitive info)
  INSERT INTO public.public_media_kits (
    user_id, 
    creator_id, 
    slug, 
    name, 
    avatar_url, 
    platform_handles,
    bio,
    location,
    services,
    demographics,
    platform_metrics,
    top_videos,
    published, 
    published_at
  )
  VALUES (
    auth.uid(), 
    p_creator_id, 
    final_slug, 
    v_name, 
    v_avatar, 
    COALESCE(v_handles, '{}'::jsonb),
    v_bio,
    v_location,
    COALESCE(v_services, '[]'::jsonb),
    COALESCE(v_demographics, '{}'::jsonb),
    COALESCE(v_platform_metrics, '{}'::jsonb),
    COALESCE(v_top_videos, '[]'::jsonb),
    true, 
    now()
  )
  ON CONFLICT (creator_id)
  DO UPDATE SET
    user_id = EXCLUDED.user_id,
    slug = EXCLUDED.slug,
    name = EXCLUDED.name,
    avatar_url = EXCLUDED.avatar_url,
    platform_handles = EXCLUDED.platform_handles,
    bio = EXCLUDED.bio,
    location = EXCLUDED.location,
    services = EXCLUDED.services,
    demographics = EXCLUDED.demographics,
    platform_metrics = EXCLUDED.platform_metrics,
    top_videos = EXCLUDED.top_videos,
    published = EXCLUDED.published,
    published_at = EXCLUDED.published_at,
    updated_at = now();

  RETURN final_slug;
END;
$function$;