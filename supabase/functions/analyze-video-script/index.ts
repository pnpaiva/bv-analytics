import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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

    console.log('Analyzing video script for:', videoUrl, 'Platform:', platform);

    // Extract video ID based on platform
    let videoId = '';
    if (platform === 'youtube') {
      // Extract YouTube video ID from various URL formats
      const urlPatterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
        /youtube\.com\/watch\?.*v=([^&]+)/
      ];
      
      for (const pattern of urlPatterns) {
        const match = videoUrl.match(pattern);
        if (match) {
          videoId = match[1];
          break;
        }
      }
      
      if (!videoId) {
        throw new Error('Could not extract YouTube video ID from URL');
      }
    } else {
      throw new Error(`Transcription for ${platform} is not yet supported. Currently only YouTube is supported.`);
    }

    console.log('Extracted video ID:', videoId);

    // Get transcript from SearchAPI.io
    const searchApiKey = Deno.env.get('SEARCHAPI_KEY');
    if (!searchApiKey) {
      throw new Error('SEARCHAPI_KEY not configured');
    }

    const transcriptUrl = `https://www.searchapi.io/api/v1/search?engine=youtube_transcripts&video_id=${videoId}&api_key=${searchApiKey}`;
    console.log('Fetching transcript from SearchAPI...');
    
    const transcriptResponse = await fetch(transcriptUrl);
    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text();
      console.error('SearchAPI error:', transcriptResponse.status, errorText);
      throw new Error(`Failed to fetch transcript: ${transcriptResponse.status} ${errorText}`);
    }

    const transcriptData = await transcriptResponse.json();
    console.log('Transcript data received:', JSON.stringify(transcriptData).substring(0, 500));

    // Extract transcript text
    let transcriptText = '';
    if (transcriptData.transcripts && Array.isArray(transcriptData.transcripts) && transcriptData.transcripts.length > 0) {
      // Join all transcript segments
      transcriptText = transcriptData.transcripts
        .map((segment: any) => segment.text || '')
        .join(' ');
    } else if (transcriptData.error) {
      throw new Error(`Transcript error: ${transcriptData.error}`);
    } else {
      throw new Error('No transcript available for this video');
    }

    if (!transcriptText || transcriptText.trim().length === 0) {
      throw new Error('Transcript is empty');
    }

    console.log('Transcript extracted, length:', transcriptText.length, 'characters');

    // Analyze with OpenAI
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const systemPrompt = `You are a professional content strategist specializing in video content analysis. Analyze the provided video transcript and evaluate it based on proven content best practices.

Focus on three key elements:
1. **Hook** (First 3-5 seconds): Does it grab attention immediately? Is it compelling?
2. **Intro** (First 15-30 seconds): Does it establish value proposition? Does it promise what viewers will get?
3. **Story Development**: Is there a clear narrative arc? Are there engaging moments? Is pacing good?

Provide specific, actionable feedback on what worked well and what could be improved for each element.`;

    const userPrompt = `Analyze this video transcript and provide detailed feedback on the hook, intro, and story development:

TRANSCRIPT:
${transcriptText}

Please structure your response with clear sections for:
1. Hook Analysis (What worked / What could be improved)
2. Intro Analysis (What worked / What could be improved)
3. Story Development (What worked / What could be improved)
4. Overall Recommendations`;

    console.log('Sending to OpenAI for analysis...');

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI error:', openAIResponse.status, errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const analysis = openAIData.choices[0].message.content;

    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        transcript: transcriptText,
        videoId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-video-script:', error);
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
