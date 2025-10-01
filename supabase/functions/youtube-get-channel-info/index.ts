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

  // Check if token is expired
  const expiresAt = new Date(connection.token_expires_at);
  if (expiresAt <= new Date()) {
    // Token expired, refresh it
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
    const { creatorId, channelId } = await req.json();

    if (!creatorId) {
      throw new Error('Creator ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const accessToken = await getValidAccessToken(supabase, creatorId);

    // Fetch channel data
    const url = channelId
      ? `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails,brandingSettings&id=${channelId}`
      : `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails,brandingSettings&mine=true`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('YouTube API error:', error);
      throw new Error('Failed to fetch channel information');
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      throw new Error('Channel not found');
    }

    const channel = data.items[0];

    return new Response(
      JSON.stringify({
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        customUrl: channel.snippet.customUrl,
        publishedAt: channel.snippet.publishedAt,
        thumbnails: channel.snippet.thumbnails,
        subscriberCount: channel.statistics.subscriberCount,
        videoCount: channel.statistics.videoCount,
        viewCount: channel.statistics.viewCount,
        uploads: channel.contentDetails.relatedPlaylists.uploads,
        keywords: channel.brandingSettings?.channel?.keywords,
        country: channel.snippet.country,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching channel info:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
