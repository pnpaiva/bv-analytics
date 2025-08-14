-- Enhanced security for api_credentials table
-- Fix the identified security concerns

-- 1. Add additional RLS policies for better granular control
DROP POLICY IF EXISTS "Users can manage their own API credentials" ON public.api_credentials;

-- More restrictive policies - separate read/write permissions
CREATE POLICY "Users can view their own API credentials" 
ON public.api_credentials 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own API credentials" 
ON public.api_credentials 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own API credentials" 
ON public.api_credentials 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own API credentials" 
ON public.api_credentials 
FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- 2. Add audit logging function for credential access
CREATE OR REPLACE FUNCTION public.log_credential_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log credential access attempts
  INSERT INTO public.error_logs (error_message, context)
  VALUES (
    'API credential accessed',
    jsonb_build_object(
      'user_id', auth.uid(),
      'platform', COALESCE(NEW.platform, OLD.platform),
      'action', TG_OP,
      'timestamp', now()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- 3. Create trigger for audit logging
DROP TRIGGER IF EXISTS audit_credential_access ON public.api_credentials;
CREATE TRIGGER audit_credential_access
  AFTER INSERT OR UPDATE OR DELETE ON public.api_credentials
  FOR EACH ROW EXECUTE FUNCTION public.log_credential_access();

-- 4. Add function to obfuscate credential metadata for display
CREATE OR REPLACE FUNCTION public.get_user_credential_summary()
RETURNS TABLE (
  id uuid,
  platform text,
  credential_type text,
  has_credentials boolean,
  expires_at timestamp with time zone,
  created_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.id,
    ac.platform,
    ac.credential_type,
    (ac.encrypted_value IS NOT NULL AND length(ac.encrypted_value) > 0) as has_credentials,
    ac.expires_at,
    ac.created_at
  FROM public.api_credentials ac
  WHERE ac.user_id = auth.uid();
END;
$$;

-- 5. Create a secure function for credential rotation
CREATE OR REPLACE FUNCTION public.rotate_api_credential(
  credential_id uuid,
  new_encrypted_value text,
  new_expires_at timestamp with time zone DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  credential_exists boolean;
BEGIN
  -- Check if credential exists and belongs to user
  SELECT EXISTS(
    SELECT 1 FROM public.api_credentials 
    WHERE id = credential_id AND user_id = auth.uid()
  ) INTO credential_exists;
  
  IF NOT credential_exists THEN
    RAISE EXCEPTION 'Credential not found or access denied';
  END IF;
  
  -- Update credential with new encrypted value
  UPDATE public.api_credentials 
  SET 
    encrypted_value = new_encrypted_value,
    expires_at = new_expires_at,
    updated_at = now()
  WHERE id = credential_id AND user_id = auth.uid();
  
  RETURN true;
END;
$$;