import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { campaignId } = await req.json();

    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: 'Campaign ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Collecting daily performance for campaign: ${campaignId}`);

    // Get current campaign data
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error('Campaign not found:', campaignError);
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get campaign URL analytics for today's data
    const today = new Date().toISOString().split('T')[0];
    
    const { data: urlAnalytics, error: analyticsError } = await supabase
      .from('campaign_url_analytics')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('date_recorded', today);

    if (analyticsError) {
      console.error('Error fetching URL analytics:', analyticsError);
    }

    // Calculate totals from URL analytics or use campaign totals
    let totalViews = campaign.total_views || 0;
    let totalEngagement = campaign.total_engagement || 0;
    let engagementRate = campaign.engagement_rate || 0;
    let platformBreakdown = {};

    if (urlAnalytics && urlAnalytics.length > 0) {
      totalViews = urlAnalytics.reduce((sum, entry) => sum + (entry.views || 0), 0);
      totalEngagement = urlAnalytics.reduce((sum, entry) => sum + (entry.engagement || 0), 0);
      engagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

      // Create platform breakdown
      platformBreakdown = urlAnalytics.reduce((breakdown, entry) => {
        if (!breakdown[entry.platform]) {
          breakdown[entry.platform] = {
            views: 0,
            engagement: 0,
            urls: 0
          };
        }
        breakdown[entry.platform].views += entry.views || 0;
        breakdown[entry.platform].engagement += entry.engagement || 0;
        breakdown[entry.platform].urls += 1;
        return breakdown;
      }, {} as any);
    }

    // Upsert daily performance data
    const { error: upsertError } = await supabase
      .rpc('upsert_daily_campaign_performance', {
        p_campaign_id: campaignId,
        p_date_recorded: today,
        p_total_views: totalViews,
        p_total_engagement: totalEngagement,
        p_engagement_rate: Number(engagementRate.toFixed(2)),
        p_platform_breakdown: platformBreakdown
      });

    if (upsertError) {
      console.error('Error upserting daily performance:', upsertError);
      throw upsertError;
    }

    console.log(`Daily performance collected for campaign ${campaignId}:`, {
      views: totalViews,
      engagement: totalEngagement,
      rate: engagementRate.toFixed(2) + '%'
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          campaign_id: campaignId,
          date_recorded: today,
          total_views: totalViews,
          total_engagement: totalEngagement,
          engagement_rate: Number(engagementRate.toFixed(2)),
          platform_breakdown: platformBreakdown
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in collect-daily-performance:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});