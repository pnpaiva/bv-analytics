-- Add view-only mode field to user_roles table
-- This allows admins to set clients to view-only mode (read-only access)

-- Add the is_view_only column with default value false
ALTER TABLE public.user_roles 
ADD COLUMN is_view_only BOOLEAN NOT NULL DEFAULT false;

-- Add comment to explain the field
COMMENT ON COLUMN public.user_roles.is_view_only IS 'When true, client users have read-only access to the platform';

-- Update the app_role enum to include a comment about view-only mode
COMMENT ON TYPE public.app_role IS 'User roles: admin (full access), client (limited access, can be view-only)';

-- Create an index on is_view_only for better query performance
CREATE INDEX idx_user_roles_is_view_only ON public.user_roles(is_view_only);

-- Update existing functions to consider view-only mode
CREATE OR REPLACE FUNCTION public.can_user_create_content(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    role = 'admin' OR 
    (role = 'client' AND is_view_only = false)
  FROM public.user_roles 
  WHERE user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.can_user_edit_content(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    role = 'admin' OR 
    (role = 'client' AND is_view_only = false)
  FROM public.user_roles 
  WHERE user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.can_user_delete_content(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role = 'admin'
  FROM public.user_roles 
  WHERE user_id = _user_id
$$;
