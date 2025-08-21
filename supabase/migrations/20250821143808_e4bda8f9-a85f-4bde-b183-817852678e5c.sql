-- Add extra profile fields to creators table
ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS demographics jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS services jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS top_videos jsonb NOT NULL DEFAULT '[]'::jsonb;