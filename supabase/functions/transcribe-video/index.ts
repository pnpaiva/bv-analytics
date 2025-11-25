import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl, platform } = await req.json();
    
    if (!videoUrl) {
      throw new Error('Video URL is required');
    }

    console.log('Transcribing video:', videoUrl, 'Platform:', platform);

    const apifyApiKey = Deno.env.get('APIFY_API_KEY');
    if (!apifyApiKey) {
      throw new Error('APIFY_API_KEY not configured');
    }

    // Call Apify actor
    const actorId = 'CVQmx5Se22zxPaWc1'; // tictechid/anoxvanzi-Transcriber
    const apifyUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${apifyApiKey}`;
    
    console.log('Starting Apify actor run...');
    
    const actorResponse = await fetch(apifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoUrl: videoUrl,
      }),
    });

    if (!actorResponse.ok) {
      const errorText = await actorResponse.text();
      console.error('Apify API error:', actorResponse.status, errorText);
      throw new Error(`Apify API returned ${actorResponse.status}: ${errorText}`);
    }

    const actorData = await actorResponse.json();
    const runId = actorData.data.id;
    console.log('Actor run started:', runId);

    // Wait for the run to complete (with timeout)
    const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes timeout
    let attempts = 0;
    let runStatus = 'RUNNING';
    
    while (runStatus === 'RUNNING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const statusResponse = await fetch(
        `https://api.apify.com/v2/acts/${actorId}/runs/${runId}?token=${apifyApiKey}`
      );
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        runStatus = statusData.data.status;
        console.log('Run status:', runStatus);
      }
      
      attempts++;
    }

    if (runStatus !== 'SUCCEEDED') {
      throw new Error(`Transcription failed or timed out. Status: ${runStatus}`);
    }

    // Get the results
    const resultsResponse = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs/${runId}/dataset/items?token=${apifyApiKey}`
    );

    if (!resultsResponse.ok) {
      throw new Error('Failed to fetch transcription results');
    }

    const results = await resultsResponse.json();
    console.log('Transcription completed successfully');

    if (!results || results.length === 0) {
      throw new Error('No transcription data received from Apify');
    }

    // Extract transcript with timestamps
    const transcriptData = results[0];
    
    return new Response(
      JSON.stringify({
        success: true,
        transcript: transcriptData.transcript || transcriptData,
        videoUrl: videoUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in transcribe-video:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
