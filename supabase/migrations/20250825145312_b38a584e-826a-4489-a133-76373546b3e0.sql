-- Add new columns for fixed and variable deal values
ALTER TABLE public.campaigns 
ADD COLUMN fixed_deal_value NUMERIC DEFAULT 0,
ADD COLUMN variable_deal_value NUMERIC DEFAULT 0;

-- Migrate existing deal_value to fixed_deal_value (assuming existing values are fixed)
UPDATE public.campaigns 
SET fixed_deal_value = COALESCE(deal_value, 0)
WHERE deal_value IS NOT NULL;

-- Update the dashboard_analytics view to include the new fields
-- Note: We'll need to recreate this view to include the new columns