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
    console.log('Starting scheduled daily refresh at:', new Date().toISOString());

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create a refresh log entry
    const { data: logEntry, error: logError } = await supabase
      .from('campaign_refresh_logs')
      .insert({
        trigger_type: 'scheduled',
        started_at: new Date().toISOString(),
        campaign_results: []
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to create log entry:', logError);
    }

    const logId = logEntry?.id;

    // Fetch all active campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id, brand_name, organization_id')
      .in('status', ['active', 'live', 'published'])
      .order('created_at', { ascending: true });

    if (campaignsError) {
      console.error('Failed to fetch campaigns:', campaignsError);
      throw new Error(`Failed to fetch campaigns: ${campaignsError.message}`);
    }

    if (!campaigns || campaigns.length === 0) {
      console.log('No active campaigns found to refresh');
      
      if (logId) {
        await supabase
          .from('campaign_refresh_logs')
          .update({
            completed_at: new Date().toISOString(),
            total_campaigns: 0,
            successful_campaigns: 0,
            failed_campaigns: 0,
            campaign_results: []
          })
          .eq('id', logId);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active campaigns to refresh',
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${campaigns.length} active campaigns to refresh`);

    const results: Array<{ campaignId: string; brandName: string; success: boolean; error?: string }> = [];

    // Process campaigns one by one with delays to avoid rate limits
    for (let i = 0; i < campaigns.length; i++) {
      const campaign = campaigns[i];
      console.log(`Processing campaign ${i + 1}/${campaigns.length}: ${campaign.brand_name} (${campaign.id})`);

      try {
        // Call the refresh function for this single campaign
        const response = await fetch(`${supabaseUrl}/functions/v1/refresh-all-campaigns-with-apify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ campaignIds: [campaign.id] }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✓ Successfully refreshed campaign: ${campaign.brand_name}`);
          
          // Trigger sentiment analysis for this campaign (don't wait for it)
          fetch(`${supabaseUrl}/functions/v1/analyze-campaign-sentiment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ campaignId: campaign.id }),
          }).catch(err => {
            console.log(`Note: Sentiment analysis skipped for ${campaign.brand_name}:`, err.message);
          });
          
          results.push({
            campaignId: campaign.id,
            brandName: campaign.brand_name,
            success: true
          });
        } else {
          const errorText = await response.text();
          console.error(`✗ Failed to refresh campaign ${campaign.brand_name}:`, errorText);
          results.push({
            campaignId: campaign.id,
            brandName: campaign.brand_name,
            success: false,
            error: errorText
          });
        }
      } catch (error) {
        console.error(`✗ Error refreshing campaign ${campaign.brand_name}:`, error);
        results.push({
          campaignId: campaign.id,
          brandName: campaign.brand_name,
          success: false,
          error: error.message
        });
      }

      // Add delay between campaigns to avoid rate limits (10 seconds)
      // This gives each campaign's individual URLs time to process
      if (i < campaigns.length - 1) {
        console.log(`Waiting 10 seconds before processing next campaign...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`\n=== Refresh Summary ===`);
    console.log(`Total: ${campaigns.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failureCount}`);
    console.log(`Completed at: ${new Date().toISOString()}`);

    // Update the log entry with final results
    if (logId) {
      await supabase
        .from('campaign_refresh_logs')
        .update({
          completed_at: new Date().toISOString(),
          total_campaigns: campaigns.length,
          successful_campaigns: successCount,
          failed_campaigns: failureCount,
          campaign_results: results
        })
        .eq('id', logId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: campaigns.length,
        successful: successCount,
        failed: failureCount,
        results: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scheduled-daily-refresh:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
