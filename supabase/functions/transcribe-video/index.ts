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

// Fetch transcript from YouTube
async function fetchYouTubeTranscript(videoId: string): Promise<any> {
  console.log('Fetching YouTube page for video:', videoId);
  
  // Fetch the YouTube page to get the initial data
  const pageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!pageResponse.ok) {
    throw new Error('Failed to fetch YouTube page');
  }

  const html = await pageResponse.text();
  
  // Try multiple patterns to find caption tracks
  let captionTracks = null;
  
  // Pattern 1: Standard captionTracks
  let match = html.match(/"captionTracks":(\[.*?\])/);
  if (match) {
    try {
      captionTracks = JSON.parse(match[1]);
    } catch (e) {
      console.log('Failed to parse captionTracks with pattern 1');
    }
  }
  
  // Pattern 2: More flexible pattern that handles escaped quotes
  if (!captionTracks) {
    match = html.match(/"captionTracks":\s*(\[[\s\S]*?\])\s*[,}]/);
    if (match) {
      try {
        captionTracks = JSON.parse(match[1]);
      } catch (e) {
        console.log('Failed to parse captionTracks with pattern 2');
      }
    }
  }
  
  // Pattern 3: Look for captions in playerCaptionsTracklistRenderer
  if (!captionTracks) {
    match = html.match(/"playerCaptionsTracklistRenderer":\s*\{[^}]*"captionTracks":\s*(\[[\s\S]*?\])/);
    if (match) {
      try {
        captionTracks = JSON.parse(match[1]);
      } catch (e) {
        console.log('Failed to parse captionTracks with pattern 3');
      }
    }
  }
  
  if (!captionTracks || captionTracks.length === 0) {
    throw new Error('No captions available for this video. The video may not have subtitles enabled.');
  }

  console.log(`Found ${captionTracks.length} caption tracks`);
  
  if (captionTracks.length === 0) {
    throw new Error('No caption tracks found');
  }

  // Get the first available caption track (prefer English or Portuguese)
  let selectedTrack = captionTracks.find((track: any) => 
    track.languageCode === 'en' || track.languageCode === 'pt'
  ) || captionTracks[0];

  console.log('Using caption track:', selectedTrack.languageCode);

  // Fetch the actual transcript
  const transcriptResponse = await fetch(selectedTrack.baseUrl);
  
  if (!transcriptResponse.ok) {
    throw new Error('Failed to fetch transcript data');
  }

  const transcriptXml = await transcriptResponse.text();
  
  // Parse the XML to extract text and timestamps
  const textRegex = /<text start="([^"]+)" dur="([^"]+)"[^>]*>([^<]+)<\/text>/g;
  const segments: Array<{ start: number; duration: number; text: string }> = [];
  
  let xmlMatch;
  while ((xmlMatch = textRegex.exec(transcriptXml)) !== null) {
    const start = parseFloat(xmlMatch[1]);
    const duration = parseFloat(xmlMatch[2]);
    const text = xmlMatch[3]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n/g, ' ')
      .trim();
    
    if (text) {
      segments.push({ start, duration, text });
    }
  }

  if (segments.length === 0) {
    throw new Error('No transcript segments found');
  }

  // Format transcript with timestamps like the Apify format
  const formattedTranscript = segments.map(segment => {
    const startTime = segment.start.toFixed(2);
    const endTime = (segment.start + segment.duration).toFixed(2);
    return `[${startTime}s - ${endTime}s] ${segment.text}`;
  }).join(' ');

  return {
    segments,
    formattedTranscript,
    languageCode: selectedTrack.languageCode,
  };
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
      throw new Error('Only YouTube videos are supported with the native transcript API');
    }

    // Extract video ID
    const videoId = extractYouTubeVideoId(videoUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    console.log('Extracted video ID:', videoId);

    // Fetch transcript
    const transcriptData = await fetchYouTubeTranscript(videoId);

    console.log('Transcription completed successfully');
    console.log('Language:', transcriptData.languageCode);
    console.log('Segments:', transcriptData.segments.length);

    return new Response(
      JSON.stringify({
        success: true,
        transcript: transcriptData.formattedTranscript,
        segments: transcriptData.segments,
        languageCode: transcriptData.languageCode,
        videoUrl: videoUrl,
        videoId: videoId,
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
