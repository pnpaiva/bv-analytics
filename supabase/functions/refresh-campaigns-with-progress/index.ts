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
    let campaignIds: string[] = [];

    if (req.method === 'GET') {
      const u = new URL(req.url);
      const ids = u.searchParams.get('ids') || '';
      campaignIds = ids.split(',').map((s) => s.trim()).filter(Boolean);
    } else {
      const body = await req.json().catch(() => ({}));
      campaignIds = Array.isArray(body.campaignIds) ? body.campaignIds : [];
    }
    
    if (!campaignIds || !Array.isArray(campaignIds) || campaignIds.length === 0) {
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

    // Create refresh log entry
    const { data: refreshLog } = await supabase
      .from('campaign_refresh_logs')
      .insert({
        total_campaigns: campaignIds.length,
        trigger_type: 'bulk',
        campaign_results: []
      })
      .select('id')
      .single();

    const refreshLogId = refreshLog?.id;

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

        // Resource usage tracking for Apify free tier limits
        let estimatedResourceUsage = 0;
        const APIFY_FREE_TIER_LIMIT = 8 * 1024 * 1024 * 1024; // 8GB in bytes
        const RESOURCE_SAFETY_MARGIN = 0.8; // Stop at 80% of limit
        const SAFE_LIMIT = APIFY_FREE_TIER_LIMIT * RESOURCE_SAFETY_MARGIN;
        
        // Estimated resource usage per platform (in bytes)
        const PLATFORM_RESOURCE_ESTIMATES = {
          youtube: 50 * 1024 * 1024,    // ~50MB per YouTube URL
          instagram: 200 * 1024 * 1024, // ~200MB per Instagram URL  
          tiktok: 150 * 1024 * 1024     // ~150MB per TikTok URL
        };

        const withRetry = async <T>(fn: () => Promise<T>, attempts = 3, baseDelay = 5000): Promise<T> => {
          let lastErr: any;
          for (let i = 0; i < attempts; i++) {
            try {
              return await fn();
            } catch (err) {
              lastErr = err;
              // Check if error is related to resource limits
              const errorMsg = String(err).toLowerCase();
              if (errorMsg.includes('quota') || errorMsg.includes('limit') || errorMsg.includes('resource')) {
                console.warn('Resource limit detected, stopping processing');
                throw new Error('Apify resource limit reached. Please try again later or process campaigns in smaller batches.');
              }
              // Exponential backoff with jitter - INCREASED DELAYS
              const jitter = Math.floor(Math.random() * 500);
              const delay = baseDelay * Math.pow(2, i) + jitter;
              console.log(`Retry attempt ${i + 1}/${attempts} failed, waiting ${delay}ms before retry...`);
              await sleep(delay);
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

          // Preserve original case for IDs (YouTube IDs are case-sensitive)
          if (platform === 'youtube') {
            // Convert youtu.be/<id> to youtube.com/watch?v=<id>
            const short = url.match(/https?:\/\/youtu\.be\/([A-Za-z0-9_-]{6,})/i);
            if (short) return `https://www.youtube.com/watch?v=${short[1]}`;
            // Convert shorts path to standard watch URL
            const shorts = url.match(/https?:\/\/(?:www\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/i);
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

          console.log(`Processing ${campaigns.length} campaigns`);
          
          // Pre-calculate resource usage for all campaigns to determine optimal batching
          const campaignResourceEstimates = campaigns.map(campaign => {
            const urls = collectUrls(campaign);
            const estimatedUsage = urls.reduce((total, { platform }) => {
              return total + (PLATFORM_RESOURCE_ESTIMATES[platform] || 100 * 1024 * 1024);
            }, 0);
            return { campaign, urls, estimatedUsage };
          });

          // Sort campaigns by resource usage (smallest first) for better resource management
          campaignResourceEstimates.sort((a, b) => a.estimatedUsage - b.estimatedUsage);
          
          const campaignResults: Array<{id: string, name: string, status: 'success' | 'failed', error?: string}> = [];
          let resourceLimitReached = false;
          
          for (let i = 0; i < campaignResourceEstimates.length; i++) {
            const { campaign, urls, estimatedUsage } = campaignResourceEstimates[i];
            
            // Check if processing this campaign would exceed resource limits
            if (estimatedResourceUsage + estimatedUsage > SAFE_LIMIT) {
              console.warn(`Resource limit would be exceeded by campaign ${campaign.brand_name}. Stopping processing.`);
              resourceLimitReached = true;
              
              // Mark remaining campaigns as skipped
              for (let j = i; j < campaignResourceEstimates.length; j++) {
                const remainingCampaign = campaignResourceEstimates[j].campaign;
                campaignResults.push({
                  id: remainingCampaign.id,
                  name: remainingCampaign.brand_name,
                  status: 'failed',
                  error: 'Skipped due to resource limits'
                });
              }
              break;
            }
            
            console.log(`Starting campaign ${i + 1}/${campaigns.length}: ${campaign.brand_name} (${campaign.id})`);
            console.log(`Estimated resource usage: ${Math.round(estimatedUsage / 1024 / 1024)}MB`);
            console.log(`Total resource usage so far: ${Math.round(estimatedResourceUsage / 1024 / 1024)}MB`);
            
            const progress: ProgressUpdate = {
              campaignId: campaign.id,
              campaignName: campaign.brand_name,
              status: 'processing',
              processedUrls: 0,
              totalUrls: urls.length,
            };

            // Ensure DB status reflects processing
            await supabase.rpc('set_campaign_status', { p_campaign_id: campaign.id, p_status: 'analyzing' });

            // Send initial processing status immediately
            send(progress);
            console.log(`Campaign ${campaign.brand_name} has ${urls.length} URLs to process`);
            send(progress);

            let campaignSuccess = true;
            let campaignError = '';

            if (urls.length === 0) {
              await supabase.rpc('update_campaign_analytics', {
                p_campaign_id: campaign.id,
                p_total_views: 0,
                p_total_engagement: 0,
                p_engagement_rate: 0,
                p_analytics_data: {},
              });
              // Mark campaign as completed in DB when no URLs
              await supabase.rpc('set_campaign_status', { p_campaign_id: campaign.id, p_status: 'completed' });
              progress.status = 'completed';
              send(progress);
              console.log(`Campaign ${campaign.brand_name} completed (no URLs)`);
              campaignResults.push({
                id: campaign.id,
                name: campaign.brand_name,
                status: 'success'
              });
              continue;
            }

            let totalViews = 0;
            let totalEngagement = 0;
            const platformResults: Record<string, any[]> = {};

            // Sequential processing with retries and per-platform pacing - SLOWED DOWN TO AVOID LIMITS
            const perPlatformDelay: Record<string, number> = { youtube: 5000, instagram: 8000, tiktok: 8000 };

            for (let urlIndex = 0; urlIndex < urls.length; urlIndex++) {
              const { url, platform } = urls[urlIndex];
              const urlResourceEstimate = PLATFORM_RESOURCE_ESTIMATES[platform] || 100 * 1024 * 1024;
              
              // Check if processing this URL would exceed resource limits
              if (estimatedResourceUsage + urlResourceEstimate > SAFE_LIMIT) {
                console.warn(`Resource limit would be exceeded by URL ${url}. Skipping remaining URLs.`);
                resourceLimitReached = true;
                campaignSuccess = false;
                campaignError = 'Processing stopped due to resource limits';
                break;
              }
              
              console.log(`Processing URL ${urlIndex + 1}/${urls.length} for ${campaign.brand_name}: ${url}`);
              console.log(`URL resource estimate: ${Math.round(urlResourceEstimate / 1024 / 1024)}MB`);
              
              try {
                const res = await withRetry(async () => {
                  const r = await supabase.functions.invoke(`fetch-${platform}-analytics`, { body: { url } });
                  if (r.error) throw new Error(r.error.message || 'invoke error');
                  if (!r.data) throw new Error('empty response');
                  return r.data as { views?: number; engagement?: number; [k: string]: unknown };
                }, 3, 8000);

                console.log(`Apify response for ${platform} URL ${url}:`, res);

                // Update resource usage estimate after successful processing
                estimatedResourceUsage += urlResourceEstimate;
                
                const urlViews = res.views || 0;
                const urlEngagement = res.engagement || 0;
                
                totalViews += urlViews;
                totalEngagement += urlEngagement;
                
                console.log(`Added ${urlViews} views and ${urlEngagement} engagement. Running totals: ${totalViews} views, ${totalEngagement} engagement`);
                if (!platformResults[platform]) platformResults[platform] = [];
                platformResults[platform].push({ url, ...res });
                
                console.log(`Successfully processed ${platform} URL. Total resource usage: ${Math.round(estimatedResourceUsage / 1024 / 1024)}MB`);
              } catch (err) {
                console.error(`Final failure processing ${platform} URL ${url}:`, err);
                
                // Still count resource usage even for failed attempts
                estimatedResourceUsage += urlResourceEstimate;
                
                if (!platformResults[platform]) platformResults[platform] = [];
                platformResults[platform].push({ url, error: String(err && (err as any).message || err) });
                campaignSuccess = false;
                campaignError = `Failed processing ${platform} URL: ${String(err && (err as any).message || err)}`;
                
                // Check if error is related to resource limits
                const errorMsg = String(err).toLowerCase();
                if (errorMsg.includes('quota') || errorMsg.includes('limit') || errorMsg.includes('resource')) {
                  console.warn('Resource limit detected during URL processing');
                  resourceLimitReached = true;
                  break;
                }
              }

              // Update progress after each URL
              progress.processedUrls = urlIndex + 1;
              send(progress);
              console.log(`Progress for ${campaign.brand_name}: ${progress.processedUrls}/${progress.totalUrls}`);
              
              await sleep(perPlatformDelay[platform] ?? 1200);
            }

            try {
              const engagementRate = totalViews > 0 ? Number(((totalEngagement / totalViews) * 100).toFixed(2)) : 0;
              
              console.log(`Updating campaign ${campaign.id} with analytics:`, {
                totalViews,
                totalEngagement,
                engagementRate,
                platformResults
              });
              
              const { error: updateError } = await supabase.rpc('update_campaign_analytics', {
                p_campaign_id: campaign.id,
                p_total_views: Math.floor(totalViews), // Ensure integer
                p_total_engagement: Math.floor(totalEngagement), // Ensure integer
                p_engagement_rate: engagementRate,
                p_analytics_data: platformResults,
              });
              
              if (updateError) {
                console.error('Error updating campaign analytics:', updateError);
                campaignSuccess = false;
                campaignError = `Failed to update analytics: ${updateError.message}`;
              } else {
                console.log(`Successfully updated campaign ${campaign.id} analytics`);
                
                // Also populate campaign_url_analytics table with individual URL data
                if (urls.length > 0) {
                  console.log(`Attempting to insert ${urls.length} URL analytics records for campaign ${campaign.id}`);
                  
                  // First, let's try a direct insert to test RLS
                  const urlAnalyticsData = urls.map(({ url, platform }) => {
                    // Get platform data - since platform functions return data for the URL they were called with,
                    // we can directly use the platform results (there should only be one result per platform)
                    const platformData = platformResults[platform]?.[0] || {};
                    // Fix data structure mismatch - platform functions return 'rate' but we need 'engagement_rate'
                    const engagementRate = platformData.rate || platformData.engagement_rate || 0;
                    
                    return {
                      campaign_id: campaign.id,
                      content_url: url,
                      platform: platform,
                      date_recorded: new Date().toISOString().split('T')[0],
                      views: platformData.views || 0,
                      likes: platformData.likes || 0,
                      comments: platformData.comments || 0,
                      shares: platformData.shares || 0,
                      engagement: platformData.engagement || 0,
                      engagement_rate: engagementRate,
                      analytics_metadata: platformData.analytics_metadata || {},
                      fetched_at: new Date().toISOString()
                    };
                  });

                  console.log('URL analytics data to insert:', urlAnalyticsData);
                  console.log('Data summary:', {
                    totalRecords: urlAnalyticsData.length,
                    totalViews: urlAnalyticsData.reduce((sum, entry) => sum + (entry.views || 0), 0),
                    totalEngagement: urlAnalyticsData.reduce((sum, entry) => sum + (entry.engagement || 0), 0),
                    platforms: [...new Set(urlAnalyticsData.map(entry => entry.platform))]
                  });

                  // Try direct insert first
                  const { data: insertData, error: insertError } = await supabase
                    .from('campaign_url_analytics')
                    .insert(urlAnalyticsData)
                    .select();

                  if (insertError) {
                    console.error('Direct insert failed, trying upsert function:', insertError);
                    
                    // Fallback to upsert function
                    for (let i = 0; i < urls.length; i++) {
                      const { url, platform } = urls[i];
                      // Get platform data - since platform functions return data for the URL they were called with,
                      // we can directly use the platform results (there should only be one result per platform)
                      const platformData = platformResults[platform]?.[0] || {};
                    
                    // Fix data structure mismatch - platform functions return 'rate' but we need 'engagement_rate'
                    const engagementRate = platformData.rate || platformData.engagement_rate || 0;
                    
                    console.log(`Inserting URL analytics for ${url}:`, {
                      campaign_id: campaign.id,
                      platform: platform,
                      views: platformData.views || 0,
                      engagement: platformData.engagement || 0,
                      engagement_rate: engagementRate
                    });

                    const { error: urlAnalyticsError } = await supabase.rpc('upsert_campaign_url_analytics', {
                      p_campaign_id: campaign.id,
                      p_content_url: url,
                      p_platform: platform,
                      p_date_recorded: new Date().toISOString().split('T')[0],
                      p_views: platformData.views || 0,
                      p_likes: platformData.likes || 0,
                      p_comments: platformData.comments || 0,
                      p_shares: platformData.shares || 0,
                      p_engagement: platformData.engagement || 0,
                      p_engagement_rate: engagementRate,
                      p_analytics_metadata: platformData.analytics_metadata || {}
                    });

                      if (urlAnalyticsError) {
                        console.error(`Error inserting URL analytics for ${url}:`, urlAnalyticsError);
                      } else {
                        console.log(`Successfully inserted URL analytics for ${url}`);
                      }
                    }
                  } else {
                    console.log(`Successfully inserted ${insertData?.length || 0} URL analytics records directly`);
                    console.log('Inserted data summary:', {
                      totalRecords: insertData?.length || 0,
                      totalViews: insertData?.reduce((sum, entry) => sum + (entry.views || 0), 0) || 0,
                      totalEngagement: insertData?.reduce((sum, entry) => sum + (entry.engagement || 0), 0) || 0,
                      platforms: [...new Set(insertData?.map(entry => entry.platform) || [])]
                    });
                  }
                }
              }

              // Collect daily performance data
              try {
                await supabase.functions.invoke('collect-daily-performance', {
                  body: { campaignId: campaign.id },
                });
              } catch (dailyError) {
                console.error('Error collecting daily performance:', dailyError);
              }

              // Mark campaign as completed in DB
              await supabase.rpc('set_campaign_status', { p_campaign_id: campaign.id, p_status: 'completed' });

              progress.status = 'completed';
              send(progress);
              console.log(`Campaign ${campaign.brand_name} completed successfully`);
              
              campaignResults.push({
                id: campaign.id,
                name: campaign.brand_name,
                status: 'success'
              });
            } catch (updateError) {
              console.error(`Error updating campaign analytics for ${campaign.brand_name}:`, updateError);
              campaignSuccess = false;
              campaignError = `Failed to update analytics: ${String(updateError && (updateError as any).message || updateError)}`;
              await supabase.rpc('set_campaign_status', { p_campaign_id: campaign.id, p_status: 'error' });
            }

            if (!campaignSuccess) {
              campaignResults.push({
                id: campaign.id,
                name: campaign.brand_name,
                status: 'failed',
                error: campaignError
              });
            }
            
            // Add delay between campaigns to avoid overwhelming APIs
            if (i < campaignResourceEstimates.length - 1) {
              console.log(`Waiting 10 seconds before processing next campaign...`);
              await sleep(10000);
            }
            
            // If we hit resource limits, break out of the campaign loop
            if (resourceLimitReached) {
              console.warn('Resource limit reached, stopping campaign processing');
              break;
            }
          }

          // Log completion summary
          if (refreshLogId) {
            const successCount = campaignResults.filter(r => r.status === 'success').length;
            const failedCount = campaignResults.filter(r => r.status === 'failed').length;
            
            await supabase.rpc('log_campaign_refresh_completion', {
              p_log_id: refreshLogId,
              p_total_campaigns: campaigns.length,
              p_successful_campaigns: successCount,
              p_failed_campaigns: failedCount,
              p_campaign_results: campaignResults
            });
          }

          const successCount = campaignResults.filter(r => r.status === 'success').length;
          const failedCount = campaignResults.filter(r => r.status === 'failed').length;
          const skippedCount = campaignResults.filter(r => r.error?.includes('resource limits')).length;
          
          console.log(`Processing completed. Success: ${successCount}, Failed: ${failedCount}, Skipped: ${skippedCount}`);
          console.log(`Total resource usage: ${Math.round(estimatedResourceUsage / 1024 / 1024)}MB`);
          
          // Send completion signal with resource usage info
          send({ 
            type: 'complete', 
            summary: {
              total: campaigns.length,
              successful: successCount,
              failed: failedCount,
              skipped: skippedCount,
              resourceUsageMB: Math.round(estimatedResourceUsage / 1024 / 1024),
              resourceLimitReached: resourceLimitReached,
              results: campaignResults
            }
          });
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
