-- Add master campaign columns to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS master_campaign_name text,
ADD COLUMN IF NOT EXISTS master_campaign_start_date date,
ADD COLUMN IF NOT EXISTS master_campaign_end_date date,
ADD COLUMN IF NOT EXISTS master_campaign_logo_url text;

-- Create agencies table  
CREATE TABLE IF NOT EXISTS public.agencies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  contact_name text,
  contact_email text,
  contact_phone text,
  website text,
  notes text,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security for agencies
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- Create policies for agencies
CREATE POLICY "Users can manage their own agencies" 
ON public.agencies 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create trigger for agencies updated_at
CREATE TRIGGER update_agencies_updated_at
BEFORE UPDATE ON public.agencies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();