
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
        
        const sendProgress = (progress: ProgressUpdate) => {
          const data = `data: ${JSON.stringify(progress)}\n\n`;
          controller.enqueue(encoder.encode(data));
        };

        try {
          // Get campaign details
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

          if (campaignError || !campaigns) {
            throw new Error(`Failed to fetch campaigns: ${campaignError?.message}`);
          }

          // Process campaigns sequentially to avoid overwhelming APIs
          for (const campaign of campaigns) {
            const campaignProgress: ProgressUpdate = {
              campaignId: campaign.id,
              campaignName: campaign.brand_name,
              status: 'processing',
              processedUrls: 0,
              totalUrls: 0
            };

            try {
              // Set campaign status to analyzing
              await supabase.rpc('set_campaign_status', {
                p_campaign_id: campaign.id,
                p_status: 'analyzing'
              });

              // Collect all URLs from campaign creators
              const allUrls: { url: string; platform: string }[] = [];
              
              if (campaign.campaign_creators) {
                for (const creator of campaign.campaign_creators) {
                  if (creator.content_urls && typeof creator.content_urls === 'object') {
                    const urls = creator.content_urls as Record<string, string[]>;
                    
                    // YouTube URLs
                    if (urls.youtube && Array.isArray(urls.youtube)) {
                      const validYouTubeUrls = urls.youtube.filter(url => {
                        if (!url || typeof url !== 'string') return false;
                        const cleanUrl = url.trim().toLowerCase();
                        return cleanUrl.includes('youtube.com/watch') || 
                               cleanUrl.includes('youtu.be/') ||
                               cleanUrl.includes('youtube.com/shorts/');
                      });
                      allUrls.push(...validYouTubeUrls.map(url => ({ url, platform: 'youtube' })));
                    }
                    
                    // Instagram URLs
                    if (urls.instagram && Array.isArray(urls.instagram)) {
                      const validInstagramUrls = urls.instagram.filter(url => {
                        if (!url || typeof url !== 'string') return false;
                        const cleanUrl = url.trim().toLowerCase();
                        return cleanUrl.includes('instagram.com/p/') || 
                               cleanUrl.includes('instagram.com/reel/') ||
                               cleanUrl.includes('instagram.com/tv/');
                      });
                      allUrls.push(...validInstagramUrls.map(url => ({ url, platform: 'instagram' })));
                    }
                    
                    // TikTok URLs
                    if (urls.tiktok && Array.isArray(urls.tiktok)) {
                      const validTikTokUrls = urls.tiktok.filter(url => {
                        if (!url || typeof url !== 'string') return false;
                        const cleanUrl = url.trim().toLowerCase();
                        return cleanUrl.includes('tiktok.com/@') && cleanUrl.includes('/video/');
                      });
                      allUrls.push(...validTikTokUrls.map(url => ({ url, platform: 'tiktok' })));
                    }
                  }
                }
              }

              campaignProgress.totalUrls = allUrls.length;
              sendProgress(campaignProgress);

              if (allUrls.length === 0) {
                campaignProgress.status = 'completed';
                sendProgress(campaignProgress);
                
                await supabase.rpc('update_campaign_analytics', {
                  p_campaign_id: campaign.id,
                  p_total_views: 0,
                  p_total_engagement: 0,
                  p_engagement_rate: 0,
                  p_analytics_data: {}
                });
                continue;
              }

              // Process URLs and accumulate results
              let totalViews = 0;
              let totalEngagement = 0;
              let platformResults: any = {};

              // Process URLs in batches of 3 to avoid rate limits
              const batchSize = 3;
              for (let i = 0; i < allUrls.length; i += batchSize) {
                const batch = allUrls.slice(i, i + batchSize);
                
                const batchPromises = batch.map(async ({ url, platform }) => {
                  try {
                    const response = await supabase.functions.invoke(`fetch-${platform}-analytics`, {
                      body: { url }
                    });
                    
                    if (response.data) {
                      const data = response.data;
                      totalViews += data.views || 0;
                      totalEngagement += data.engagement || 0;
                      
                      if (!platformResults[platform]) {
                        platformResults[platform] = [];
                      }
                      platformResults[platform].push({ url, ...data });
                      
                      return { success: true };
                    } else {
                      console.error(`Error processing ${platform} URL ${url}:`, response.error);
                      return { success: false };
                    }
                  } catch (error) {
                    console.error(`Error processing ${platform} URL ${url}:`, error);
                    return { success: false };
                  }
                });

                await Promise.all(batchPromises);
                
                // Update progress
                campaignProgress.processedUrls = Math.min(i + batchSize, allUrls.length);
                sendProgress(campaignProgress);

                // Add delay between batches to respect rate limits
                if (i + batchSize < allUrls.length) {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              }

              // Calculate engagement rate and update campaign
              const engagementRate = totalViews > 0 ? Number(((totalEngagement / totalViews) * 100).toFixed(2)) : 0;

              await supabase.rpc('update_campaign_analytics', {
                p_campaign_id: campaign.id,
                p_total_views: totalViews,
                p_total_engagement: totalEngagement,
                p_engagement_rate: engagementRate,
                p_analytics_data: platformResults
              });

              campaignProgress.status = 'completed';
              sendProgress(campaignProgress);

            } catch (error) {
              console.error(`Error processing campaign ${campaign.id}:`, error);
              
              campaignProgress.status = 'error';
              campaignProgress.error = error.message;
              sendProgress(campaignProgress);
              
              // Set status to error
              try {
                await supabase.rpc('set_campaign_status', {
                  p_campaign_id: campaign.id,
                  p_status: 'error'
                });
              } catch (statusError) {
                console.error(`Failed to update status for campaign ${campaign.id}:`, statusError);
              }
            }
          }

          // Send completion signal
          controller.enqueue(encoder.encode('data: {"type": "complete"}\n\n'));
          
        } catch (error) {
          console.error('Error in progressive refresh:', error);
          controller.enqueue(encoder.encode(`data: {"type": "error", "message": "${error.message}"}\n\n`));
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
