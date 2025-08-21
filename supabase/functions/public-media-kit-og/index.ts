import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configure your app base URL and default logo used for previews
const APP_BASE_URL = 'https://app.beyond-views.com';
const DEFAULT_LOGO = `${APP_BASE_URL}/lovable-uploads/4add0e07-79ba-4808-834f-029555e0d6f7.png`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return new Response('Missing slug', { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: mediaKit, error } = await supabase
      .from('public_media_kits')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();

    if (error || !mediaKit) {
      return new Response('Media kit not found', { status: 404, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
    }

    const name: string = (mediaKit as any).name || 'Creator';
    const bio: string = (mediaKit as any).bio || `Check out ${name}'s media kit and collaboration opportunities`;

    let avatarUrl: string | null = (mediaKit as any).avatar_url || null;
    if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) {
      // Make relative URLs absolute to the app domain
      avatarUrl = `${APP_BASE_URL}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
    }

    const previewImage = avatarUrl || DEFAULT_LOGO;
    const canonical = `${APP_BASE_URL}/${slug}`;

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${name} | Media Kit</title>
  <meta name="description" content="${escapeHtml(bio)}" />

  <meta property="og:site_name" content="Beyond Views Analytics" />
  <meta property="og:type" content="profile" />
  <meta property="og:title" content="${escapeHtml(name)} | Media Kit" />
  <meta property="og:description" content="${escapeHtml(bio)}" />
  <meta property="og:image" content="${previewImage}" />
  <meta property="og:image:alt" content="${escapeHtml(name)} profile picture" />
  <meta property="og:url" content="${canonical}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(name)} | Media Kit" />
  <meta name="twitter:description" content="${escapeHtml(bio)}" />
  <meta name="twitter:image" content="${previewImage}" />

  <link rel="canonical" href="${canonical}" />
</head>
<body>
  <p>Redirecting to media kit...</p>
  <script>location.replace(${JSON.stringify(canonical)});</script>
  <noscript>
    <meta http-equiv="refresh" content="0; url=${canonical}" />
  </noscript>
</body>
</html>`;

    return new Response(html, { headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=UTF-8' } });
  } catch (e) {
    console.error('Error in public-media-kit-og function:', e);
    return new Response('Internal error', { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
  }
});

function escapeHtml(str: string) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
