import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  "https://hepscjgcjnlofdpoewqx.supabase.co",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface MilestoneRequest {
  campaignId: string;
  milestone: number;
  userId: string;
  brandName: string;
  clientName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Milestone celebration function called");
    const { campaignId, milestone, userId, brandName, clientName }: MilestoneRequest = await req.json();
    
    console.log(`Processing milestone celebration for campaign ${campaignId}, milestone ${milestone}`);

    // Get user email
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !userProfile) {
      console.error("Error fetching user profile:", profileError);
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get campaign analytics breakdown
    const { data: urlAnalytics, error: analyticsError } = await supabase.rpc(
      "get_campaign_url_analytics",
      {
        p_campaign_id: campaignId,
        p_start_date: null,
        p_end_date: null,
      }
    );

    if (analyticsError) {
      console.error("Error fetching campaign analytics:", analyticsError);
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError) {
      console.error("Error fetching campaign details:", campaignError);
    }

    // Format milestone number
    const formatViews = (views: number) => {
      if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
      if (views >= 1000) return `${(views / 1000).toFixed(0)}K`;
      return views.toString();
    };

    // Build email content
    const topPerformingUrls = urlAnalytics?.slice(0, 5) || [];
    const totalEngagement = urlAnalytics?.reduce((sum: number, url: any) => sum + (url.total_engagement || 0), 0) || 0;
    const avgEngagementRate = urlAnalytics?.length > 0 
      ? (urlAnalytics.reduce((sum: number, url: any) => sum + (url.avg_engagement_rate || 0), 0) / urlAnalytics.length).toFixed(2)
      : "0.00";

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Milestone Achievement! 🎉</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Your campaign just crossed ${formatViews(milestone)} views!</p>
        </div>

        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #343a40; margin: 0 0 15px 0; font-size: 22px;">Campaign Details</h2>
          <div style="display: grid; gap: 10px;">
            <div><strong>Brand:</strong> ${brandName}</div>
            ${clientName ? `<div><strong>Client:</strong> ${clientName}</div>` : ''}
            <div><strong>Total Views:</strong> ${formatViews(milestone)}+</div>
            <div><strong>Total Engagement:</strong> ${totalEngagement.toLocaleString()}</div>
            <div><strong>Average Engagement Rate:</strong> ${avgEngagementRate}%</div>
          </div>
        </div>

        ${topPerformingUrls.length > 0 ? `
        <div style="background: #fff; border: 1px solid #dee2e6; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #495057; margin: 0 0 20px 0; font-size: 18px;">Top Performing Content</h3>
          ${topPerformingUrls.map((url: any, index: number) => `
            <div style="border-bottom: 1px solid #f1f3f4; padding: 15px 0; ${index === topPerformingUrls.length - 1 ? 'border-bottom: none;' : ''}">
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
        ` : ''}

        <div style="text-align: center; padding: 20px 0;">
          <p style="color: #6c757d; margin: 0; font-size: 14px;">
            Keep up the amazing work! Your content is making a real impact.
          </p>
        </div>
      </div>
    `;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Campaign Analytics <onboarding@resend.dev>",
      to: [userProfile.email || `user-${userId}@example.com`],
      subject: `🎉 ${brandName} Campaign Reached ${formatViews(milestone)} Views!`,
      html: emailContent,
    });

    console.log("Email sent successfully:", emailResponse);

    // Update milestone record to mark email as sent
    const { error: updateError } = await supabase
      .from("campaign_milestones")
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
      })
      .eq("campaign_id", campaignId)
      .eq("milestone_views", milestone);

    if (updateError) {
      console.error("Error updating milestone record:", updateError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Celebration email sent successfully",
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-milestone-celebration function:", error);
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