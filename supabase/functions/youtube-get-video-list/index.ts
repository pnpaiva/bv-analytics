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
    const { creatorId, maxResults = 50, pageToken } = await req.json();

    if (!creatorId) {
      throw new Error('Creator ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const accessToken = await getValidAccessToken(supabase, creatorId);

    // First, get the uploads playlist ID
    const channelResponse = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!channelResponse.ok) {
      throw new Error('Failed to fetch channel details');
    }

    const channelData = await channelResponse.json();
    const uploadsPlaylistId = channelData.items[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      throw new Error('Could not find uploads playlist');
    }

    // Fetch videos from uploads playlist
    let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}`;
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }

    const playlistResponse = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!playlistResponse.ok) {
      throw new Error('Failed to fetch video list');
    }

    const playlistData = await playlistResponse.json();

    // Get video IDs to fetch detailed statistics
    const videoIds = playlistData.items.map((item: any) => item.contentDetails.videoId).join(',');

    // Fetch video statistics and content details
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!videosResponse.ok) {
      throw new Error('Failed to fetch video details');
    }

    const videosData = await videosResponse.json();

    const videos = videosData.items.map((video: any) => ({
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      publishedAt: video.snippet.publishedAt,
      thumbnails: video.snippet.thumbnails,
      tags: video.snippet.tags || [],
      duration: video.contentDetails.duration,
      viewCount: video.statistics.viewCount,
      likeCount: video.statistics.likeCount,
      commentCount: video.statistics.commentCount,
      privacyStatus: video.status?.privacyStatus,
    }));

    return new Response(
      JSON.stringify({
        videos,
        nextPageToken: playlistData.nextPageToken,
        totalResults: playlistData.pageInfo.totalResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching video list:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
