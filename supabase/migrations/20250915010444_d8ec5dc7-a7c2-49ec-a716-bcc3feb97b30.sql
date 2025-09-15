-- Phase 1: Multi-tenant database structure with organizations

-- 1. Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Update app_role enum to include new roles
ALTER TYPE public.app_role ADD VALUE 'master_admin';
ALTER TYPE public.app_role ADD VALUE 'local_admin';
ALTER TYPE public.app_role ADD VALUE 'local_client';

-- 3. Create organization_members table
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Enable RLS on organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- 4. Create a default organization for existing data
INSERT INTO public.organizations (id, name, slug, settings) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Organization',
  'default-org',
  '{"is_default": true}'
);

-- 5. Add organization_id to existing tables

-- Add to campaigns
ALTER TABLE public.campaigns ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
UPDATE public.campaigns SET organization_id = '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.campaigns ALTER COLUMN organization_id SET NOT NULL;

-- Add to clients  
ALTER TABLE public.clients ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
UPDATE public.clients SET organization_id = '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.clients ALTER COLUMN organization_id SET NOT NULL;

-- Add to creators
ALTER TABLE public.creators ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
UPDATE public.creators SET organization_id = '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.creators ALTER COLUMN organization_id SET NOT NULL;

-- Add to agencies
ALTER TABLE public.agencies ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
UPDATE public.agencies SET organization_id = '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.agencies ALTER COLUMN organization_id SET NOT NULL;

-- 6. Migrate existing user_roles to organization_members
INSERT INTO public.organization_members (organization_id, user_id, role, created_by, created_at)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  user_id,
  CASE 
    WHEN role = 'admin' THEN 'master_admin'::public.app_role
    WHEN role = 'client' THEN 'local_client'::public.app_role
    ELSE role
  END,
  created_by,
  created_at
FROM public.user_roles;

-- 7. Create security definer functions for organization-aware access

-- Function to check if user is master admin
CREATE OR REPLACE FUNCTION public.is_master_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members 
    WHERE organization_members.user_id = $1 
    AND organization_members.role = 'master_admin'::app_role
  );
$$;

-- Function to get user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization(user_id UUID)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id 
  FROM public.organization_members 
  WHERE organization_members.user_id = $1 
  LIMIT 1;
$$;

-- Function to check if user has role in organization
CREATE OR REPLACE FUNCTION public.has_organization_role(user_id UUID, org_id UUID, check_role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members 
    WHERE organization_members.user_id = $1 
    AND organization_members.organization_id = $2
    AND organization_members.role = check_role
  );
$$;

-- Function to check if user can access organization (any role)
CREATE OR REPLACE FUNCTION public.can_access_organization(user_id UUID, org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members 
    WHERE organization_members.user_id = $1 
    AND (organization_members.organization_id = $2 OR public.is_master_admin($1))
  );
$$;

-- 8. Create RLS policies for organizations table
CREATE POLICY "Master admins can manage all organizations" 
ON public.organizations 
FOR ALL 
USING (public.is_master_admin(auth.uid()));

CREATE POLICY "Users can view their organization" 
ON public.organizations 
FOR SELECT 
USING (id = public.get_user_organization(auth.uid()) OR public.is_master_admin(auth.uid()));

-- 9. Create RLS policies for organization_members table
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

-- 10. Update existing RLS policies to be organization-aware

-- Update campaigns policies
DROP POLICY IF EXISTS "Users can manage their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can view their own campaigns" ON public.campaigns;

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

-- 11. Create triggers for updated_at columns
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON public.organization_members  
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Create indexes for performance
CREATE INDEX idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX idx_campaigns_organization_id ON public.campaigns(organization_id);
CREATE INDEX idx_clients_organization_id ON public.clients(organization_id);
CREATE INDEX idx_creators_organization_id ON public.creators(organization_id);
CREATE INDEX idx_agencies_organization_id ON public.agencies(organization_id);