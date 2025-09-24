-- Update publish_public_media_kit function to include creator data in the media kit
CREATE OR REPLACE FUNCTION public.publish_public_media_kit(
  p_creator_id UUID,
  p_user_id UUID
)
RETURNS TABLE(slug TEXT)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH existing_kit AS (
    SELECT pmk.slug
    FROM public.public_media_kits pmk
    WHERE pmk.creator_id = p_creator_id
  ),
  upsert AS (
    INSERT INTO public.public_media_kits (
      creator_id,
      user_id,
      organization_id,
      name,
      slug,
      avatar_url,
      platform_handles,
      stats,
      published,
      published_at,
      created_at,
      updated_at
    )
    SELECT 
      p_creator_id,
      p_user_id,
      c.organization_id,
      c.name,
      lower(regexp_replace(c.name || '-' || substr(gen_random_uuid()::text, 1, 8), '[^a-zA-Z0-9]+', '-', 'g')),
      c.avatar_url,
      c.platform_handles,
      jsonb_build_object(
        'bio', c.bio,
        'location', c.location,
        'email', c.email,
        'phone', c.phone,
        'niche', c.niche,
        'services', c.services,
        'top_videos', c.top_videos,
        'demographics', c.demographics,
        'platform_metrics', c.platform_metrics
      ),
      true,
      NOW(),
      NOW(),
      NOW()
    FROM public.creators c
    WHERE c.id = p_creator_id
    AND NOT EXISTS (SELECT 1 FROM existing_kit)
    ON CONFLICT (creator_id) 
    DO UPDATE SET
      name = EXCLUDED.name,
      avatar_url = EXCLUDED.avatar_url,
      platform_handles = EXCLUDED.platform_handles,
      stats = EXCLUDED.stats,
      published = true,
      published_at = NOW(),
      updated_at = NOW()
    RETURNING public_media_kits.slug
  )
  SELECT slug FROM upsert
  UNION ALL
  SELECT slug FROM existing_kit
  WHERE EXISTS (SELECT 1 FROM existing_kit);
$$;