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
    console.log('Fetching demographics for:', { creatorId, organizationId });

    if (!creatorId || !organizationId) {
      throw new Error('Creator ID and Organization ID are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the YouTube connection (most recent if multiple exist)
    const { data: connection, error: connectionError } = await supabase
      .from('youtube_channel_connections')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log('Connection query result:', { connection: !!connection, error: connectionError });

    if (connectionError) {
      console.error('Connection error:', connectionError);
      throw new Error(`Failed to fetch connection: ${connectionError.message}`);
    }

    if (!connection) {
      throw new Error('YouTube channel not connected for this creator');
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

    // Check for errors and log detailed information
    const errors: any = {};
    if (!ageResponse.ok) {
      const ageError = await ageResponse.text();
      errors.age = { status: ageResponse.status, error: ageError };
      console.error('Age demographics error:', errors.age);
    }
    if (!genderResponse.ok) {
      const genderError = await genderResponse.text();
      errors.gender = { status: genderResponse.status, error: genderError };
      console.error('Gender demographics error:', errors.gender);
    }
    if (!countryResponse.ok) {
      const countryError = await countryResponse.text();
      errors.country = { status: countryResponse.status, error: countryError };
      console.error('Country demographics error:', errors.country);
    }

    // If all requests failed with 400 errors, the channel likely doesn't meet minimum requirements
    if (Object.keys(errors).length >= 2) {
      const allBadRequest = Object.values(errors).every((e: any) => e.status === 400);
      if (allBadRequest) {
        console.log('Demographics unavailable - channel may not meet minimum requirements (views/watch time threshold)');
        // Return success but with empty data and a note
        const noteMessage = 'Demographics data is unavailable. YouTube requires channels to meet minimum watch time and subscriber thresholds before demographics become available.';
        
        // Store a note in the demographics
        const emptyDemographicsWithNote = {
          age: {},
          gender: {},
          location: {},
          _note: noteMessage,
          _lastAttempt: new Date().toISOString()
        };

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
          youtube: emptyDemographicsWithNote,
        };

        // Update last_synced_at on the YouTube connection
        await supabase
          .from('youtube_channel_connections')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('creator_id', creatorId)
          .eq('organization_id', organizationId);

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

        return new Response(
          JSON.stringify({
            success: true,
            demographics: updatedDemographics,
            message: noteMessage,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If forbidden errors, the scope might be missing
      const allForbidden = Object.values(errors).every((e: any) => e.status === 403);
      if (allForbidden) {
        throw new Error('YouTube Analytics API access denied. The channel may need to reconnect with proper analytics permissions.');
      }
    }

    // Continue with empty data if some endpoints fail (channel might be too small)

    const ageData = ageResponse.ok ? await ageResponse.json() : { rows: [] };
    const genderData = genderResponse.ok ? await genderResponse.json() : { rows: [] };
    const countryData = countryResponse.ok ? await countryResponse.json() : { rows: [] };

    console.log('Demographics data fetched:', { 
      ageRows: ageData.rows?.length || 0,
      genderRows: genderData.rows?.length || 0, 
      countryRows: countryData.rows?.length || 0 
    });

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

    // Update last_synced_at on the YouTube connection
    await supabase
      .from('youtube_channel_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('creator_id', creatorId)
      .eq('organization_id', organizationId);

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
    console.log('Updated demographics structure:', JSON.stringify(demographics, null, 2));

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
