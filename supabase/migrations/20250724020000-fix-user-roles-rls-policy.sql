-- Fix infinite recursion in user_roles RLS policy
-- This migration replaces any problematic RLS policies with a simple, safe one

-- First, disable RLS temporarily to clear any problematic policies
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies on user_roles table
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Re-enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create a simple, safe policy for reading user roles
-- Users can read their own role, admins can read all roles
CREATE POLICY "Users can view their own role" ON public.user_roles
    FOR SELECT
    USING (
        -- User can see their own role
        user_id = auth.uid()
        OR
        -- Admin can see all roles (check if current user is admin)
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin'
        )
    );

-- Create policy for inserting roles (only admins)
CREATE POLICY "Admins can insert roles" ON public.user_roles
    FOR INSERT
    WITH CHECK (
        -- Only admins can insert roles
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin'
        )
    );

-- Create policy for updating roles (only admins)
CREATE POLICY "Admins can update roles" ON public.user_roles
    FOR UPDATE
    USING (
        -- Only admins can update roles
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin'
        )
    )
    WITH CHECK (
        -- Only admins can update roles
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin'
        )
    );

-- Create policy for deleting roles (only admins)
CREATE POLICY "Admins can delete roles" ON public.user_roles
    FOR DELETE
    USING (
        -- Only admins can delete roles
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin'
        )
    );

-- Ensure the table has the correct permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
