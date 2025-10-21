import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
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

    console.log('Analyzing sentiment for campaign:', campaignId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get campaign with content URLs
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
    const urlsToAnalyze: Array<{ url: string; platform: string }> = [];
    
    if (campaign.campaign_creators) {
      for (const creator of campaign.campaign_creators) {
        if (creator.content_urls && typeof creator.content_urls === 'object') {
          const urls = creator.content_urls as Record<string, string[]>;
          
          Object.entries(urls).forEach(([platform, urlList]) => {
            if (Array.isArray(urlList)) {
              urlList.forEach(url => {
                if (url && url.trim()) {
                  urlsToAnalyze.push({ url: url.trim(), platform });
                }
              });
            }
          });
        }
      }
    }

    if (urlsToAnalyze.length === 0) {
      console.log('No URLs found to analyze for campaign:', campaignId);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No URLs to analyze',
          analyzed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${urlsToAnalyze.length} URLs to analyze`);
    
    const results = [];

    // Analyze each URL (limit to prevent excessive API calls)
    for (const item of urlsToAnalyze.slice(0, 10)) {
      try {
        console.log(`Analyzing ${item.platform} URL:`, item.url);

        // Fetch comments from the URL analytics metadata
        const { data: analytics } = await supabase
          .from('campaign_url_analytics')
          .select('analytics_metadata')
          .eq('campaign_id', campaignId)
          .eq('content_url', item.url)
          .eq('platform', item.platform)
          .order('date_recorded', { ascending: false })
          .limit(1)
          .single();

        // Extract sample comments if available
        const sampleComments = analytics?.analytics_metadata?.comments || [];
        
        if (sampleComments.length === 0) {
          console.log('No comments found for URL:', item.url);
          continue;
        }

        // Use Lovable AI to analyze sentiment and extract topics
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'You are an expert at analyzing social media comments. Extract sentiment and main topics from comments.'
              },
              {
                role: 'user',
                content: `Analyze these comments and provide: 
1. Overall sentiment score (-1 to 1, where -1=negative, 0=neutral, 1=positive)
2. Sentiment label (positive/neutral/negative)
3. Top 3-5 main topics discussed
4. Top 3-5 key themes or sentiments

Comments: ${JSON.stringify(sampleComments.slice(0, 50))}`
              }
            ],
            tools: [{
              type: 'function',
              function: {
                name: 'analyze_sentiment',
                description: 'Analyze sentiment and topics from comments',
                parameters: {
                  type: 'object',
                  properties: {
                    sentiment_score: { 
                      type: 'number',
                      description: 'Sentiment score from -1 (negative) to 1 (positive)'
                    },
                    sentiment_label: { 
                      type: 'string',
                      enum: ['positive', 'neutral', 'negative']
                    },
                    main_topics: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Top 3-5 main topics discussed'
                    },
                    key_themes: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Top 3-5 key themes or sentiments'
                    }
                  },
                  required: ['sentiment_score', 'sentiment_label', 'main_topics', 'key_themes'],
                  additionalProperties: false
                }
              }
            }],
            tool_choice: { type: 'function', function: { name: 'analyze_sentiment' } }
          })
        });

        if (!aiResponse.ok) {
          console.error('AI API error:', await aiResponse.text());
          continue;
        }

        const aiData = await aiResponse.json();
        const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
        
        if (!toolCall) {
          console.error('No tool call in AI response');
          continue;
        }

        const analysis = JSON.parse(toolCall.function.arguments);
        
        console.log('Analysis result:', analysis);

        // Store sentiment analysis
        const { data: sentimentData, error: sentimentError } = await supabase.rpc(
          'upsert_campaign_sentiment_analysis',
          {
            p_campaign_id: campaignId,
            p_content_url: item.url,
            p_platform: item.platform,
            p_sentiment_score: analysis.sentiment_score,
            p_sentiment_label: analysis.sentiment_label,
            p_main_topics: analysis.main_topics,
            p_key_themes: analysis.key_themes,
            p_total_comments_analyzed: sampleComments.length,
            p_analysis_metadata: {
              analyzed_at: new Date().toISOString(),
              sample_size: sampleComments.length
            }
          }
        );

        if (sentimentError) {
          console.error('Error storing sentiment:', sentimentError);
        } else {
          results.push({
            url: item.url,
            platform: item.platform,
            success: true,
            analysis
          });
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error analyzing ${item.platform} URL ${item.url}:`, error);
        results.push({
          url: item.url,
          platform: item.platform,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`Sentiment analysis completed. Analyzed ${results.filter(r => r.success).length} URLs`);

    return new Response(
      JSON.stringify({
        success: true,
        campaignId,
        analyzed: results.filter(r => r.success).length,
        total: urlsToAnalyze.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-campaign-sentiment:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
