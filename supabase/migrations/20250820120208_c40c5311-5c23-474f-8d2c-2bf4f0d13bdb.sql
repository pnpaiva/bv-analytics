-- Create public media kits table for anonymous viewing
CREATE TABLE public.public_media_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  creator_id UUID,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  platform_handles JSONB DEFAULT '{}'::jsonb,
  stats JSONB DEFAULT '{}'::jsonb,
  published BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_creator_public_kit UNIQUE (creator_id)
);

-- Enable RLS
ALTER TABLE public.public_media_kits ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view published media kits
CREATE POLICY "Anyone can view published media kits"
ON public.public_media_kits
FOR SELECT
USING (published = true);

-- Owners can manage their own media kits
CREATE POLICY "Owners can manage their media kits"
ON public.public_media_kits
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Helper: slugify a name
CREATE OR REPLACE FUNCTION public.slugify_name(input TEXT)
RETURNS TEXT 
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  s TEXT;
BEGIN
  -- Lowercase, remove accents, keep a-z0-9 only
  s := lower(input);
  s := translate(s,
      'ÁÀÂÃÄÅáàâãäåÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
      'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn');
  s := regexp_replace(s, '[^a-z0-9]+', '', 'g');
  RETURN s;
END;
$$;

-- Publisher function: creates/updates a public media kit and returns the final slug
CREATE OR REPLACE FUNCTION public.publish_public_media_kit(p_creator_id UUID, p_slug TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_name TEXT;
  v_avatar TEXT;
  v_handles JSONB := '{}'::jsonb;
  v_user UUID;
  desired_slug TEXT;
  final_slug TEXT;
  tries INT := 0;
BEGIN
  -- Verify the creator belongs to the caller
  SELECT name, avatar_url, platform_handles, user_id
  INTO v_name, v_avatar, v_handles, v_user
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

  -- Upsert the public record
  INSERT INTO public.public_media_kits (user_id, creator_id, slug, name, avatar_url, platform_handles, published, published_at)
  VALUES (auth.uid(), p_creator_id, final_slug, v_name, v_avatar, COALESCE(v_handles, '{}'::jsonb), true, now())
  ON CONFLICT (creator_id)
  DO UPDATE SET
    user_id = EXCLUDED.user_id,
    slug = EXCLUDED.slug,
    name = EXCLUDED.name,
    avatar_url = EXCLUDED.avatar_url,
    platform_handles = EXCLUDED.platform_handles,
    published = EXCLUDED.published,
    published_at = EXCLUDED.published_at,
    updated_at = now();

  RETURN final_slug;
END;
$$;

-- Generic updated_at trigger function (idempotent create)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger  
CREATE TRIGGER update_public_media_kits_updated_at
BEFORE UPDATE ON public.public_media_kits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();