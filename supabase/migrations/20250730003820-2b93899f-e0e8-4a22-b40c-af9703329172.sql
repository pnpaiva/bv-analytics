-- Create RPC functions for profile management
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id UUID)
RETURNS TABLE(
  id UUID,
  display_name TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.bio,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = user_id AND p.id = auth.uid();
END;
$$;

-- Create function to upsert user profile
CREATE OR REPLACE FUNCTION public.upsert_user_profile(
  profile_id UUID,
  display_name_param TEXT DEFAULT NULL,
  bio_param TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow users to update their own profile
  IF profile_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: Cannot update another user''s profile';
  END IF;

  INSERT INTO public.profiles (id, display_name, bio, created_at, updated_at)
  VALUES (profile_id, display_name_param, bio_param, now(), now())
  ON CONFLICT (id)
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    bio = EXCLUDED.bio,
    updated_at = now();
END;
$$;