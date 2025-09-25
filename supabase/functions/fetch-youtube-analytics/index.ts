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
        
        // Extract basic view count
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
        
        // Try to extract basic metadata from HTML
        const titleMatch = html.match(/<meta name="title" content="([^"]*)">/);
        const title = titleMatch ? titleMatch[1] : '';
        
        const thumbnailMatch = html.match(/<meta property="og:image" content="([^"]*)">/);
        const thumbnail = thumbnailMatch ? thumbnailMatch[1] : '';
        
        const likes = 0; // Not reliably available without API
        const comments = 0; // Not reliably available without API
        const engagement = likes + comments;
        const rate = views > 0 ? Number(((engagement / views) * 100).toFixed(2)) : 0;
        
        return { 
          views, 
          likes, 
          comments, 
          engagement, 
          rate,
          metadata: {
            title: title,
            description: '',
            publishedAt: '',
            channelTitle: '',
            duration: 0,
            thumbnails: {
              default: thumbnail,
              medium: thumbnail,
              high: thumbnail,
              standard: thumbnail,
              maxres: thumbnail
            },
            tags: [],
            categoryId: '',
            defaultLanguage: '',
            defaultAudioLanguage: ''
          }
        };
      } catch (e) {
        console.error('HTML fallback failed:', e);
        return { 
          views: 0, 
          likes: 0, 
          comments: 0, 
          engagement: 0, 
          rate: 0,
          metadata: {
            title: '',
            description: '',
            publishedAt: '',
            channelTitle: '',
            duration: 0,
            thumbnails: {
              default: '',
              medium: '',
              high: '',
              standard: '',
              maxres: ''
            },
            tags: [],
            categoryId: '',
            defaultLanguage: '',
            defaultAudioLanguage: ''
          }
        };
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

    // Fetch data from YouTube Data API with video details and statistics
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=statistics,snippet,contentDetails&key=${youtubeApiKey}`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error('YouTube API error:', data);
      throw new Error('Failed to fetch YouTube data');
    }

    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found');
    }

    const video = data.items[0];
    const stats = video.statistics;
    const snippet = video.snippet;
    const contentDetails = video.contentDetails;
    
    const views = parseInt(stats.viewCount || '0');
    const likes = parseInt(stats.likeCount || '0');
    const comments = parseInt(stats.commentCount || '0');
    const engagement = likes + comments;
    const rate = views > 0 ? Number(((engagement / views) * 100).toFixed(2)) : 0;

    // Parse ISO 8601 duration (PT4M13S) to seconds
    const parseDuration = (duration: string): number => {
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return 0;
      const hours = parseInt(match[1] || '0');
      const minutes = parseInt(match[2] || '0');
      const seconds = parseInt(match[3] || '0');
      return hours * 3600 + minutes * 60 + seconds;
    };

    const result = {
      views,
      engagement,
      likes,
      comments,
      rate,
      metadata: {
        title: snippet?.title || '',
        description: snippet?.description || '',
        publishedAt: snippet?.publishedAt || '',
        channelTitle: snippet?.channelTitle || '',
        duration: parseDuration(contentDetails?.duration || 'PT0S'),
        thumbnails: {
          default: snippet?.thumbnails?.default?.url || '',
          medium: snippet?.thumbnails?.medium?.url || '',
          high: snippet?.thumbnails?.high?.url || '',
          standard: snippet?.thumbnails?.standard?.url || '',
          maxres: snippet?.thumbnails?.maxres?.url || ''
        },
        tags: snippet?.tags || [],
        categoryId: snippet?.categoryId || '',
        defaultLanguage: snippet?.defaultLanguage || '',
        defaultAudioLanguage: snippet?.defaultAudioLanguage || ''
      }
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching YouTube analytics:', error);
    const safeFallback = { 
      views: 0, 
      engagement: 0, 
      likes: 0, 
      comments: 0, 
      rate: 0,
      metadata: {
        title: '',
        description: '',
        publishedAt: '',
        channelTitle: '',
        duration: 0,
        thumbnails: {
          default: '',
          medium: '',
          high: '',
          standard: '',
          maxres: ''
        },
        tags: [],
        categoryId: '',
        defaultLanguage: '',
        defaultAudioLanguage: ''
      }
    };
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