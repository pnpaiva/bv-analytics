-- Create a temporary policy to allow the first admin creation
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

-- Allow authenticated users to create admin roles if no admins exist
CREATE POLICY "Allow first admin creation" 
ON public.user_roles 
FOR INSERT 
TO authenticated 
WITH CHECK (
  role = 'admin' AND 
  NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
);

-- Users can view their own role
CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Admins can manage all user roles (once they exist)
CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles 
FOR ALL 
TO authenticated 
USING (public.is_admin());

-- Allow admins to insert new roles
CREATE POLICY "Admins can insert new roles" 
ON public.user_roles 
FOR INSERT 
TO authenticated 
WITH CHECK (public.is_admin());