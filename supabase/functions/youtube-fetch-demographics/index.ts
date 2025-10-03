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
    const { creatorId, organizationId } = await req.json();

    if (!creatorId || !organizationId) {
      throw new Error('Creator ID and Organization ID are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the YouTube connection
    const { data: connection, error: connectionError } = await supabase
      .from('youtube_channel_connections')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (connectionError || !connection) {
      throw new Error('YouTube channel not connected');
    }

    // Check if token needs refresh
    const tokenExpiresAt = new Date(connection.token_expires_at);
    const now = new Date();
    
    let accessToken = connection.access_token;
    
    if (tokenExpiresAt <= now) {
      // Token expired, refresh it
      const { data: refreshData } = await supabase.functions.invoke('youtube-refresh-token', {
        body: { creatorId, organizationId }
      });
      
      if (refreshData?.access_token) {
        accessToken = refreshData.access_token;
      } else {
        throw new Error('Failed to refresh token');
      }
    }

    // Fetch demographics data from YouTube Analytics API
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Last 90 days

    // Fetch age group demographics
    const ageResponse = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?` +
      `ids=channel==${connection.channel_id}` +
      `&startDate=${startDate}` +
      `&endDate=${endDate}` +
      `&metrics=viewerPercentage` +
      `&dimensions=ageGroup` +
      `&sort=-viewerPercentage`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // Fetch gender demographics
    const genderResponse = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?` +
      `ids=channel==${connection.channel_id}` +
      `&startDate=${startDate}` +
      `&endDate=${endDate}` +
      `&metrics=viewerPercentage` +
      `&dimensions=gender` +
      `&sort=-viewerPercentage`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // Fetch country demographics
    const countryResponse = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?` +
      `ids=channel==${connection.channel_id}` +
      `&startDate=${startDate}` +
      `&endDate=${endDate}` +
      `&metrics=viewerPercentage` +
      `&dimensions=country` +
      `&sort=-viewerPercentage` +
      `&maxResults=10`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!ageResponse.ok || !genderResponse.ok || !countryResponse.ok) {
      console.error('Failed to fetch demographics:', {
        age: await ageResponse.text(),
        gender: await genderResponse.text(),
        country: await countryResponse.text(),
      });
      throw new Error('Failed to fetch demographics from YouTube Analytics');
    }

    const ageData = await ageResponse.json();
    const genderData = await genderResponse.json();
    const countryData = await countryResponse.json();

    console.log('Demographics data fetched:', { ageData, genderData, countryData });

    // Transform the data into the format expected by the creators table
    const demographics: any = {
      age: {},
      gender: {},
      location: {},
    };

    // Process age groups
    if (ageData.rows) {
      const ageMapping: Record<string, string> = {
        'age18-24': '18-24',
        'age25-34': '25-34',
        'age35-44': '35-44',
        'age45-54': '45-54',
        'age55-64': '55+',
        'age65-': '55+',
      };

      ageData.rows.forEach((row: any[]) => {
        const ageGroup = row[0];
        const percentage = Math.round(row[1]);
        const mappedAge = ageMapping[ageGroup] || ageGroup;
        
        if (demographics.age[mappedAge]) {
          demographics.age[mappedAge] += percentage;
        } else {
          demographics.age[mappedAge] = percentage;
        }
      });
    }

    // Process gender
    if (genderData.rows) {
      genderData.rows.forEach((row: any[]) => {
        const gender = row[0].toLowerCase();
        const percentage = Math.round(row[1]);
        demographics.gender[gender] = percentage;
      });
    }

    // Process country/location
    if (countryData.rows) {
      const countryNames: Record<string, string> = {
        'US': 'United States',
        'GB': 'United Kingdom',
        'CA': 'Canada',
        'AU': 'Australia',
        'BR': 'Brazil',
        'IN': 'India',
        'DE': 'Germany',
        'FR': 'France',
        'MX': 'Mexico',
        'ES': 'Spain',
      };

      countryData.rows.forEach((row: any[]) => {
        const countryCode = row[0];
        const percentage = Math.round(row[1]);
        const countryName = countryNames[countryCode] || countryCode;
        demographics.location[countryName] = percentage;
      });
    }

    // Get current creator demographics
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('demographics')
      .eq('id', creatorId)
      .single();

    if (creatorError) {
      throw new Error('Failed to fetch creator data');
    }

    // Merge with existing demographics
    const updatedDemographics = {
      ...creator.demographics,
      youtube: demographics,
    };

    // Update the creator's demographics
    const { error: updateError } = await supabase
      .from('creators')
      .update({ 
        demographics: updatedDemographics,
        updated_at: new Date().toISOString(),
      })
      .eq('id', creatorId);

    if (updateError) {
      console.error('Failed to update creator demographics:', updateError);
      throw new Error('Failed to update creator demographics');
    }

    console.log('Successfully updated demographics for creator:', creatorId);

    return new Response(
      JSON.stringify({
        success: true,
        demographics: updatedDemographics,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching demographics:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
