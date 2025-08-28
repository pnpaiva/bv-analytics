-- Add niche field to creators table
ALTER TABLE public.creators 
ADD COLUMN niche text[] DEFAULT '{}';

-- Update existing creators to have empty niche arrays
UPDATE public.creators 
SET niche = '{}' 
WHERE niche IS NULL;