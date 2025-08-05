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

          console.log(`Campaign ${campaignId} URLs:`, {
            youtube: allUrls.youtube.length,
            instagram: allUrls.instagram.length,
            tiktok: allUrls.tiktok.length
          });

          // If no URLs found, mark as completed with zero analytics
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

          // Process analytics using existing refresh function
          const refreshResponse = await fetch(`${supabaseUrl}/functions/v1/refresh-campaign-analytics`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ campaignId }),
          });
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            console.log(`Campaign ${campaignId} analytics updated:`, {
              views: refreshData.totalViews,
              engagement: refreshData.totalEngagement,
              rate: refreshData.engagementRate
            });
            
            return { campaignId, success: true };
          } else {
            const errorText = await refreshResponse.text();
            throw new Error(`Analytics refresh failed: ${errorText}`);
          }

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