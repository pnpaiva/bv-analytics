import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// APIFY Actor IDs for comment scraping
const APIFY_ACTORS = {
  youtube: 'p7UMdpQnjKmmpR21D',
  instagram: 'RA9pXL2RPtBbFamco',
  tiktok: 'BDec00yAmCm1QbMEI',
};

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
    const apifyApiKey = Deno.env.get('APIFY_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!apifyApiKey) {
      throw new Error('APIFY_API_KEY is not configured');
    }
    
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    
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

        // Scrape comments using APIFY
        const comments = await scrapeComments(item.url, item.platform, apifyApiKey);
        
        if (!comments || comments.length === 0) {
          console.log('No comments found for URL:', item.url);
          continue;
        }

        console.log(`Scraped ${comments.length} comments for URL:`, item.url);

        // Analyze sentiment using ChatGPT
        const analysis = await analyzeSentiment(comments, openaiApiKey);
        
        if (!analysis) {
          console.log('Failed to analyze sentiment for URL:', item.url);
          continue;
        }
        
        console.log('Analysis result:', analysis);

        // Store sentiment analysis
        const { data: sentimentData, error: sentimentError } = await supabase.rpc(
          'upsert_campaign_sentiment_analysis',
          {
            p_campaign_id: campaignId,
            p_content_url: item.url,
            p_platform: item.platform,
            p_sentiment_score: analysis.sentiment_score || 0,
            p_sentiment_label: analysis.sentiment_label || 'neutral',
            p_main_topics: analysis.main_topics || [],
            p_key_themes: analysis.key_themes || [],
            p_total_comments_analyzed: comments.length,
            p_analysis_metadata: {
              analyzed_at: new Date().toISOString(),
              sample_size: comments.length,
              blurb: analysis.blurb || '',
              examples: analysis.examples || []
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
            analysis: {
              sentiment: analysis.sentiment_label,
              score: analysis.sentiment_score,
              blurb: analysis.blurb,
              comments_analyzed: comments.length
            }
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

// Helper function to scrape comments using APIFY
async function scrapeComments(url: string, platform: string, apiKey: string): Promise<string[]> {
  try {
    let actorId: string;
    let input: any;

    // Determine which APIFY actor to use based on platform
    const platformLower = platform.toLowerCase();
    
    if (platformLower === 'youtube') {
      actorId = APIFY_ACTORS.youtube;
      input = {
        startUrls: [{ url }],
        maxComments: 100,
        maxReplies: 0
      };
    } else if (platformLower === 'instagram') {
      actorId = APIFY_ACTORS.instagram;
      input = {
        startUrls: [url],
        maxItems: 100,
        customMapFunction: "(object) => { return {...object} }"
      };
    } else if (platformLower === 'tiktok') {
      actorId = APIFY_ACTORS.tiktok;
      input = {
        postURLs: [url],
        commentsPerPost: 100
      };
    } else {
      console.log('Unsupported platform:', platform);
      return [];
    }

    console.log(`Starting APIFY actor ${actorId} for ${platform}`);

    // Start the APIFY actor
    const runResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Failed to start APIFY actor:', errorText);
      return [];
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    console.log(`APIFY run started: ${runId}`);

    // Poll for completion (max 60 seconds)
    let status = 'RUNNING';
    let attempts = 0;
    const maxAttempts = 30;

    while (status === 'RUNNING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs/${runId}?token=${apiKey}`);
      const statusData = await statusResponse.json();
      status = statusData.data.status;
      attempts++;
      
      console.log(`APIFY status check ${attempts}/${maxAttempts}: ${status}`);
    }

    if (status !== 'SUCCEEDED') {
      console.error('APIFY actor did not succeed:', status);
      return [];
    }

    // Get the results
    const resultsResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs/${runId}/dataset/items?token=${apiKey}`);
    
    if (!resultsResponse.ok) {
      const errorText = await resultsResponse.text();
      console.error('Failed to fetch APIFY results:', resultsResponse.status, errorText);
      return [];
    }
    
    const results = await resultsResponse.json();
    console.log(`Retrieved ${results.length} items from APIFY for ${platform}`);
    
    // Log first item to see structure
    if (results.length > 0) {
      console.log('First item structure:', JSON.stringify(results[0], null, 2).substring(0, 500));
    }

    // Extract comment texts based on platform
    const comments: string[] = [];
    
    if (platformLower === 'youtube') {
      results.forEach((item: any) => {
        if (item.text) comments.push(item.text);
      });
    } else if (platformLower === 'instagram') {
      // Instagram actor returns comments with 'text' field
      results.forEach((item: any) => {
        // Check multiple possible fields for comment text
        const text = item.text || item.comment || item.caption || item.ownerUsername;
        if (text && typeof text === 'string' && text.trim().length > 0) {
          comments.push(text);
        }
      });
    } else if (platformLower === 'tiktok') {
      results.forEach((item: any) => {
        if (item.text) comments.push(item.text);
      });
    }

    console.log(`Extracted ${comments.length} comments from ${results.length} items for ${platform}`);
    return comments.filter(c => c && c.length > 0);

  } catch (error) {
    console.error('Error scraping comments with APIFY:', error);
    return [];
  }
}

// Helper function to analyze sentiment using ChatGPT
async function analyzeSentiment(comments: string[], apiKey: string): Promise<any> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a sentiment analysis expert. Analyze comments and provide structured, detailed sentiment data in JSON format.'
          },
          {
            role: 'user',
            content: `Analyze these ${comments.length} comments and provide a JSON response with:
1. sentiment_score: a number between -1 (very negative) and 1 (very positive)
2. sentiment_label: "positive", "negative", or "neutral"
3. main_topics: array of top 5 topics discussed (strings)
4. key_themes: array of 3-5 key themes (strings)
5. blurb: a 2-3 sentence summary of the overall sentiment and key takeaways
6. examples: array of 3 example comments that represent the sentiment (objects with "text" and "category" fields where category is positive/neutral/negative)

Comments (showing first 100):
${comments.slice(0, 100).join('\n---\n')}

Respond ONLY with valid JSON.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.log('No content in OpenAI response');
      return null;
    }

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('No JSON found in response');
      return null;
    }

    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.error('Error analyzing sentiment with ChatGPT:', error);
    return null;
  }
}
