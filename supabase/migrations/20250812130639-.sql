-- Tighten RLS on youtube_analytics to prevent public access
-- Ensure RLS is enabled
ALTER TABLE public.youtube_analytics ENABLE ROW LEVEL SECURITY;

-- Remove overly permissive policy that allowed anyone to manage this table
DROP POLICY IF EXISTS "System can manage YouTube analytics" ON public.youtube_analytics;

-- Note: We keep the existing SELECT policy that restricts reads to owners via creator_roster linkage:
-- "Users can view their YouTube analytics" FOR SELECT USING (
--   EXISTS (
--     SELECT 1 FROM public.creator_roster cr
--     WHERE cr.id = youtube_analytics.creator_roster_id AND cr.user_id = auth.uid()
--   )
-- );

-- With no INSERT/UPDATE/DELETE policies present, writes are denied by default for clients,
-- while SECURITY DEFINER functions and service role operations continue to work.