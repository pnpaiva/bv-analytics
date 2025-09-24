-- Fix publish_public_media_kit function to properly handle conflicts
CREATE OR REPLACE FUNCTION public.publish_public_media_kit(
  p_creator_id UUID,
  p_user_id UUID
)
RETURNS TABLE(slug TEXT)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH upsert AS (
    INSERT INTO public.public_media_kits (
      creator_id,
      user_id,
      organization_id,
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
      c.organization_id,
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
    RETURNING public_media_kits.slug
  )
  SELECT slug FROM upsert
  UNION ALL
  SELECT pmk.slug FROM public.public_media_kits pmk 
  WHERE pmk.creator_id = p_creator_id AND NOT EXISTS (SELECT 1 FROM upsert);
$$;