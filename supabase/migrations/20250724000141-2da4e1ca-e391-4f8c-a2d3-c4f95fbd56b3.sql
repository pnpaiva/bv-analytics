-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'client');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1
$$;

-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- RLS policies for user_roles
CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles 
FOR ALL 
TO authenticated 
USING (public.is_admin());

CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Update existing table policies to ensure data isolation
-- Campaigns: Only show data for the same user
DROP POLICY IF EXISTS "Users can view their own campaigns" ON public.campaigns;
CREATE POLICY "Users can view their own campaigns" 
ON public.campaigns 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own campaigns" ON public.campaigns;
CREATE POLICY "Users can manage their own campaigns" 
ON public.campaigns 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid());

-- Creators: Only show data for the same user
DROP POLICY IF EXISTS "Users can manage their own creators" ON public.creators;
CREATE POLICY "Users can manage their own creators" 
ON public.creators 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid());

-- Clients: Only show data for the same user  
DROP POLICY IF EXISTS "Users can manage their own clients" ON public.clients;
CREATE POLICY "Users can manage their own clients" 
ON public.clients 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid());

-- Creator roster: Only show data for the same user
DROP POLICY IF EXISTS "Users can manage their own roster" ON public.creator_roster;
CREATE POLICY "Users can manage their own roster" 
ON public.creator_roster 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid());

-- API credentials: Only show data for the same user
DROP POLICY IF EXISTS "Users can manage their own API credentials" ON public.api_credentials;
CREATE POLICY "Users can manage their own API credentials" 
ON public.api_credentials 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid());

-- Insert admin role for the current database owner (you)
-- This will need to be run manually after you confirm
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ((SELECT auth.uid()), 'admin') 
-- ON CONFLICT (user_id, role) DO NOTHING;