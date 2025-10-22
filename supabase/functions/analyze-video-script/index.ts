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
    const { videoUrl, platform, campaignId } = await req.json();
    
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

    const transcriptUrl = `https://www.searchapi.io/api/v1/search?api_key=${searchApiKey}&engine=youtube_transcripts&video_id=${videoId}`;
    console.log('Fetching transcript from SearchAPI:', transcriptUrl.replace(searchApiKey, 'xxx'));
    
    const transcriptResponse = await fetch(transcriptUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
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

    const systemPrompt = `You are a YouTube content strategist with the combined expertise of Paddy Galloway (YouTube strategist known for deep-dive video breakdowns and data-driven insights) and Colin & Samir (YouTubers known for creator economy analysis and storytelling expertise). 

Analyze video transcripts using their framework: focus on audience retention psychology, narrative structure, and what makes content click-worthy and watch-worthy.

Your analysis should be:
- Data-informed but human-focused (like Paddy's approach)
- Story-driven and creator-centric (like Colin & Samir's perspective)
- Actionable with specific timestamps and examples
- Focused on viewer psychology and retention

Always maintain this consistent format for every analysis.`;

    const userPrompt = `Analyze this video transcript using the combined lens of Paddy Galloway's strategic breakdown approach and Colin & Samir's storytelling expertise:

TRANSCRIPT:
${transcriptText}

IMPORTANT: Format your response for readability. Use proper spacing, natural paragraph breaks, and avoid overusing bold text. Only use bold for section headers. Write in clear, conversational paragraphs with bullet points where appropriate.

Structure your response exactly as follows:

## 🎣 HOOK ANALYSIS (First 3-5 seconds)

What Worked:
[Write 2-3 sentences in a natural paragraph explaining specific observations]

What Could Be Improved:
[Write 2-3 sentences with actionable recommendations]

Paddy's Take: [1-2 sentences with data-driven insight]

Colin & Samir's Take: [1-2 sentences with storytelling perspective]

---

## 🚀 INTRO ANALYSIS (First 15-30 seconds)

What Worked:
[Write 2-3 sentences explaining what's effective]

What Could Be Improved:
[Write 2-3 sentences with specific recommendations]

Value Proposition:
[Write 2-3 sentences analyzing how clearly it establishes viewer benefit]

---

## 📖 STORY DEVELOPMENT

Narrative Arc:
[Write a paragraph analyzing the story structure and flow]

Pacing & Engagement:
[Write a paragraph about key engaging moments and potential retention risks]

What Worked:
[Write 2-3 sentences highlighting strengths]

What Could Be Improved:
[Write 2-3 sentences with actionable improvements]

---

## 💡 OVERALL RECOMMENDATIONS

[Write 3-5 prioritized takeaways as separate paragraphs or bullet points, blending Paddy's strategic insights with Colin & Samir's creator perspective. Keep each recommendation concise and actionable.]`;

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

    // Save to database if campaignId is provided
    if (campaignId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Get organization_id from campaign
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('organization_id')
        .eq('id', campaignId)
        .single();

      if (campaign) {
        const { error: insertError } = await supabase
          .from('video_script_analysis')
          .upsert({
            campaign_id: campaignId,
            organization_id: campaign.organization_id,
            content_url: videoUrl,
            platform: platform,
            video_id: videoId,
            transcript: transcriptText,
            analysis: analysis,
            analyzed_at: new Date().toISOString()
          }, {
            onConflict: 'campaign_id,content_url,platform'
          });

        if (insertError) {
          console.error('Error saving script analysis:', insertError);
        } else {
          console.log('Script analysis saved to database');
        }
      }
    }

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
