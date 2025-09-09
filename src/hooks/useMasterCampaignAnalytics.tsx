import { useMemo } from 'react';
import { useAccessibleCampaigns } from '@/hooks/useAccessibleCampaigns';

export interface MasterCampaignAnalytics {
  totalViews: number;
  totalEngagement: number;
  engagementRate: number;
  campaignCount: number;
}

export function useMasterCampaignAnalytics(masterCampaignName: string | null): MasterCampaignAnalytics {
  const { data: campaigns = [] } = useAccessibleCampaigns();

  return useMemo(() => {
    if (!masterCampaignName) {
      return {
        totalViews: 0,
        totalEngagement: 0,
        engagementRate: 0,
        campaignCount: 0
      };
    }

    // Find all campaigns belonging to this master campaign (excluding the template)
    const masterCampaignCampaigns = campaigns.filter(
      campaign => 
        campaign.master_campaign_name === masterCampaignName &&
        !campaign.is_master_campaign_template
    );

    const totalViews = masterCampaignCampaigns.reduce((sum, campaign) => sum + (campaign.total_views || 0), 0);
    const totalEngagement = masterCampaignCampaigns.reduce((sum, campaign) => sum + (campaign.total_engagement || 0), 0);
    
    // Calculate weighted average engagement rate
    const campaignsWithRate = masterCampaignCampaigns.filter(c => c.engagement_rate > 0 && c.total_views > 0);
    const weightedEngagementRate = campaignsWithRate.length > 0
      ? campaignsWithRate.reduce((sum, c) => sum + ((c.engagement_rate || 0) * (c.total_views || 0)), 0) / totalViews
      : (totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0);

    return {
      totalViews,
      totalEngagement,
      engagementRate: Number(weightedEngagementRate.toFixed(2)),
      campaignCount: masterCampaignCampaigns.length
    };
  }, [campaigns, masterCampaignName]);
}