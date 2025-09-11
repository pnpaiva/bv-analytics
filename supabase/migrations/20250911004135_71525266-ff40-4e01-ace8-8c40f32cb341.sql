-- Fix search_path for all existing functions
ALTER FUNCTION public.update_campaign_url_analytics_updated_at() SET search_path = public;
ALTER FUNCTION public.update_blog_posts_updated_at() SET search_path = public;
ALTER FUNCTION public.update_waitlist_updated_at() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Create an admin account to get you started
-- Since tables exist but are empty, we need to create a user role first
INSERT INTO public.user_roles (user_id, role, created_at)
VALUES (
  'f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0'::uuid, -- Temporary placeholder
  'admin'::app_role,
  NOW()
) ON CONFLICT DO NOTHING;