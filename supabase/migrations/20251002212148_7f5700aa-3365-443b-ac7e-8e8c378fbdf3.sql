-- Update generate_creator_invitation to use extensions.gen_random_bytes
CREATE OR REPLACE FUNCTION public.generate_creator_invitation(p_creator_id uuid, p_organization_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_token TEXT;
  v_user_id UUID;
BEGIN
  -- Check if user has permission
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF NOT (is_master_admin(v_user_id) OR has_organization_role(v_user_id, p_organization_id, 'local_admin'::app_role)) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  
  -- Generate a secure token using extensions schema
  v_token := encode(extensions.gen_random_bytes(32), 'base64url');
  
  -- Insert the invitation
  INSERT INTO public.creator_invitations (
    organization_id,
    creator_id,
    invitation_token,
    created_by
  ) VALUES (
    p_organization_id,
    p_creator_id,
    v_token,
    v_user_id
  );
  
  RETURN v_token;
END;
$$;