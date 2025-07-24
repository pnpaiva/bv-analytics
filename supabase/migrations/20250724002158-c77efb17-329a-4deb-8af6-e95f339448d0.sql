-- Remove the problematic foreign key constraint
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- The user_id column should just be a UUID without foreign key constraint to auth.users
-- This is the recommended approach for Supabase

-- Also, let's make sure we have proper RLS policies for the current situation
-- First, create an admin role for the current user (admin@beyond-views.com)
INSERT INTO public.user_roles (user_id, role, created_by) 
VALUES ('b824fac2-e4e1-4061-abf5-60c6961115c1', 'admin', 'b824fac2-e4e1-4061-abf5-60c6961115c1')
ON CONFLICT (user_id, role) DO NOTHING;