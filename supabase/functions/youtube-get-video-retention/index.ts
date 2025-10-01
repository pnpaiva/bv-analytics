import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getValidAccessToken(supabase: any, creatorId: string) {
  const { data: connection } = await supabase
    .from('youtube_channel_connections')
    .select('*')
    .eq('creator_id', creatorId)
    .single();

  if (!connection) {
    throw new Error('YouTube connection not found');
  }

  const expiresAt = new Date(connection.token_expires_at);
  if (expiresAt <= new Date()) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const refreshResponse = await fetch(`${supabaseUrl}/functions/v1/youtube-refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creatorId }),
    });

    if (!refreshResponse.ok) {
      throw new Error('Failed to refresh access token');
    }

    const { access_token } = await refreshResponse.json();
    return access_token;
  }

  return connection.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { creatorId, videoId, startDate, endDate } = await req.json();

    if (!creatorId || !videoId) {
      throw new Error('Creator ID and Video ID are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const accessToken = await getValidAccessToken(supabase, creatorId);

    // Default to last 28 days if not specified
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch retention and engagement metrics
    const url = 'https://youtubeanalytics.googleapis.com/v2/reports?' +
      `ids=channel==MINE` +
      `&startDate=${start}` +
      `&endDate=${end}` +
      `&metrics=audienceWatchRatio,relativeRetentionPerformance,views,averageViewDuration,averageViewPercentage` +
      `&dimensions=elapsedVideoTimeRatio` +
      `&filters=video==${videoId}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('YouTube Analytics API error:', error);
      throw new Error('Failed to fetch video retention data');
    }

    const data = await response.json();

    // Also fetch basic video metrics
    const metricsUrl = 'https://youtubeanalytics.googleapis.com/v2/reports?' +
      `ids=channel==MINE` +
      `&startDate=${start}` +
      `&endDate=${end}` +
      `&metrics=views,likes,comments,shares,estimatedMinutesWatched,subscribersGained` +
      `&filters=video==${videoId}`;

    const metricsResponse = await fetch(metricsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let metrics = {};
    if (metricsResponse.ok) {
      const metricsData = await metricsResponse.json();
      if (metricsData.rows && metricsData.rows.length > 0) {
        const [views, likes, comments, shares, watchTime, subscribers] = metricsData.rows[0];
        metrics = {
          views,
          likes,
          comments,
          shares,
          estimatedMinutesWatched: watchTime,
          subscribersGained: subscribers,
        };
      }
    }

    // Format retention data
    const retentionData = {
      videoId,
      startDate: start,
      endDate: end,
      columnHeaders: data.columnHeaders,
      rows: data.rows || [],
      metrics,
    };

    return new Response(
      JSON.stringify(retentionData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching video retention:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
