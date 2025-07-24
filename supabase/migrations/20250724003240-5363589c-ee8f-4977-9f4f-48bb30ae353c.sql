-- Allow new authenticated users to insert their own client role
CREATE POLICY "Users can create their own client role" 
ON public.user_roles 
FOR INSERT 
TO authenticated 
WITH CHECK (
  user_id = auth.uid() AND 
  role = 'client' AND
  NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid())
);

-- Create a trigger function to automatically assign client role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign role if user doesn't already have one
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role, created_by)
    VALUES (NEW.id, 'client', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically assign client role when user confirms email
CREATE OR REPLACE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user_role();