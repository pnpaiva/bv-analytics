-- Phase 1: Multi-tenant database structure with organizations (Part 1 - Enum and base tables)

-- 1. Update app_role enum to include new roles
ALTER TYPE public.app_role ADD VALUE 'master_admin';
ALTER TYPE public.app_role ADD VALUE 'local_admin';
ALTER TYPE public.app_role ADD VALUE 'local_client';

-- 2. Create organizations table
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

-- 5. Create triggers for updated_at columns
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON public.organization_members  
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();