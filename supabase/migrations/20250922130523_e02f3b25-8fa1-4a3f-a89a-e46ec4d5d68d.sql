-- Create campaign project management tables

-- Add project management fields to campaign_creators table
ALTER TABLE public.campaign_creators 
ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_due_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS contact_status TEXT DEFAULT 'not_contacted',
ADD COLUMN IF NOT EXISTS deadline DATE,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';

-- Create campaign project stages reference table
CREATE TABLE IF NOT EXISTS public.campaign_project_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#6B7280',
  organization_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on campaign_project_stages
ALTER TABLE public.campaign_project_stages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for campaign_project_stages
CREATE POLICY "Users can manage project stages in their organization" 
ON public.campaign_project_stages 
FOR ALL 
USING (can_access_organization(auth.uid(), organization_id) AND (is_master_admin(auth.uid()) OR has_organization_role(auth.uid(), organization_id, 'local_admin'::app_role)));

CREATE POLICY "Users can view project stages in their organization" 
ON public.campaign_project_stages 
FOR SELECT 
USING (can_access_organization(auth.uid(), organization_id));

-- Insert default project stages for existing organizations
INSERT INTO public.campaign_project_stages (name, description, sort_order, color, organization_id)
SELECT 
  stage_name,
  stage_description,
  stage_order,
  stage_color,
  o.id as organization_id
FROM (
  VALUES 
    ('Not Started', 'Initial stage - creator not yet contacted', 0, '#6B7280'),
    ('Contacted', 'Creator has been reached out to', 1, '#F59E0B'),
    ('Negotiating', 'In discussions about terms and payment', 2, '#3B82F6'),
    ('Confirmed', 'Creator has agreed and contract is signed', 3, '#10B981'),
    ('Brief Sent', 'Creative brief and requirements sent to creator', 4, '#8B5CF6'),
    ('Content Creation', 'Creator is working on the content', 5, '#F97316'),
    ('Review', 'Content submitted and under review', 6, '#06B6D4'),
    ('Approved', 'Content approved and ready for publishing', 7, '#84CC16'),
    ('Published', 'Content has been published', 8, '#22C55E'),
    ('Completed', 'Campaign fully completed and paid', 9, '#059669')
) as stages(stage_name, stage_description, stage_order, stage_color)
CROSS JOIN public.organizations o
ON CONFLICT DO NOTHING;

-- Create campaign project notes table for detailed tracking
CREATE TABLE IF NOT EXISTS public.campaign_project_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  creator_id UUID,
  note_type TEXT DEFAULT 'general', -- 'general', 'payment', 'content', 'contact'
  title TEXT,
  content TEXT NOT NULL,
  created_by UUID NOT NULL,
  organization_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on campaign_project_notes
ALTER TABLE public.campaign_project_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for campaign_project_notes
CREATE POLICY "Users can manage project notes in their organization" 
ON public.campaign_project_notes 
FOR ALL 
USING (can_access_organization(auth.uid(), organization_id) AND (is_master_admin(auth.uid()) OR has_organization_role(auth.uid(), organization_id, 'local_admin'::app_role) OR created_by = auth.uid()));

CREATE POLICY "Users can view project notes in their organization" 
ON public.campaign_project_notes 
FOR SELECT 
USING (can_access_organization(auth.uid(), organization_id));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaign_creators_stage ON public.campaign_creators(stage);
CREATE INDEX IF NOT EXISTS idx_campaign_creators_payment_status ON public.campaign_creators(payment_status);
CREATE INDEX IF NOT EXISTS idx_campaign_project_stages_org ON public.campaign_project_stages(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaign_project_notes_campaign ON public.campaign_project_notes(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_project_notes_creator ON public.campaign_project_notes(creator_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_campaign_project_stages_updated_at
  BEFORE UPDATE ON public.campaign_project_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_project_notes_updated_at
  BEFORE UPDATE ON public.campaign_project_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();