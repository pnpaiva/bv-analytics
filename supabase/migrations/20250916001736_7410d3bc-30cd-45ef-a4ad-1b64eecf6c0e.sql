-- Phase 1: Multi-tenant database structure (Part 2 - Data migration and security)

-- 1. Add organization_id to existing tables
ALTER TABLE public.campaigns ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
UPDATE public.campaigns SET organization_id = '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.campaigns ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.clients ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
UPDATE public.clients SET organization_id = '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.clients ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.creators ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
UPDATE public.creators SET organization_id = '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.creators ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.agencies ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
UPDATE public.agencies SET organization_id = '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.agencies ALTER COLUMN organization_id SET NOT NULL;

-- 2. Migrate existing user_roles to organization_members
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

-- 3. Create security definer functions for organization-aware access
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

-- 4. Create indexes for performance
CREATE INDEX idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX idx_campaigns_organization_id ON public.campaigns(organization_id);
CREATE INDEX idx_clients_organization_id ON public.clients(organization_id);
CREATE INDEX idx_creators_organization_id ON public.creators(organization_id);
CREATE INDEX idx_agencies_organization_id ON public.agencies(organization_id);