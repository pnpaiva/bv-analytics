-- Add project_management_enabled field to organizations table
ALTER TABLE public.organizations 
ADD COLUMN project_management_enabled boolean NOT NULL DEFAULT true;