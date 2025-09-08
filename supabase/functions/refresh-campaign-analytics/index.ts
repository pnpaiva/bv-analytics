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
    const { campaignId } = await req.json();
    
    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: 'Campaign ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing campaign:', campaignId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Set status to analyzing
    await supabase.rpc('set_campaign_status', {
      p_campaign_id: campaignId,
      p_status: 'analyzing'
    });

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    console.log('Campaign query result:', { campaign, campaignError });

    if (campaignError) {
      console.error('Campaign query error:', campaignError);
      throw new Error(`Campaign query failed: ${campaignError.message}`);
    }

    if (!campaign) {
      console.error('Campaign not found for ID:', campaignId);
      throw new Error('Campaign not found');
    }

    // Get campaign creators and their content URLs
    const { data: campaignCreators, error: creatorsError } = await supabase
      .from('campaign_creators')
      .select('*')
      .eq('campaign_id', campaignId);

    if (creatorsError) {
      throw new Error(`Failed to fetch campaign creators: ${creatorsError.message}`);
    }

    console.log('Campaign creators found:', campaignCreators?.length || 0);

    let totalViews = 0;
    let totalEngagement = 0;
    let platformResults: any = {};

    // Process each creator's content URLs individually
    if (campaignCreators && campaignCreators.length > 0) {
      // Aggregate all URLs by platform from all creators
      const allUrls: Record<string, string[]> = {
        youtube: [],
        instagram: [],
        tiktok: []
      };

      // Collect all URLs from all creators
      for (const creator of campaignCreators) {
        if (creator.content_urls && typeof creator.content_urls === 'object') {
          const urls = creator.content_urls as Record<string, string[]>;
          
          if (urls.youtube && Array.isArray(urls.youtube)) {
            const validYouTubeUrls = urls.youtube.filter(url => {
              if (!url || typeof url !== 'string') return false;
              const cleanUrl = url.trim().toLowerCase();
              
              // Skip if it's a placeholder, example, or test URL
              if (cleanUrl.includes('placeholder') || 
                  cleanUrl.includes('example') || 
                  cleanUrl.includes('test') ||
                  cleanUrl.includes('sample') ||
                  cleanUrl.includes('demo')) {
                return false;
              }
              
              // Must be a valid YouTube URL
              return cleanUrl.includes('youtube.com/watch') || 
                     cleanUrl.includes('youtu.be/') ||
                     cleanUrl.includes('youtube.com/shorts/');
            });
            allUrls.youtube.push(...validYouTubeUrls);
          }
          
          if (urls.instagram && Array.isArray(urls.instagram)) {
            const validInstagramUrls = urls.instagram.filter(url => {
              if (!url || typeof url !== 'string') return false;
              const cleanUrl = url.trim().toLowerCase();
              
              // Skip if it's a placeholder, example, or test URL
              if (cleanUrl.includes('placeholder') || 
                  cleanUrl.includes('example') || 
                  cleanUrl.includes('test') ||
                  cleanUrl.includes('sample') ||
                  cleanUrl.includes('demo')) {
                return false;
              }
              
              // Must be a valid Instagram URL
              return cleanUrl.includes('instagram.com/p/') || 
                     cleanUrl.includes('instagram.com/reel/') ||
                     cleanUrl.includes('instagram.com/tv/');
            });
            allUrls.instagram.push(...validInstagramUrls);
          }
          
          if (urls.tiktok && Array.isArray(urls.tiktok)) {
            const validTikTokUrls = urls.tiktok.filter(url => {
              if (!url || typeof url !== 'string') return false;
              const cleanUrl = url.trim().toLowerCase();
              
              // Skip if it's a placeholder, example, or test URL
              if (cleanUrl.includes('placeholder') || 
                  cleanUrl.includes('example') || 
                  cleanUrl.includes('test') ||
                  cleanUrl.includes('sample') ||
                  cleanUrl.includes('demo')) {
                return false;
              }
              
              // Must be a valid TikTok URL
              return cleanUrl.includes('tiktok.com/@') && cleanUrl.includes('/video/');
            });
            allUrls.tiktok.push(...validTikTokUrls);
          }
        }
      }

      console.log('Aggregated URLs:', allUrls);
      console.log('URL counts - YouTube:', allUrls.youtube.length, 'Instagram:', allUrls.instagram.length, 'TikTok:', allUrls.tiktok.length);
      
      // Process YouTube URLs with retry logic
      if (allUrls.youtube.length > 0) {
        console.log('Processing YouTube URLs:', allUrls.youtube.length);
        platformResults.youtube = [];
        
        for (let i = 0; i < allUrls.youtube.length; i++) {
          const url = allUrls.youtube[i];
          let retries = 3;
          
          while (retries > 0) {
            try {
              console.log(`Processing YouTube URL ${i + 1}/${allUrls.youtube.length}: ${url}`);
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
                console.log('YouTube data:', data);
                break; // Success, exit retry loop
              } else {
                console.error(`YouTube API failed for ${url}, status: ${response.status}`);
                retries--;
                if (retries > 0) await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
              }
            } catch (error) {
              console.error('Error processing YouTube URL:', url, error);
              retries--;
              if (retries > 0) await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
            }
          }
          
          // Add delay between requests to avoid rate limiting
          if (i < allUrls.youtube.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }

      // Process Instagram URLs with retry logic
      if (allUrls.instagram.length > 0) {
        console.log('Processing Instagram URLs:', allUrls.instagram.length);
        platformResults.instagram = [];
        
        for (let i = 0; i < allUrls.instagram.length; i++) {
          const url = allUrls.instagram[i];
          let retries = 3;
          
          while (retries > 0) {
            try {
              console.log(`Processing Instagram URL ${i + 1}/${allUrls.instagram.length}: ${url}`);
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
                console.log('Instagram data:', data);
                break; // Success, exit retry loop
              } else {
                console.error(`Instagram API failed for ${url}, status: ${response.status}`);
                retries--;
                if (retries > 0) await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
              }
            } catch (error) {
              console.error('Error processing Instagram URL:', url, error);
              retries--;
              if (retries > 0) await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
            }
          }
          
          // Add delay between requests to avoid rate limiting
          if (i < allUrls.instagram.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }

      // Process TikTok URLs with retry logic
      if (allUrls.tiktok.length > 0) {
        console.log('Processing TikTok URLs:', allUrls.tiktok.length);
        platformResults.tiktok = [];
        
        for (let i = 0; i < allUrls.tiktok.length; i++) {
          const url = allUrls.tiktok[i];
          let retries = 3;
          
          while (retries > 0) {
            try {
              console.log(`Processing TikTok URL ${i + 1}/${allUrls.tiktok.length}: ${url}`);
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
                console.log('TikTok data:', data);
                break; // Success, exit retry loop
              } else {
                console.error(`TikTok API failed for ${url}, status: ${response.status}`);
                retries--;
                if (retries > 0) await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
              }
            } catch (error) {
              console.error('Error processing TikTok URL:', url, error);
              retries--;
              if (retries > 0) await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
            }
          }
          
          // Add delay between requests to avoid rate limiting  
          if (i < allUrls.tiktok.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
    }

    // Calculate engagement rate
    const engagementRate = totalViews > 0 ? Number(((totalEngagement / totalViews) * 100).toFixed(2)) : 0;

    console.log('Final totals for campaign:', campaignId, { 
      totalViews, 
      totalEngagement, 
      engagementRate,
      platformResults 
    });

    // Save individual URL analytics to daily tracking table
    if (platformResults) {
      for (const [platform, urls] of Object.entries(platformResults)) {
        if (Array.isArray(urls)) {
          for (const urlData of urls) {
            try {
              await supabase.rpc('upsert_campaign_url_analytics', {
                p_campaign_id: campaignId,
                p_content_url: urlData.url,
                p_platform: platform,
                p_date_recorded: new Date().toISOString().split('T')[0], // Today's date
                p_views: urlData.views || 0,
                p_likes: urlData.likes || 0,
                p_comments: urlData.comments || 0,
                p_shares: urlData.shares || 0,
                p_engagement: urlData.engagement || 0,
                p_engagement_rate: urlData.rate || 0,
                p_analytics_metadata: {
                  fetched_at: new Date().toISOString(),
                  api_source: platform
                }
              });
            } catch (error) {
              console.error(`Error saving URL analytics for ${urlData.url}:`, error);
            }
          }
        }
      }
    }

    // Update campaign with analytics using the simplified function
    const { error: updateError } = await supabase.rpc('update_campaign_analytics', {
      p_campaign_id: campaignId,
      p_total_views: totalViews,
      p_total_engagement: totalEngagement,
      p_engagement_rate: engagementRate,
      p_analytics_data: platformResults
    });

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: `Failed to update campaign analytics: ${updateError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Set status to completed on success
    await supabase.rpc('set_campaign_status', {
      p_campaign_id: campaignId,
      p_status: 'completed'
    });

    return new Response(
      JSON.stringify({
        success: true,
        totalViews,
        totalEngagement,
        engagementRate,
        platformResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error refreshing campaign analytics:', error);

    // Update campaign status to error
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
      const { campaignId } = await req.json().catch(() => ({}));
      if (campaignId) {
        await supabase.rpc('set_campaign_status', {
          p_campaign_id: campaignId,
          p_status: 'error'
        });
      }
    } catch (statusError) {
      console.error('Failed to update campaign status:', statusError);
    }

    return new Response(
      JSON.stringify({ error: error.message || String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});