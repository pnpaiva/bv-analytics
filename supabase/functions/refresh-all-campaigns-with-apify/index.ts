import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface URLParsingResult {
  platform: string;
  urls: string[];
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

    console.log('Processing campaigns:', campaignIds);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results: Array<{ campaignId: string; success: boolean; error?: string }> = [];

    // Process campaigns in smaller batches to avoid overwhelming APIs
    const batchSize = 3;
    for (let i = 0; i < campaignIds.length; i += batchSize) {
      const batch = campaignIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (campaignId: string) => {
        try {
          console.log(`Processing campaign: ${campaignId}`);
          
          // Set status to analyzing
          await supabase.rpc('set_campaign_status', {
            p_campaign_id: campaignId,
            p_status: 'analyzing'
          });

          // Get campaign details with associated creators
          const { data: campaign, error: campaignError } = await supabase
            .from('campaigns')
            .select(`
              *,
              campaign_creators (
                creator_id,
                content_urls
              )
            `)
            .eq('id', campaignId)
            .single();

          if (campaignError || !campaign) {
            throw new Error(`Campaign not found: ${campaignError?.message}`);
          }

          // Collect all URLs from campaign creators
          const allUrls: Record<string, string[]> = {
            youtube: [],
            instagram: [],
            tiktok: []
          };

          if (campaign.campaign_creators) {
            for (const creator of campaign.campaign_creators) {
              if (creator.content_urls && typeof creator.content_urls === 'object') {
                const urls = creator.content_urls as Record<string, string[]>;
                
                // Validate and filter YouTube URLs
                if (urls.youtube && Array.isArray(urls.youtube)) {
                  const validYouTubeUrls = urls.youtube.filter(url => {
                    if (!url || typeof url !== 'string') return false;
                    const cleanUrl = url.trim().toLowerCase();
                    return cleanUrl.includes('youtube.com/watch') || 
                           cleanUrl.includes('youtu.be/') ||
                           cleanUrl.includes('youtube.com/shorts/');
                  });
                  allUrls.youtube.push(...validYouTubeUrls);
                }
                
                // Validate and filter Instagram URLs
                if (urls.instagram && Array.isArray(urls.instagram)) {
                  const validInstagramUrls = urls.instagram.filter(url => {
                    if (!url || typeof url !== 'string') return false;
                    const cleanUrl = url.trim().toLowerCase();
                    return cleanUrl.includes('instagram.com/p/') || 
                           cleanUrl.includes('instagram.com/reel/') ||
                           cleanUrl.includes('instagram.com/tv/');
                  });
                  allUrls.instagram.push(...validInstagramUrls);
                }
                
                // Validate and filter TikTok URLs
                if (urls.tiktok && Array.isArray(urls.tiktok)) {
                  const validTikTokUrls = urls.tiktok.filter(url => {
                    if (!url || typeof url !== 'string') return false;
                    const cleanUrl = url.trim().toLowerCase();
                    return cleanUrl.includes('tiktok.com/@') && cleanUrl.includes('/video/');
                  });
                  allUrls.tiktok.push(...validTikTokUrls);
                }
              }
            }
          }


          // If no URLs found, mark as completed
          if (allUrls.youtube.length === 0 && allUrls.instagram.length === 0 && allUrls.tiktok.length === 0) {
            await supabase.rpc('update_campaign_analytics', {
              p_campaign_id: campaignId,
              p_total_views: 0,
              p_total_engagement: 0,
              p_engagement_rate: 0,
              p_analytics_data: {}
            });
            return { campaignId, success: true };
          }

          // Process analytics directly to avoid redundant function calls
          let totalViews = 0;
          let totalEngagement = 0;
          let platformResults: any = {};

          // Process YouTube URLs efficiently
          if (allUrls.youtube.length > 0) {
            platformResults.youtube = [];
            for (const url of allUrls.youtube) {
              try {
                const response = await fetch(`${supabaseUrl}/functions/v1/fetch-youtube-analytics`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseKey}`,
                  },
                  body: JSON.stringify({ url }),
                });
                
                if (response.ok) {
                  const data = await response.json();
                  totalViews += data.views || 0;
                  totalEngagement += data.engagement || 0;
                  platformResults.youtube.push({ url, ...data });
                }
              } catch (error) {
                console.error(`Error processing YouTube URL ${url}:`, error);
              }
            }
          }

          // Process Instagram URLs efficiently  
          if (allUrls.instagram.length > 0) {
            platformResults.instagram = [];
            for (const url of allUrls.instagram) {
              try {
                const response = await fetch(`${supabaseUrl}/functions/v1/fetch-instagram-analytics`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseKey}`,
                  },
                  body: JSON.stringify({ url }),
                });
                
                if (response.ok) {
                  const data = await response.json();
                  totalViews += data.views || 0;
                  totalEngagement += data.engagement || 0;
                  platformResults.instagram.push({ url, ...data });
                }
              } catch (error) {
                console.error(`Error processing Instagram URL ${url}:`, error);
              }
            }
          }

          // Process TikTok URLs efficiently
          if (allUrls.tiktok.length > 0) {
            platformResults.tiktok = [];
            for (const url of allUrls.tiktok) {
              try {
                const response = await fetch(`${supabaseUrl}/functions/v1/fetch-tiktok-analytics`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseKey}`,
                  },
                  body: JSON.stringify({ url }),
                });
                
                if (response.ok) {
                  const data = await response.json();
                  totalViews += data.views || 0;
                  totalEngagement += data.engagement || 0;
                  platformResults.tiktok.push({ url, ...data });
                }
              } catch (error) {
                console.error(`Error processing TikTok URL ${url}:`, error);
              }
            }
          }

          // Calculate engagement rate and update campaign
          const engagementRate = totalViews > 0 ? Number(((totalEngagement / totalViews) * 100).toFixed(2)) : 0;

          await supabase.rpc('update_campaign_analytics', {
            p_campaign_id: campaignId,
            p_total_views: totalViews,
            p_total_engagement: totalEngagement,
            p_engagement_rate: engagementRate,
            p_analytics_data: platformResults
          });

          return { campaignId, success: true };

        } catch (error) {
          console.error(`Error processing campaign ${campaignId}:`, error);
          
          // Set status to error
          try {
            await supabase.rpc('set_campaign_status', {
              p_campaign_id: campaignId,
              p_status: 'error'
            });
          } catch (statusError) {
            console.error(`Failed to update status for campaign ${campaignId}:`, statusError);
          }
          
          return { 
            campaignId, 
            success: false, 
            error: error.message 
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to respect API rate limits
      if (i + batchSize < campaignIds.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Refresh completed: ${successCount} successful, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        successful: successCount,
        failed: failureCount,
        results: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in refresh-all-campaigns-with-apify:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});