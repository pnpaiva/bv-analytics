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
    const { creatorId } = await req.json();

    if (!creatorId) {
      throw new Error('Creator ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current connection
    const { data: connection, error: fetchError } = await supabase
      .from('youtube_channel_connections')
      .select('*')
      .eq('creator_id', creatorId)
      .single();

    if (fetchError || !connection) {
      throw new Error('YouTube connection not found');
    }

    const clientId = Deno.env.get('YOUTUBE_OAUTH_CLIENT_ID');
    const clientSecret = Deno.env.get('YOUTUBE_OAUTH_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('YouTube OAuth credentials not configured');
    }

    // Refresh the token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: connection.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token refresh failed:', error);
      throw new Error('Failed to refresh access token');
    }

    const tokens = await tokenResponse.json();
    const { access_token, expires_in } = tokens;

    // Update database with new token
    const { error: updateError } = await supabase
      .from('youtube_channel_connections')
      .update({
        access_token,
        token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('creator_id', creatorId);

    if (updateError) {
      throw new Error('Failed to update access token');
    }

    console.log('Successfully refreshed token for creator:', creatorId);

    return new Response(
      JSON.stringify({ success: true, access_token }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Token refresh error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
