-- Restrict api_cache to system-only by removing public access
-- Ensure RLS is enabled (denies access by default without explicit policies)
ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;

-- Drop overly permissive policy that allowed anyone to manage cache
DROP POLICY IF EXISTS "System can manage cache" ON public.api_cache;

-- No client-facing policies are added so reads/writes are blocked for anon/auth users.
-- Service-role keys and SECURITY DEFINER functions continue to work as intended.