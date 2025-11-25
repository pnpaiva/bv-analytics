import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract YouTube video ID from various URL formats
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Fetch transcript using SearchAPI (which provides YouTube transcripts)
async function fetchTranscriptFromSearchAPI(videoId: string, searchApiKey: string): Promise<any> {
  console.log('Fetching transcript from SearchAPI for video:', videoId);
  
  const searchApiUrl = `https://www.searchapi.io/api/v1/search?engine=youtube_transcripts&video_id=${videoId}&api_key=${searchApiKey}`;
  
  const response = await fetch(searchApiUrl);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('SearchAPI error:', errorText);
    throw new Error('Failed to fetch transcript from SearchAPI');
  }

  const data = await response.json();
  
  if (!data.transcripts || data.transcripts.length === 0) {
    throw new Error('No transcripts found via SearchAPI');
  }

  // Get the first transcript (prefer English or Portuguese)
  const transcript = data.transcripts.find((t: any) => 
    t.language_code === 'en' || t.language_code === 'pt'
  ) || data.transcripts[0];

  console.log('Found transcript with language:', transcript.language_code);

  return {
    formattedTranscript: transcript.text,
    languageCode: transcript.language_code,
  };
}

// Transcribe audio using OpenAI Whisper API
async function transcribeWithWhisper(audioUrl: string, openaiKey: string): Promise<string> {
  console.log('Transcribing with OpenAI Whisper...');
  
  // Download the audio
  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) {
    throw new Error('Failed to download audio');
  }

  const audioBlob = await audioResponse.blob();
  
  // Check file size (Whisper has a 25MB limit)
  if (audioBlob.size > 25 * 1024 * 1024) {
    throw new Error('Audio file too large for Whisper API (max 25MB)');
  }

  // Create form data for Whisper API
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.mp3');
  formData.append('model', 'whisper-1');
  formData.append('language', 'pt'); // Portuguese
  formData.append('response_format', 'verbose_json'); // Get timestamps

  // Send to OpenAI Whisper API
  const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: formData,
  });

  if (!whisperResponse.ok) {
    const errorText = await whisperResponse.text();
    console.error('Whisper API error:', errorText);
    throw new Error('Failed to transcribe with Whisper API');
  }

  const whisperData = await whisperResponse.json();
  
  // Format transcript with timestamps
  let formattedTranscript = '';
  if (whisperData.segments && whisperData.segments.length > 0) {
    formattedTranscript = whisperData.segments.map((segment: any) => {
      const startTime = segment.start.toFixed(2);
      const endTime = segment.end.toFixed(2);
      return `[${startTime}s - ${endTime}s] ${segment.text.trim()}`;
    }).join(' ');
  } else {
    formattedTranscript = whisperData.text;
  }

  return formattedTranscript;
}

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

    // Only support YouTube for now
    if (platform !== 'youtube') {
      throw new Error('Only YouTube videos are currently supported');
    }

    // Extract video ID
    const videoId = extractYouTubeVideoId(videoUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    console.log('Extracted video ID:', videoId);

    // Get API keys
    const searchApiKey = Deno.env.get('SEARCHAPI_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    let transcriptData;
    let method = 'unknown';

    // Try SearchAPI first (faster and cheaper)
    if (searchApiKey) {
      try {
        console.log('Attempting to fetch transcript via SearchAPI...');
        transcriptData = await fetchTranscriptFromSearchAPI(videoId, searchApiKey);
        method = 'searchapi';
        console.log('Successfully fetched transcript via SearchAPI');
      } catch (searchApiError) {
        console.log('SearchAPI failed:', searchApiError);
        transcriptData = null;
      }
    }

    // If SearchAPI failed and we have OpenAI key, try Whisper
    // Note: This requires audio URL which we don't have yet
    // This is a placeholder for future implementation
    if (!transcriptData && openaiKey) {
      console.log('SearchAPI unavailable, would need to implement audio extraction for Whisper');
      throw new Error('Video has no captions. Full Whisper implementation requires audio extraction which is not yet implemented.');
    }

    // If neither worked, throw error
    if (!transcriptData) {
      throw new Error('No transcript available. Video may not have captions and required API keys are not configured.');
    }

    console.log('Transcription completed successfully via', method);

    return new Response(
      JSON.stringify({
        success: true,
        transcript: transcriptData.formattedTranscript,
        languageCode: transcriptData.languageCode,
        videoUrl: videoUrl,
        videoId: videoId,
        method: method,
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
