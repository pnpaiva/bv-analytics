-- Add client-campaign assignment system
-- This allows admins to control which campaigns each client can see and interact with

-- Create the client_campaign_assignments table
CREATE TABLE IF NOT EXISTS public.client_campaign_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, campaign_id)
);

-- Add comments
COMMENT ON TABLE public.client_campaign_assignments IS 'Tracks which campaigns are assigned to which client users';
COMMENT ON COLUMN public.client_campaign_assignments.client_id IS 'The client user who can access this campaign';
COMMENT ON COLUMN public.client_campaign_assignments.campaign_id IS 'The campaign the client can access';
COMMENT ON COLUMN public.client_campaign_assignments.assigned_by IS 'Admin user who made this assignment';
COMMENT ON COLUMN public.client_campaign_assignments.assigned_at IS 'When this assignment was made';

-- Create indexes for better performance
CREATE INDEX idx_client_campaign_assignments_client_id ON public.client_campaign_assignments(client_id);
CREATE INDEX idx_client_campaign_assignments_campaign_id ON public.client_campaign_assignments(campaign_id);
CREATE INDEX idx_client_campaign_assignments_assigned_by ON public.client_campaign_assignments(assigned_by);

-- Create a function to get campaigns accessible to a specific user
CREATE OR REPLACE FUNCTION public.get_user_accessible_campaigns(_user_id UUID)
RETURNS TABLE(campaign_id UUID)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT DISTINCT c.id as campaign_id
    FROM public.campaigns c
    WHERE 
        -- Admins can see all campaigns
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = _user_id AND ur.role = 'admin'
        )
        OR
        -- Clients can only see assigned campaigns
        EXISTS (
            SELECT 1 FROM public.client_campaign_assignments cca
            WHERE cca.client_id = _user_id AND cca.campaign_id = c.id
        );
$$;

-- Grant necessary permissions
GRANT SELECT ON public.client_campaign_assignments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.client_campaign_assignments TO authenticated;
GRANT USAGE ON SEQUENCE public.client_campaign_assignments_id_seq TO authenticated;
