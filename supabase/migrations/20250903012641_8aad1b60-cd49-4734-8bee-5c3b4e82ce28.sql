-- Create a function to refresh all campaigns automatically
-- This will be called by the cron job nightly at 11:59 PM

CREATE OR REPLACE FUNCTION refresh_all_campaigns_nightly()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    campaign_count integer;
BEGIN
    -- Get count of campaigns that need refreshing
    SELECT COUNT(*) INTO campaign_count
    FROM campaigns 
    WHERE status IN ('live', 'completed');
    
    -- Log the nightly refresh start
    INSERT INTO refresh_logs (
        operation_type,
        campaign_count,
        started_at,
        status
    ) VALUES (
        'nightly_auto_refresh',
        campaign_count,
        now(),
        'started'
    );
    
    -- The actual refresh will be handled by the Edge Function
    -- This function just logs and can be used for monitoring
    
END;
$$;

-- Create a table to log refresh operations
CREATE TABLE IF NOT EXISTS refresh_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_type TEXT NOT NULL,
    campaign_count INTEGER,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'started',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on refresh_logs
ALTER TABLE refresh_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for refresh_logs (allow all operations for authenticated users)
CREATE POLICY "Allow all operations on refresh_logs for authenticated users"
ON refresh_logs
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Schedule the nightly refresh using pg_cron
-- This will run every day at 11:59 PM
SELECT cron.schedule(
    'nightly-campaign-refresh',
    '59 23 * * *', -- 11:59 PM every day
    $$
    SELECT net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/refresh-all-campaigns-with-apify',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
        ),
        body := jsonb_build_object(
            'campaignIds', (
                SELECT jsonb_agg(id) 
                FROM campaigns 
                WHERE status IN ('live', 'completed')
            ),
            'autoRefresh', true
        )
    );
    $$
);

-- Create a function to manually trigger the nightly refresh for testing
CREATE OR REPLACE FUNCTION trigger_manual_refresh()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    -- Call the Edge Function to refresh all campaigns
    SELECT net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/refresh-all-campaigns-with-apify',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
        ),
        body := jsonb_build_object(
            'campaignIds', (
                SELECT jsonb_agg(id) 
                FROM campaigns 
                WHERE status IN ('live', 'completed')
            ),
            'manualTrigger', true
        )
    ) INTO result;
    
    RETURN result;
END;
$$;