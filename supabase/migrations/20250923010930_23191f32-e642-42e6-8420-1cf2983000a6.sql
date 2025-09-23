-- Update the upsert_user_profile function to include organization_id
CREATE OR REPLACE FUNCTION public.upsert_user_profile(p_id uuid, p_display_name text DEFAULT NULL::text, p_bio text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  INSERT INTO public.profiles (id, display_name, bio, organization_id, updated_at)
  VALUES (
    p_id, 
    p_display_name, 
    p_bio, 
    (SELECT organization_id FROM public.organization_members WHERE user_id = p_id LIMIT 1),
    NOW()
  )
  ON CONFLICT (id) 
  DO UPDATE SET 
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    bio = COALESCE(EXCLUDED.bio, profiles.bio),
    updated_at = NOW()
  WHERE profiles.id = auth.uid();
$function$