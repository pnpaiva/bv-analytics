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

    if (campaignError || !campaign) {
      throw new Error('Campaign not found');
    }

    // Get campaign creators and their content URLs
    const { data: campaignCreators, error: creatorsError } = await supabase
      .from('campaign_creators')
      .select('*')
      .eq('campaign_id', campaignId);

    if (creatorsError) {
      console.error('Error fetching campaign creators:', creatorsError);
      throw new Error('Failed to fetch campaign creators');
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
            allUrls.youtube.push(...urls.youtube.filter(url => url.trim()));
          }
          if (urls.instagram && Array.isArray(urls.instagram)) {
            allUrls.instagram.push(...urls.instagram.filter(url => url.trim()));
          }
          if (urls.tiktok && Array.isArray(urls.tiktok)) {
            allUrls.tiktok.push(...urls.tiktok.filter(url => url.trim()));
          }
        }
      }

      console.log('Aggregated URLs:', allUrls);
      
      // Process YouTube URLs
      if (allUrls.youtube.length > 0) {
        console.log('Processing YouTube URLs:', allUrls.youtube.length);
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
              console.log('YouTube data:', data);
            }
          } catch (error) {
            console.error('Error processing YouTube URL:', url, error);
          }
        }
      }

      // Process Instagram URLs
      if (allUrls.instagram.length > 0) {
        console.log('Processing Instagram URLs:', allUrls.instagram.length);
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
              console.log('Instagram data:', data);
            }
          } catch (error) {
            console.error('Error processing Instagram URL:', url, error);
          }
        }
      }

      // Process TikTok URLs
      if (allUrls.tiktok.length > 0) {
        console.log('Processing TikTok URLs:', allUrls.tiktok.length);
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
              console.log('TikTok data:', data);
            }
          } catch (error) {
            console.error('Error processing TikTok URL:', url, error);
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
      urlCounts: {
        youtube: allUrls.youtube.length,
        instagram: allUrls.instagram.length,
        tiktok: allUrls.tiktok.length
      },
      platformResults 
    });

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
      throw updateError;
    }

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
    
    const { campaignId } = await req.json().catch(() => ({}));
    if (campaignId) {
      await supabase.rpc('set_campaign_status', {
        p_campaign_id: campaignId,
        p_status: 'error'
      });
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});