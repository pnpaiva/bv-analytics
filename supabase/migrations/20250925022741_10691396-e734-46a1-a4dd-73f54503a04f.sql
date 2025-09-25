-- Create or replace the upsert function for campaign URL analytics
CREATE OR REPLACE FUNCTION upsert_campaign_url_analytics(
  p_campaign_id UUID,
  p_content_url TEXT,
  p_platform TEXT,
  p_date_recorded DATE,
  p_views INTEGER,
  p_likes INTEGER,
  p_comments INTEGER,
  p_shares INTEGER,
  p_engagement INTEGER,
  p_engagement_rate NUMERIC,
  p_analytics_metadata JSONB,
  p_fetched_at TIMESTAMP WITH TIME ZONE
)
RETURNS UUID AS $$
DECLARE
  v_organization_id UUID;
  v_analytics_id UUID;
BEGIN
  -- Get organization_id from the campaign
  SELECT organization_id INTO v_organization_id
  FROM campaigns
  WHERE id = p_campaign_id;
  
  -- If no organization found, raise an error
  IF v_organization_id IS NULL THEN
    RAISE EXCEPTION 'Campaign not found or no organization_id: %', p_campaign_id;
  END IF;
  
  -- Upsert the analytics data
  INSERT INTO campaign_url_analytics (
    campaign_id,
    content_url,
    platform,
    organization_id,
    date_recorded,
    views,
    likes,
    comments,
    shares,
    engagement,
    engagement_rate,
    analytics_metadata,
    fetched_at,
    created_at,
    updated_at
  ) VALUES (
    p_campaign_id,
    p_content_url,
    p_platform,
    v_organization_id,
    p_date_recorded,
    p_views,
    p_likes,
    p_comments,
    p_shares,
    p_engagement,
    p_engagement_rate,
    p_analytics_metadata,
    p_fetched_at,
    NOW(),
    NOW()
  )
  ON CONFLICT (campaign_id, content_url, platform, date_recorded)
  DO UPDATE SET
    views = EXCLUDED.views,
    likes = EXCLUDED.likes,
    comments = EXCLUDED.comments,
    shares = EXCLUDED.shares,
    engagement = EXCLUDED.engagement,
    engagement_rate = EXCLUDED.engagement_rate,
    analytics_metadata = EXCLUDED.analytics_metadata,
    fetched_at = EXCLUDED.fetched_at,
    updated_at = NOW()
  RETURNING id INTO v_analytics_id;
  
  RETURN v_analytics_id;
END;
$$ LANGUAGE plpgsql;