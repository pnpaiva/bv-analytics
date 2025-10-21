-- Seed some test blog analytics data for the existing blog post
-- First, get the organization_id and blog_post_id from the existing blog post
DO $$
DECLARE
  v_blog_post_id UUID;
  v_organization_id UUID;
BEGIN
  -- Get the first blog post and its organization
  SELECT id, organization_id INTO v_blog_post_id, v_organization_id
  FROM public.blog_posts
  WHERE status = 'published'
  LIMIT 1;

  -- Only seed if we found a blog post
  IF v_blog_post_id IS NOT NULL THEN
    -- Insert analytics data for the last 30 days
    INSERT INTO public.blog_analytics (blog_post_id, organization_id, date_recorded, views, unique_views, time_on_page, bounce_rate, referrer_source)
    SELECT 
      v_blog_post_id,
      v_organization_id,
      date_recorded,
      FLOOR(RANDOM() * 100 + 50)::INTEGER as views,
      FLOOR(RANDOM() * 80 + 30)::INTEGER as unique_views,
      FLOOR(RANDOM() * 300 + 60)::INTEGER as time_on_page,
      (RANDOM() * 30 + 20)::NUMERIC(5,2) as bounce_rate,
      CASE FLOOR(RANDOM() * 5)
        WHEN 0 THEN 'google.com'
        WHEN 1 THEN 'twitter.com'
        WHEN 2 THEN 'linkedin.com'
        WHEN 3 THEN 'direct'
        ELSE 'other'
      END as referrer_source
    FROM generate_series(
      CURRENT_DATE - INTERVAL '30 days',
      CURRENT_DATE,
      '1 day'::interval
    ) date_recorded
    ON CONFLICT (blog_post_id, date_recorded) DO NOTHING;
  END IF;
END $$;

-- Improve the upsert function to handle errors better
CREATE OR REPLACE FUNCTION public.upsert_blog_analytics(
  p_blog_post_id UUID,
  p_views INTEGER DEFAULT 1,
  p_unique_views INTEGER DEFAULT 1,
  p_time_on_page INTEGER DEFAULT 0,
  p_referrer_source TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_organization_id UUID;
BEGIN
  -- Get organization_id from blog_posts
  SELECT organization_id INTO v_organization_id
  FROM blog_posts
  WHERE id = p_blog_post_id;

  -- If blog post not found, exit
  IF v_organization_id IS NULL THEN
    RAISE EXCEPTION 'Blog post not found';
  END IF;

  -- Insert or update analytics
  INSERT INTO public.blog_analytics (
    blog_post_id,
    date_recorded,
    views,
    unique_views,
    time_on_page,
    referrer_source,
    organization_id
  ) VALUES (
    p_blog_post_id,
    CURRENT_DATE,
    p_views,
    p_unique_views,
    p_time_on_page,
    p_referrer_source,
    v_organization_id
  )
  ON CONFLICT (blog_post_id, date_recorded)
  DO UPDATE SET
    views = blog_analytics.views + EXCLUDED.views,
    unique_views = blog_analytics.unique_views + EXCLUDED.unique_views,
    time_on_page = CASE 
      WHEN blog_analytics.time_on_page = 0 THEN EXCLUDED.time_on_page
      WHEN EXCLUDED.time_on_page = 0 THEN blog_analytics.time_on_page
      ELSE (blog_analytics.time_on_page + EXCLUDED.time_on_page) / 2
    END,
    referrer_source = COALESCE(EXCLUDED.referrer_source, blog_analytics.referrer_source),
    updated_at = now();
END;
$$;