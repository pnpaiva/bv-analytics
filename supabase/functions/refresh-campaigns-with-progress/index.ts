
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProgressUpdate {
  campaignId: string;
  campaignName: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  processedUrls: number;
  totalUrls: number;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignIds } = await req.json();
    
    if (!campaignIds || !Array.isArray(campaignIds)) {
      return new Response(
        JSON.stringify({ error: 'Campaign IDs array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting progressive refresh for campaigns:', campaignIds);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

        const withRetry = async <T>(fn: () => Promise<T>, attempts = 3, baseDelay = 1200): Promise<T> => {
          let lastErr: any;
          for (let i = 0; i < attempts; i++) {
            try {
              return await fn();
            } catch (err) {
              lastErr = err;
              // Exponential backoff with jitter
              const jitter = Math.floor(Math.random() * 300);
              await sleep(baseDelay * Math.pow(2, i) + jitter);
            }
          }
          throw lastErr;
        };

        const normalizeUrl = (platform: string, raw: string): string => {
          let url = raw.trim();
          // Strip tracking params
          try {
            const u = new URL(url);
            // Keep path; remove common trackers
            u.searchParams.delete('utm_source');
            u.searchParams.delete('utm_medium');
            u.searchParams.delete('utm_campaign');
            u.searchParams.delete('si');
            url = u.toString();
          } catch (_) {
            // Not a valid absolute URL, best effort normalization below
          }

          const lower = url.toLowerCase();
          if (platform === 'youtube') {
            // Convert youtu.be/<id> to youtube.com/watch?v=<id>
            const short = lower.match(/https?:\/\/youtu\.be\/([a-z0-9_-]{6,})/i);
            if (short) return `https://www.youtube.com/watch?v=${short[1]}`;
            const shorts = lower.match(/https?:\/\/(?:www\.)?youtube\.com\/shorts\/([a-z0-9_-]{6,})/i);
            if (shorts) return `https://www.youtube.com/watch?v=${shorts[1]}`;
            return url;
          }
          if (platform === 'instagram') {
            // Ensure canonical format ends with /
            return url.replace(/\/?(#.*)?$/, '/');
          }
          if (platform === 'tiktok') {
            // Strip trailing slashes and query
            try {
              const u = new URL(url);
              u.search = '';
              return u.toString().replace(/\/$/, '');
            } catch { return url.replace(/\/$/, ''); }
          }
          return url;
        };

        const collectUrls = (campaign: any): { url: string; platform: 'youtube'|'instagram'|'tiktok' }[] => {
          const collected: { url: string; platform: 'youtube'|'instagram'|'tiktok' }[] = [];
          if (!campaign.campaign_creators) return collected;

          for (const creator of campaign.campaign_creators) {
            const urls = creator?.content_urls as Record<string, unknown> | null;
            if (!urls || typeof urls !== 'object') continue;

            const pushAll = (arr: unknown[], platform: 'youtube'|'instagram'|'tiktok', predicate: (u: string) => boolean) => {
              for (const raw of arr) {
                if (!raw || typeof raw !== 'string') continue;
                const clean = raw.trim();
                if (predicate(clean)) collected.push({ url: normalizeUrl(platform, clean), platform });
              }
            };

            const yt = Array.isArray((urls as any).youtube) ? (urls as any).youtube as unknown[] : [];
            pushAll(yt, 'youtube', (u) => /youtube\.com\/watch\?|youtu\.be\//i.test(u) || /youtube\.com\/shorts\//i.test(u));

            const ig = Array.isArray((urls as any).instagram) ? (urls as any).instagram as unknown[] : [];
            pushAll(ig, 'instagram', (u) => /instagram\.com\/(p|reel|tv)\//i.test(u));

            const tt = Array.isArray((urls as any).tiktok) ? (urls as any).tiktok as unknown[] : [];
            pushAll(tt, 'tiktok', (u) => /tiktok\.com\/@.+\/video\//i.test(u));
          }

          // Deduplicate by normalized URL
          const seen = new Set<string>();
          return collected.filter(({ url }) => (seen.has(url) ? false : (seen.add(url), true)));
        };

        try {
          // Fetch campaigns
          const { data: campaigns, error: campaignError } = await supabase
            .from('campaigns')
            .select(`
              id,
              brand_name,
              campaign_creators (
                creator_id,
                content_urls
              )
            `)
            .in('id', campaignIds);

          if (campaignError || !campaigns) throw new Error(`Failed to fetch campaigns: ${campaignError?.message}`);

          for (const campaign of campaigns) {
            const progress: ProgressUpdate = {
              campaignId: campaign.id,
              campaignName: campaign.brand_name,
              status: 'processing',
              processedUrls: 0,
              totalUrls: 0,
            };

            // Move to analyzing
            await supabase.rpc('set_campaign_status', { p_campaign_id: campaign.id, p_status: 'analyzing' });

            // Gather, normalize and dedupe URLs
            const urls = collectUrls(campaign);
            progress.totalUrls = urls.length;
            send(progress);

            if (urls.length === 0) {
              await supabase.rpc('update_campaign_analytics', {
                p_campaign_id: campaign.id,
                p_total_views: 0,
                p_total_engagement: 0,
                p_engagement_rate: 0,
                p_analytics_data: {},
              });
              progress.status = 'completed';
              send(progress);
              continue;
            }

            let totalViews = 0;
            let totalEngagement = 0;
            const platformResults: Record<string, any[]> = {};

            // Sequential processing with retries and per-platform pacing
            const perPlatformDelay: Record<string, number> = { youtube: 900, instagram: 1400, tiktok: 1400 };

            for (const { url, platform } of urls) {
              try {
                const res = await withRetry(async () => {
                  const r = await supabase.functions.invoke(`fetch-${platform}-analytics`, { body: { url } });
                  if (r.error) throw new Error(r.error.message || 'invoke error');
                  if (!r.data) throw new Error('empty response');
                  return r.data as { views?: number; engagement?: number; [k: string]: unknown };
                }, 3, 1200);

                totalViews += res.views || 0;
                totalEngagement += res.engagement || 0;
                if (!platformResults[platform]) platformResults[platform] = [];
                platformResults[platform].push({ url, ...res });
              } catch (err) {
                console.error(`Final failure processing ${platform} URL ${url}:`, err);
                if (!platformResults[platform]) platformResults[platform] = [];
                platformResults[platform].push({ url, error: String(err && (err as any).message || err) });
              }

              // Update progress after each URL
              progress.processedUrls += 1;
              send(progress);
              await sleep(perPlatformDelay[platform] ?? 1200);
            }

            const engagementRate = totalViews > 0 ? Number(((totalEngagement / totalViews) * 100).toFixed(2)) : 0;
            await supabase.rpc('update_campaign_analytics', {
              p_campaign_id: campaign.id,
              p_total_views: totalViews,
              p_total_engagement: totalEngagement,
              p_engagement_rate: engagementRate,
              p_analytics_data: platformResults,
            });

            progress.status = 'completed';
            send(progress);
          }

          send({ type: 'complete' });
        } catch (error: any) {
          console.error('Error in progressive refresh:', error);
          send({ type: 'error', message: String(error?.message || error) });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in refresh-campaigns-with-progress:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
