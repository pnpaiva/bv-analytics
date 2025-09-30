-- Create YouTube channel connections table
CREATE TABLE public.youtube_channel_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  channel_id TEXT NOT NULL,
  channel_title TEXT NOT NULL,
  channel_handle TEXT,
  channel_description TEXT,
  subscriber_count BIGINT DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  view_count BIGINT DEFAULT 0,
  profile_picture_url TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(channel_id, organization_id)
);

-- Enable RLS
ALTER TABLE public.youtube_channel_connections ENABLE ROW LEVEL SECURITY;

-- Create policies for YouTube channel connections
CREATE POLICY "Users can view YouTube connections in their organization" 
ON public.youtube_channel_connections 
FOR SELECT 
USING (can_access_organization(auth.uid(), organization_id));

CREATE POLICY "Admins can manage YouTube connections in their organization" 
ON public.youtube_channel_connections 
FOR ALL 
USING (can_access_organization(auth.uid(), organization_id) AND (is_master_admin(auth.uid()) OR has_organization_role(auth.uid(), organization_id, 'local_admin'::app_role)));

CREATE POLICY "Creators can manage their own YouTube connections" 
ON public.youtube_channel_connections 
FOR ALL 
USING (creator_id IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.creators c 
  WHERE c.id = creator_id 
  AND c.user_id = auth.uid()
  AND can_access_organization(auth.uid(), organization_id)
));

-- Create creator invitation tokens table
CREATE TABLE public.creator_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
  invitation_token TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creator_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for creator invitations
CREATE POLICY "Admins can manage invitations in their organization" 
ON public.creator_invitations 
FOR ALL 
USING (can_access_organization(auth.uid(), organization_id) AND (is_master_admin(auth.uid()) OR has_organization_role(auth.uid(), organization_id, 'local_admin'::app_role)));

-- Anyone can view invitations by token (for the invitation page)
CREATE POLICY "Anyone can view invitations by token" 
ON public.creator_invitations 
FOR SELECT 
USING (true);

-- Create function to generate invitation links
CREATE OR REPLACE FUNCTION public.generate_creator_invitation(
  p_creator_id UUID,
  p_organization_id UUID
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  
  -- Generate a secure token
  v_token := encode(gen_random_bytes(32), 'base64url');
  
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

-- Create function to validate invitation tokens
CREATE OR REPLACE FUNCTION public.validate_creator_invitation(
  p_token TEXT
) RETURNS TABLE(
  invitation_id UUID,
  organization_id UUID,
  creator_id UUID,
  creator_name TEXT,
  organization_name TEXT,
  is_valid BOOLEAN,
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ci.id as invitation_id,
    ci.organization_id,
    ci.creator_id,
    c.name as creator_name,
    o.name as organization_name,
    (ci.expires_at > now() AND ci.used_at IS NULL) as is_valid,
    ci.expires_at
  FROM public.creator_invitations ci
  LEFT JOIN public.creators c ON ci.creator_id = c.id
  LEFT JOIN public.organizations o ON ci.organization_id = o.id
  WHERE ci.invitation_token = p_token;
$$;

-- Create function to mark invitation as used
CREATE OR REPLACE FUNCTION public.mark_invitation_used(
  p_token TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.creator_invitations 
  SET used_at = now(), updated_at = now()
  WHERE invitation_token = p_token 
  AND expires_at > now() 
  AND used_at IS NULL;
  
  RETURN FOUND;
END;
$$;

-- Add updated_at trigger for YouTube connections
CREATE TRIGGER update_youtube_channel_connections_updated_at
  BEFORE UPDATE ON public.youtube_channel_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for creator invitations
CREATE TRIGGER update_creator_invitations_updated_at
  BEFORE UPDATE ON public.creator_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();