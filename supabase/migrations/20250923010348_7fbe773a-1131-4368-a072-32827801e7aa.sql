-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create project files table for managing contracts, briefs, and video files
CREATE TABLE IF NOT EXISTS public.campaign_project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  creator_id UUID,
  file_type TEXT NOT NULL CHECK (file_type IN ('contract', 'brief', 'video_for_approval', 'final_video_url', 'other')),
  file_name TEXT NOT NULL,
  file_path TEXT, -- For uploaded files
  file_url TEXT, -- For external URLs
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID NOT NULL,
  organization_id UUID NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on project files
ALTER TABLE public.campaign_project_files ENABLE ROW LEVEL SECURITY;

-- Create policies for project files
CREATE POLICY "Users can view project files in their organization" 
ON public.campaign_project_files FOR SELECT 
USING (can_access_organization(auth.uid(), organization_id));

CREATE POLICY "Users can manage project files in their organization" 
ON public.campaign_project_files FOR ALL 
USING (
  can_access_organization(auth.uid(), organization_id) AND (
    is_master_admin(auth.uid()) OR 
    has_organization_role(auth.uid(), organization_id, 'local_admin'::app_role) OR 
    uploaded_by = auth.uid()
  )
);

-- Create storage policies for project files bucket
CREATE POLICY "Users can upload files to their organization projects" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'project-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view project files in their organization" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'project-files' AND 
  EXISTS (
    SELECT 1 FROM public.campaign_project_files cpf
    WHERE cpf.file_path = storage.objects.name
    AND can_access_organization(auth.uid(), cpf.organization_id)
  )
);

CREATE POLICY "Users can update their uploaded project files" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'project-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their uploaded project files" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'project-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add timeline/activity tracking for project management
CREATE TABLE IF NOT EXISTS public.campaign_project_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  creator_id UUID,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('stage_change', 'file_upload', 'file_approval', 'note_added', 'deadline_update', 'payment_update')),
  title TEXT NOT NULL,
  description TEXT,
  old_value TEXT,
  new_value TEXT,
  performed_by UUID NOT NULL,
  organization_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on timeline
ALTER TABLE public.campaign_project_timeline ENABLE ROW LEVEL SECURITY;

-- Create policies for timeline
CREATE POLICY "Users can view timeline in their organization" 
ON public.campaign_project_timeline FOR SELECT 
USING (can_access_organization(auth.uid(), organization_id));

CREATE POLICY "System can insert timeline entries" 
ON public.campaign_project_timeline FOR INSERT 
WITH CHECK (true);

-- Add missing columns to campaign_creators for enhanced project management
ALTER TABLE public.campaign_creators 
ADD COLUMN IF NOT EXISTS contract_status TEXT DEFAULT 'not_sent' CHECK (contract_status IN ('not_sent', 'sent', 'signed', 'expired')),
ADD COLUMN IF NOT EXISTS brief_status TEXT DEFAULT 'not_sent' CHECK (brief_status IN ('not_sent', 'sent', 'received', 'approved')),
ADD COLUMN IF NOT EXISTS video_approval_status TEXT DEFAULT 'not_submitted' CHECK (video_approval_status IN ('not_submitted', 'submitted', 'approved', 'needs_revision', 'rejected')),
ADD COLUMN IF NOT EXISTS final_video_url TEXT,
ADD COLUMN IF NOT EXISTS contract_sent_date DATE,
ADD COLUMN IF NOT EXISTS contract_deadline DATE,
ADD COLUMN IF NOT EXISTS video_submission_deadline DATE,
ADD COLUMN IF NOT EXISTS final_delivery_date DATE;

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for timestamp updates
DROP TRIGGER IF EXISTS update_campaign_project_files_updated_at ON public.campaign_project_files;
CREATE TRIGGER update_campaign_project_files_updated_at
  BEFORE UPDATE ON public.campaign_project_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_trigger();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaign_project_files_campaign_creator 
ON public.campaign_project_files(campaign_id, creator_id);

CREATE INDEX IF NOT EXISTS idx_campaign_project_files_type 
ON public.campaign_project_files(file_type);

CREATE INDEX IF NOT EXISTS idx_campaign_project_timeline_campaign 
ON public.campaign_project_timeline(campaign_id, created_at DESC);

-- Create function to log timeline activities
CREATE OR REPLACE FUNCTION public.log_project_activity(
  p_campaign_id UUID,
  p_creator_id UUID DEFAULT NULL,
  p_activity_type TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_old_value TEXT DEFAULT NULL,
  p_new_value TEXT DEFAULT NULL,
  p_performed_by UUID DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
DECLARE
  v_organization_id UUID;
  v_performed_by UUID;
BEGIN
  -- Get organization_id if not provided
  IF p_organization_id IS NULL THEN
    SELECT organization_id INTO v_organization_id
    FROM public.campaigns 
    WHERE id = p_campaign_id;
  ELSE
    v_organization_id := p_organization_id;
  END IF;
  
  -- Get user if not provided
  IF p_performed_by IS NULL THEN
    v_performed_by := auth.uid();
  ELSE
    v_performed_by := p_performed_by;
  END IF;
  
  INSERT INTO public.campaign_project_timeline (
    campaign_id,
    creator_id,
    activity_type,
    title,
    description,
    old_value,
    new_value,
    performed_by,
    organization_id,
    metadata
  ) VALUES (
    p_campaign_id,
    p_creator_id,
    p_activity_type,
    p_title,
    p_description,
    p_old_value,
    p_new_value,
    v_performed_by,
    v_organization_id,
    p_metadata
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;