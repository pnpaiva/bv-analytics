-- Phase 1: Multi-tenant database structure (Part 3 - RLS Policies)

-- Create RLS policies for organizations table
CREATE POLICY "Master admins can manage all organizations" 
ON public.organizations 
FOR ALL 
USING (public.is_master_admin(auth.uid()));

CREATE POLICY "Users can view their organization" 
ON public.organizations 
FOR SELECT 
USING (id = public.get_user_organization(auth.uid()) OR public.is_master_admin(auth.uid()));

-- Create RLS policies for organization_members table
CREATE POLICY "Master admins can manage all organization members" 
ON public.organization_members 
FOR ALL 
USING (public.is_master_admin(auth.uid()));

CREATE POLICY "Local admins can manage their organization members" 
ON public.organization_members 
FOR ALL 
USING (
  organization_id = public.get_user_organization(auth.uid()) 
  AND public.has_organization_role(auth.uid(), organization_id, 'local_admin'::app_role)
);

CREATE POLICY "Users can view their own organization membership" 
ON public.organization_members 
FOR SELECT 
USING (user_id = auth.uid());

-- Update existing RLS policies to be organization-aware

-- Update campaigns policies
DROP POLICY IF EXISTS "Users can manage their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can view their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can manage campaigns in their organization" ON public.campaigns;
DROP POLICY IF EXISTS "Users can view campaigns in their organization" ON public.campaigns;

CREATE POLICY "Users can manage campaigns in their organization" 
ON public.campaigns 
FOR ALL 
USING (
  public.can_access_organization(auth.uid(), organization_id)
  AND (
    public.is_master_admin(auth.uid()) 
    OR public.has_organization_role(auth.uid(), organization_id, 'local_admin'::app_role)
    OR (user_id = auth.uid() AND public.has_organization_role(auth.uid(), organization_id, 'local_client'::app_role))
  )
);

CREATE POLICY "Users can view campaigns in their organization" 
ON public.campaigns 
FOR SELECT 
USING (public.can_access_organization(auth.uid(), organization_id));

-- Update clients policies
DROP POLICY IF EXISTS "Users can manage their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can manage clients in their organization" ON public.clients;

CREATE POLICY "Users can manage clients in their organization" 
ON public.clients 
FOR ALL 
USING (
  public.can_access_organization(auth.uid(), organization_id)
  AND (
    public.is_master_admin(auth.uid()) 
    OR public.has_organization_role(auth.uid(), organization_id, 'local_admin'::app_role)
  )
);

-- Update creators policies  
DROP POLICY IF EXISTS "Users can manage their own creators" ON public.creators;
DROP POLICY IF EXISTS "Users can manage creators in their organization" ON public.creators;

CREATE POLICY "Users can manage creators in their organization" 
ON public.creators 
FOR ALL 
USING (
  public.can_access_organization(auth.uid(), organization_id)
  AND (
    public.is_master_admin(auth.uid()) 
    OR public.has_organization_role(auth.uid(), organization_id, 'local_admin'::app_role)
  )
);

-- Update agencies policies
DROP POLICY IF EXISTS "Users can manage their own agencies" ON public.agencies;
DROP POLICY IF EXISTS "Users can manage agencies in their organization" ON public.agencies;

CREATE POLICY "Users can manage agencies in their organization" 
ON public.agencies 
FOR ALL 
USING (
  public.can_access_organization(auth.uid(), organization_id)
  AND (
    public.is_master_admin(auth.uid()) 
    OR public.has_organization_role(auth.uid(), organization_id, 'local_admin'::app_role)
  )
);