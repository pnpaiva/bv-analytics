-- Fix the infinite recursion in user_roles policies
-- Drop the problematic policies and recreate them properly

DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

-- Create a security definer function to check admin role safely
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_roles.user_id = $1 
    AND user_roles.role = 'admin'::app_role
  );
$$;

-- Create safe policies using the security definer function
CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles 
FOR ALL 
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));

-- Fix missing policies for tables that need them
CREATE POLICY "System can manage client campaign assignments" 
ON public.client_campaign_assignments 
FOR ALL 
USING (true);

CREATE POLICY "System can manage error logs" 
ON public.error_logs 
FOR ALL 
USING (true);

CREATE POLICY "System can manage refresh logs" 
ON public.refresh_logs 
FOR ALL 
USING (true);