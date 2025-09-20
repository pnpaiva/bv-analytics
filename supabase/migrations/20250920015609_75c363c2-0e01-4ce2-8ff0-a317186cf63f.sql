-- Create blog analytics table
CREATE TABLE public.blog_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_post_id UUID NOT NULL,
  date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  time_on_page INTEGER DEFAULT 0, -- in seconds
  bounce_rate NUMERIC DEFAULT 0,
  referrer_source TEXT,
  organization_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_blog_analytics_per_day UNIQUE (blog_post_id, date_recorded)
);

-- Enable RLS
ALTER TABLE public.blog_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for blog analytics
CREATE POLICY "Users can view blog analytics in their organization" 
ON public.blog_analytics 
FOR SELECT 
USING (can_access_organization(auth.uid(), organization_id));

CREATE POLICY "System can insert blog analytics" 
ON public.blog_analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update blog analytics" 
ON public.blog_analytics 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can manage blog analytics in their organization" 
ON public.blog_analytics 
FOR ALL 
USING (can_access_organization(auth.uid(), organization_id) AND (is_master_admin(auth.uid()) OR has_organization_role(auth.uid(), organization_id, 'local_admin'::app_role)));

-- Create function to upsert blog analytics
CREATE OR REPLACE FUNCTION public.upsert_blog_analytics(
  p_blog_post_id UUID,
  p_date_recorded DATE DEFAULT CURRENT_DATE,
  p_views INTEGER DEFAULT 1,
  p_unique_views INTEGER DEFAULT 1,
  p_time_on_page INTEGER DEFAULT 0,
  p_referrer_source TEXT DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    p_date_recorded,
    p_views,
    p_unique_views,
    p_time_on_page,
    p_referrer_source,
    COALESCE(p_organization_id, (SELECT organization_id FROM blog_posts WHERE id = p_blog_post_id))
  )
  ON CONFLICT (blog_post_id, date_recorded)
  DO UPDATE SET
    views = blog_analytics.views + EXCLUDED.views,
    unique_views = GREATEST(blog_analytics.unique_views, EXCLUDED.unique_views),
    time_on_page = (blog_analytics.time_on_page + EXCLUDED.time_on_page) / 2,
    referrer_source = COALESCE(EXCLUDED.referrer_source, blog_analytics.referrer_source),
    updated_at = now();
END;
$$;

-- Create function to get blog analytics summary
CREATE OR REPLACE FUNCTION public.get_blog_analytics_summary(
  p_organization_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
) RETURNS TABLE(
  total_views BIGINT,
  total_unique_views BIGINT,
  avg_time_on_page NUMERIC,
  avg_bounce_rate NUMERIC,
  top_posts JSONB,
  daily_views JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH analytics_data AS (
    SELECT 
      ba.*,
      bp.title,
      bp.slug
    FROM public.blog_analytics ba
    JOIN public.blog_posts bp ON ba.blog_post_id = bp.id
    WHERE ba.organization_id = p_organization_id
      AND (p_start_date IS NULL OR ba.date_recorded >= p_start_date)
      AND (p_end_date IS NULL OR ba.date_recorded <= p_end_date)
  ),
  summary_stats AS (
    SELECT 
      COALESCE(SUM(views), 0) as total_views,
      COALESCE(SUM(unique_views), 0) as total_unique_views,
      COALESCE(AVG(time_on_page), 0) as avg_time_on_page,
      COALESCE(AVG(bounce_rate), 0) as avg_bounce_rate
    FROM analytics_data
  ),
  top_posts_data AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'title', title,
        'slug', slug,
        'total_views', sum_views,
        'avg_time_on_page', avg_time
      )
      ORDER BY sum_views DESC
    ) as top_posts
    FROM (
      SELECT 
        title,
        slug,
        SUM(views) as sum_views,
        AVG(time_on_page) as avg_time
      FROM analytics_data
      GROUP BY blog_post_id, title, slug
      ORDER BY sum_views DESC
      LIMIT 10
    ) top_posts_query
  ),
  daily_data AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'date', date_recorded,
        'views', daily_views,
        'unique_views', daily_unique_views
      )
      ORDER BY date_recorded
    ) as daily_views
    FROM (
      SELECT 
        date_recorded,
        SUM(views) as daily_views,
        SUM(unique_views) as daily_unique_views
      FROM analytics_data
      GROUP BY date_recorded
      ORDER BY date_recorded
    ) daily_query
  )
  SELECT 
    ss.total_views,
    ss.total_unique_views,
    ss.avg_time_on_page,
    ss.avg_bounce_rate,
    COALESCE(tpd.top_posts, '[]'::jsonb),
    COALESCE(dd.daily_views, '[]'::jsonb)
  FROM summary_stats ss
  CROSS JOIN top_posts_data tpd
  CROSS JOIN daily_data dd;
END;
$$;