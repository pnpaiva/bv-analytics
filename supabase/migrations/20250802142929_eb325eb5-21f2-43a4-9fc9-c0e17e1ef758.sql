-- Fix the campaigns status check constraint
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check;
ALTER TABLE campaigns ADD CONSTRAINT campaigns_status_check 
CHECK (status IN ('draft', 'pending', 'analyzing', 'completed', 'error'));