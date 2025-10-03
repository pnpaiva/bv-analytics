import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, state, redirectUri } = await req.json();

    if (!code || !state) {
      throw new Error('Authorization code and state are required');
    }

    // Decode state to get creator and organization info
    const { creatorId, organizationId } = JSON.parse(atob(state));

    const clientId = Deno.env.get('YOUTUBE_OAUTH_CLIENT_ID');
    const clientSecret = Deno.env.get('YOUTUBE_OAUTH_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('YouTube OAuth credentials not configured');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      
      // Check for specific OAuth errors
      try {
        const errorData = JSON.parse(error);
        if (errorData.error === 'invalid_grant') {
          throw new Error('Authorization code expired or already used. Please try connecting again from the beginning.');
        }
      } catch (e) {
        // If parsing fails, use generic error
      }
      
      throw new Error('Failed to exchange authorization code for tokens');
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Fetch channel info from YouTube Data API
    const channelResponse = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    if (!channelResponse.ok) {
      throw new Error('Failed to fetch channel information');
    }

    const channelData = await channelResponse.json();
    if (!channelData.items || channelData.items.length === 0) {
      throw new Error('No YouTube channel found for this account');
    }

    const channel = channelData.items[0];
    const snippet = channel.snippet;
    const statistics = channel.statistics;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store connection in database
    const { data, error } = await supabase
      .from('youtube_channel_connections')
      .upsert({
        creator_id: creatorId,
        organization_id: organizationId,
        channel_id: channel.id,
        channel_title: snippet.title,
        channel_handle: snippet.customUrl || null,
        channel_description: snippet.description || null,
        profile_picture_url: snippet.thumbnails?.default?.url || null,
        subscriber_count: parseInt(statistics.subscriberCount) || 0,
        video_count: parseInt(statistics.videoCount) || 0,
        view_count: parseInt(statistics.viewCount) || 0,
        access_token,
        refresh_token,
        token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
        is_active: true,
        connected_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString(),
      }, {
        onConflict: 'creator_id,organization_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to save channel connection');
    }

    console.log('Successfully connected YouTube channel:', channel.id);

    return new Response(
      JSON.stringify({
        success: true,
        channel: {
          id: channel.id,
          title: snippet.title,
          handle: snippet.customUrl,
          subscriberCount: statistics.subscriberCount,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
