import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    console.log(`Sending test milestone celebration to ${email}`);

    // Mock data for the test email
    const milestone = 100000;
    const brandName = "Sample Brand Campaign";
    const clientName = "Demo Client";
    const totalEngagement = 8750;
    const avgEngagementRate = "8.75";
    
    const mockUrls = [
      {
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        platform: "youtube",
        total_views: 45000,
        total_engagement: 3200,
        avg_engagement_rate: 7.11
      },
      {
        url: "https://www.instagram.com/p/sample-post/",
        platform: "instagram", 
        total_views: 32000,
        total_engagement: 2800,
        avg_engagement_rate: 8.75
      },
      {
        url: "https://www.tiktok.com/@user/video/sample",
        platform: "tiktok",
        total_views: 28000,
        total_engagement: 2750,
        avg_engagement_rate: 9.82
      }
    ];

    // Format milestone number
    const formatViews = (views: number) => {
      if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
      if (views >= 1000) return `${(views / 1000).toFixed(0)}K`;
      return views.toString();
    };

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Milestone Achievement! 🎉</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Your campaign just crossed ${formatViews(milestone)} views!</p>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.7; color: #ffd700;">✨ This is a test email to show you how milestone celebrations look ✨</p>
        </div>

        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #343a40; margin: 0 0 15px 0; font-size: 22px;">Campaign Details</h2>
          <div style="display: grid; gap: 10px;">
            <div><strong>Brand:</strong> ${brandName}</div>
            <div><strong>Client:</strong> ${clientName}</div>
            <div><strong>Total Views:</strong> ${formatViews(milestone)}+</div>
            <div><strong>Total Engagement:</strong> ${totalEngagement.toLocaleString()}</div>
            <div><strong>Average Engagement Rate:</strong> ${avgEngagementRate}%</div>
          </div>
        </div>

        <div style="background: #fff; border: 1px solid #dee2e6; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #495057; margin: 0 0 20px 0; font-size: 18px;">Top Performing Content</h3>
          ${mockUrls.map((url, index) => `
            <div style="border-bottom: 1px solid #f1f3f4; padding: 15px 0; ${index === mockUrls.length - 1 ? 'border-bottom: none;' : ''}">
              <div style="font-weight: 600; color: #495057; margin-bottom: 5px;">${url.platform.toUpperCase()} Content</div>
              <div style="font-size: 14px; color: #6c757d; margin-bottom: 8px; word-break: break-all;">
                <a href="${url.url}" target="_blank" style="color: #007bff; text-decoration: none;">${url.url}</a>
              </div>
              <div style="display: flex; gap: 20px; font-size: 13px; color: #6c757d;">
                <span><strong>Views:</strong> ${(url.total_views || 0).toLocaleString()}</span>
                <span><strong>Engagement:</strong> ${(url.total_engagement || 0).toLocaleString()}</span>
                <span><strong>Rate:</strong> ${(url.avg_engagement_rate || 0).toFixed(2)}%</span>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="text-align: center; padding: 20px 0;">
          <p style="color: #6c757d; margin: 0; font-size: 14px;">
            Keep up the amazing work! Your content is making a real impact.
          </p>
          <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 12px; font-style: italic;">
            This was a test email. Real milestone emails will be sent automatically when your campaigns hit 50K, 100K, 250K, 500K, and 1M views.
          </p>
        </div>
      </div>
    `;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Campaign Analytics <onboarding@resend.dev>",
      to: [email],
      subject: `🎉 TEST: ${brandName} Campaign Reached ${formatViews(milestone)} Views!`,
      html: emailContent,
    });

    console.log("Test email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Test celebration email sent successfully",
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-test-milestone function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);