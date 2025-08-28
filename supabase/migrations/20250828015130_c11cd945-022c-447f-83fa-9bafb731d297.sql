-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create function to refresh all campaigns daily
CREATE OR REPLACE FUNCTION schedule_daily_campaign_refresh()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This will be called by the cron job to trigger the edge function
  PERFORM net.http_post(
    url := 'https://hepscjgcjnlofdpoewqx.supabase.co/functions/v1/refresh-campaigns-with-progress',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcHNjamdjam5sb2ZkcG9ld3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyOTQ4MDcsImV4cCI6MjA2Njg3MDgwN30.IoRGDWItYeRPIYb-6PHttOFMS_9IQGQ950pAr8oVYbQ'
    ),
    body := jsonb_build_object(
      'campaignIds', (
        SELECT array_agg(id::text) 
        FROM campaigns 
        WHERE status != 'draft'
      )
    )
  );
END;
$$;

-- Schedule daily refresh at 11:59 PM
SELECT cron.schedule(
  'daily-campaign-refresh',
  '59 23 * * *', -- Every day at 11:59 PM
  $$SELECT schedule_daily_campaign_refresh();$$
);

-- Create table for refresh summary logs
CREATE TABLE IF NOT EXISTS campaign_refresh_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_campaigns INTEGER NOT NULL DEFAULT 0,
  successful_campaigns INTEGER NOT NULL DEFAULT 0,
  failed_campaigns INTEGER NOT NULL DEFAULT 0,
  campaign_results JSONB NOT NULL DEFAULT '[]'::jsonb,
  trigger_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'scheduled', 'bulk'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on refresh logs
ALTER TABLE campaign_refresh_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for refresh logs
CREATE POLICY "Users can view refresh logs"
  ON campaign_refresh_logs
  FOR SELECT
  USING (true); -- Allow all authenticated users to view logs

CREATE POLICY "System can insert refresh logs"
  ON campaign_refresh_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update refresh logs"
  ON campaign_refresh_logs
  FOR UPDATE
  USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaign_refresh_logs_started_at ON campaign_refresh_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_campaign_performance_date ON daily_campaign_performance(date_recorded DESC);

-- Function to log refresh completion
CREATE OR REPLACE FUNCTION log_campaign_refresh_completion(
  p_log_id UUID,
  p_total_campaigns INTEGER,
  p_successful_campaigns INTEGER,
  p_failed_campaigns INTEGER,
  p_campaign_results JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE campaign_refresh_logs
  SET 
    completed_at = now(),
    total_campaigns = p_total_campaigns,
    successful_campaigns = p_successful_campaigns,
    failed_campaigns = p_failed_campaigns,
    campaign_results = p_campaign_results,
    updated_at = now()
  WHERE id = p_log_id;
END;
$$;