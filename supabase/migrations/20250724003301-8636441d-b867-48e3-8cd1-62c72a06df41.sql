-- Fix the search path security issue for the new trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only assign role if user doesn't already have one
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role, created_by)
    VALUES (NEW.id, 'client', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;