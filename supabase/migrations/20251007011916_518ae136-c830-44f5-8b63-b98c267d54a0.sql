-- Enable required extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to refresh all campaigns at midnight every day
-- Cron expression: 0 0 * * * means "at 00:00 (midnight) every day"
SELECT cron.schedule(
  'daily-campaign-refresh-midnight',
  '0 0 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://hepscjgcjnlofdpoewqx.supabase.co/functions/v1/scheduled-daily-refresh',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcHNjamdjam5sb2ZkcG9ld3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyOTQ4MDcsImV4cCI6MjA2Njg3MDgwN30.IoRGDWItYeRPIYb-6PHttOFMS_9IQGQ950pAr8oVYbQ"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);