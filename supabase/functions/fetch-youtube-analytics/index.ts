import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract video ID from YouTube URL (supports watch, youtu.be and shorts)
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'Invalid YouTube URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
    
    // Helper: fallback scraping when API key missing or API fails
    const fetchFromHtml = async (vid: string) => {
      try {
        const watchUrl = `https://www.youtube.com/watch?v=${vid}`;
        const res = await fetch(watchUrl, { headers: { 'Accept-Language': 'en-US,en;q=0.9' } });
        const html = await res.text();
        // Prefer structured player response when available
        const directMatch = html.match(/\"viewCount\":\"(\d+)\"/);
        let views = 0;
        if (directMatch && directMatch[1]) {
          views = parseInt(directMatch[1]);
        } else {
          // Fallback to human readable "1,234 views"
          const readable = html.match(/([\d.,]+)\s+views/);
          if (readable && readable[1]) {
            views = Number(readable[1].replace(/[,\.]/g, '')) || 0;
          }
        }
        const likes = 0; // Not reliably available without API
        const comments = 0; // Not reliably available without API
        const engagement = likes + comments;
        const rate = views > 0 ? Number(((engagement / views) * 100).toFixed(2)) : 0;
        return { views, likes, comments, engagement, rate };
      } catch (e) {
        console.error('HTML fallback failed:', e);
        return { views: 0, likes: 0, comments: 0, engagement: 0, rate: 0 };
      }
    };
    
    if (!youtubeApiKey) {
      console.log('YouTube API key not found, using HTML fallback');
      const result = await fetchFromHtml(videoId);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch data from YouTube Data API
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=statistics&key=${youtubeApiKey}`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error('YouTube API error:', data);
      throw new Error('Failed to fetch YouTube data');
    }

    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found');
    }

    const stats = data.items[0].statistics;
    const views = parseInt(stats.viewCount || '0');
    const likes = parseInt(stats.likeCount || '0');
    const comments = parseInt(stats.commentCount || '0');
    const engagement = likes + comments;
    const rate = views > 0 ? Number(((engagement / views) * 100).toFixed(2)) : 0;

    const result = {
      views,
      engagement,
      likes,
      comments,
      rate
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching YouTube analytics:', error);
    const safeFallback = { views: 0, engagement: 0, likes: 0, comments: 0, rate: 0 };
    return new Response(
      JSON.stringify(safeFallback),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractYouTubeVideoId(input: string): string | null {
  try {
    const u = new URL(input);
    const host = u.hostname.replace('www.', '');

    // youtu.be short links
    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      return id && id.length >= 11 ? id.substring(0, 11) : null;
    }

    if (host.endsWith('youtube.com')) {
      // Standard watch URL
      const v = u.searchParams.get('v');
      if (v) return v.substring(0, 11);

      // Shorts URL
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts[0] === 'shorts' && parts[1]) return parts[1].substring(0, 11);

      // Embed URL
      if (parts[0] === 'embed' && parts[1]) return parts[1].substring(0, 11);
    }

    // Fallback regex
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = input.match(regex);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}