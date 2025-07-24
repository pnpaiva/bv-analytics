-- Create a function to help create admin accounts
CREATE OR REPLACE FUNCTION create_admin_account(
    admin_email TEXT,
    admin_password TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    new_admin_id UUID;
BEGIN
    -- This function will be called from the application
    -- The actual user creation happens via the admin API
    RETURN gen_random_uuid();
END $$;