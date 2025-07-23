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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error('Campaign not found');
    }

    // Update status to analyzing
    await supabase
      .from('campaigns')
      .update({ status: 'analyzing' })
      .eq('id', campaignId);

    console.log('Processing campaign:', campaign.brand_name);

    let totalViews = 0;
    let totalEngagement = 0;
    let platformCount = 0;

    // Process content URLs if they exist
    if (campaign.content_urls && typeof campaign.content_urls === 'object') {
      const urls = campaign.content_urls as Record<string, string[]>;
      
      // Process YouTube URLs
      if (urls.youtube && urls.youtube.length > 0) {
        for (const url of urls.youtube) {
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
              platformCount++;

              // Store analytics data
              await supabase
                .from('analytics_data')
                .insert({
                  campaign_id: campaignId,
                  platform: 'youtube',
                  content_url: url,
                  views: data.views || 0,
                  engagement: data.engagement || 0,
                  likes: data.likes || 0,
                  comments: data.comments || 0,
                  engagement_rate: data.rate || 0,
                });
            }
          } catch (error) {
            console.error('Error processing YouTube URL:', url, error);
          }
        }
      }

      // Process Instagram URLs
      if (urls.instagram && urls.instagram.length > 0) {
        for (const url of urls.instagram) {
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
              platformCount++;

              // Store analytics data
              await supabase
                .from('analytics_data')
                .insert({
                  campaign_id: campaignId,
                  platform: 'instagram',
                  content_url: url,
                  views: data.views || 0,
                  engagement: data.engagement || 0,
                  likes: data.likes || 0,
                  comments: data.comments || 0,
                  engagement_rate: data.rate || 0,
                });
            }
          } catch (error) {
            console.error('Error processing Instagram URL:', url, error);
          }
        }
      }

      // Process TikTok URLs
      if (urls.tiktok && urls.tiktok.length > 0) {
        for (const url of urls.tiktok) {
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
              platformCount++;

              // Store analytics data
              await supabase
                .from('analytics_data')
                .insert({
                  campaign_id: campaignId,
                  platform: 'tiktok',
                  content_url: url,
                  views: data.views || 0,
                  engagement: data.engagement || 0,
                  likes: data.likes || 0,
                  comments: data.comments || 0,
                  shares: data.shares || 0,
                  engagement_rate: data.rate || 0,
                });
            }
          } catch (error) {
            console.error('Error processing TikTok URL:', url, error);
          }
        }
      }
    }

    // Calculate engagement rate
    const engagementRate = totalViews > 0 ? Number(((totalEngagement / totalViews) * 100).toFixed(2)) : 0;

    // Update campaign with final analytics
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        status: 'completed',
        total_views: totalViews,
        total_engagement: totalEngagement,
        engagement_rate: engagementRate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalViews,
        totalEngagement,
        engagementRate,
        platformsProcessed: platformCount,
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
      await supabase
        .from('campaigns')
        .update({ status: 'error' })
        .eq('id', campaignId);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});