import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Campaign } from '@/hooks/useCampaigns';
import { format } from 'date-fns';

export interface ExportOptions {
  includeLogo?: boolean;
  includeAnalytics?: boolean;
  includeContentUrls?: boolean;
  includeMasterCampaigns?: boolean;
  includeCharts?: boolean;
  theme?: 'default' | 'dark' | 'minimal';
}

export interface MasterCampaignData {
  name: string;
  campaigns: Campaign[];
  totalViews: number;
  totalEngagement: number;
  avgEngagementRate: number;
  dateRange: string;
}

// Premium color palette
const COLORS = {
  primary: [37, 99, 235] as [number, number, number],
  primaryLight: [99, 139, 245] as [number, number, number],
  secondary: [67, 56, 202] as [number, number, number],
  accent: [16, 185, 129] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  error: [239, 68, 68] as [number, number, number],
  text: [15, 23, 42] as [number, number, number],
  textLight: [71, 85, 105] as [number, number, number],
  textMuted: [148, 163, 184] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  background: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  gradient: {
    start: [99, 139, 245] as [number, number, number],
    end: [67, 56, 202] as [number, number, number]
  }
};

export class PremiumPDFExporter {
  private doc: jsPDF;
  private currentY: number;
  private margin: number;
  private contentWidth: number;
  private pageWidth: number;
  private pageHeight: number;
  private theme: 'default' | 'dark' | 'minimal';

  constructor(theme: 'default' | 'dark' | 'minimal' = 'default') {
    this.doc = new jsPDF('p', 'mm', 'a4', true);
    this.currentY = 25;
    this.margin = 25;
    this.contentWidth = 160; // A4 width (210mm) - margins (25mm each side)
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.theme = theme;
  }

  private addPageHeader() {
    // Simple background with color
    this.doc.setFillColor(...COLORS.background);
    this.doc.rect(0, 0, this.pageWidth, 15, 'F');
    
    // Add a subtle top border
    this.doc.setDrawColor(...COLORS.primary);
    this.doc.setLineWidth(2);
    this.doc.line(0, 3, this.pageWidth, 3);
  }

  private addPageFooter() {
    const footerY = this.pageHeight - 15;
    
    // Footer line
    this.doc.setDrawColor(...COLORS.border);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, footerY, this.pageWidth - this.margin, footerY);
    
    // Page number
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...COLORS.textMuted);
    
    const pageNum = this.doc.getCurrentPageInfo().pageNumber;
    const pageText = `Page ${pageNum}`;
    const pageWidth = this.doc.getTextWidth(pageText);
    this.doc.text(pageText, this.pageWidth - this.margin - pageWidth, footerY + 8);
    
    // Generated timestamp
    const timestamp = format(new Date(), 'MMM d, yyyy • h:mm a');
    this.doc.text(timestamp, this.margin, footerY + 8);
  }

  private addHeroHeader(title: string, subtitle?: string, metrics?: { views: number; engagement: number; campaigns: number }) {
    // Hero background with gradient
    this.doc.setFillColor(...COLORS.primary);
    this.doc.roundedRect(this.margin - 5, this.currentY - 5, this.contentWidth + 10, 45, 4, 4, 'F');
    
    // White text for contrast
    this.doc.setTextColor(...COLORS.white);
    
    // Main title
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin + 5, this.currentY + 10);
    
    if (subtitle) {
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(subtitle, this.margin + 5, this.currentY + 20);
    }
    
    // Metrics in the hero section if provided
    if (metrics) {
      const metricsY = this.currentY + 30;
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      
      // Format metrics horizontally
      let metricsX = this.margin + 5;
      const spacing = 45;
      
      this.doc.text(`${metrics.views.toLocaleString()}`, metricsX, metricsY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Total Views', metricsX, metricsY + 4);
      
      metricsX += spacing;
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${metrics.engagement.toLocaleString()}`, metricsX, metricsY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Engagement', metricsX, metricsY + 4);
      
      metricsX += spacing;
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${metrics.campaigns}`, metricsX, metricsY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Campaigns', metricsX, metricsY + 4);
    }
    
    this.currentY += 55;
    this.resetTextStyle();
  }

  private resetTextStyle() {
    this.doc.setTextColor(...COLORS.text);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
  }

  private checkPageBreak(requiredSpace: number = 25) {
    if (this.currentY + requiredSpace > this.pageHeight - 25) {
      this.doc.addPage();
      this.addPageHeader();
      this.currentY = 30;
    }
  }

  private addSectionHeader(title: string, color: [number, number, number] = COLORS.primary) {
    this.checkPageBreak(30);
    
    // Section header with background
    this.doc.setFillColor(color[0], color[1], color[2]);
    this.doc.roundedRect(this.margin - 2, this.currentY - 2, this.contentWidth + 4, 12, 2, 2, 'F');
    
    // White text on colored background
    this.doc.setTextColor(...COLORS.white);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin + 2, this.currentY + 6);
    
    this.currentY += 18;
    this.resetTextStyle();
  }

  private addMetricCard(title: string, value: string, subtitle?: string, color: [number, number, number] = COLORS.primary) {
    const cardWidth = 45;
    const cardHeight = 25;
    
    // Card background
    this.doc.setFillColor(255, 255, 255);
    this.doc.setDrawColor(color[0], color[1], color[2]);
    this.doc.setLineWidth(1);
    this.doc.roundedRect(this.margin, this.currentY, cardWidth, cardHeight, 3, 3, 'FD');
    
    // Accent bar on top
    this.doc.setFillColor(color[0], color[1], color[2]);
    this.doc.roundedRect(this.margin, this.currentY, cardWidth, 3, 3, 3, 'F');
    
    // Card content
    this.doc.setTextColor(color[0], color[1], color[2]);
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    
    // Center the value
    const valueWidth = this.doc.getTextWidth(value);
    const valueX = this.margin + (cardWidth - valueWidth) / 2;
    this.doc.text(value, valueX, this.currentY + 12);
    
    // Title
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...COLORS.textLight);
    const titleWidth = this.doc.getTextWidth(title);
    const titleX = this.margin + (cardWidth - titleWidth) / 2;
    this.doc.text(title, titleX, this.currentY + 18);
    
    if (subtitle) {
      this.doc.setFontSize(8);
      const subtitleWidth = this.doc.getTextWidth(subtitle);
      const subtitleX = this.margin + (cardWidth - subtitleWidth) / 2;
      this.doc.text(subtitle, subtitleX, this.currentY + 22);
    }
    
    return cardWidth + 5; // Return width for positioning next card
  }

  private addKeyValuePair(key: string, value: string, indent: number = 0, bold: boolean = false) {
    this.checkPageBreak();
    
    this.doc.setFont('helvetica', bold ? 'bold' : 'normal');
    this.doc.setTextColor(...COLORS.textLight);
    this.doc.setFontSize(9);
    this.doc.text(`${key}:`, this.margin + indent, this.currentY);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...COLORS.text);
    this.doc.setFontSize(10);
    this.doc.text(value, this.margin + indent + 35, this.currentY);
    
    this.currentY += 6;
  }

  private addCampaignCard(campaign: Campaign, options: ExportOptions) {
    this.checkPageBreak(60);
    
    const cardStartY = this.currentY;
    
    // Modern card design with shadow effect
    this.doc.setFillColor(...COLORS.white);
    this.doc.setDrawColor(...COLORS.border);
    this.doc.setLineWidth(0.5);
    this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, 50, 6, 6, 'FD');
    
    // Status indicator colors
    const statusColor = (() => {
      switch (campaign.status.toLowerCase()) {
        case 'live': return COLORS.accent;
        case 'completed': return COLORS.primary;
        case 'draft': return COLORS.textMuted;
        case 'analyzing': return COLORS.warning;
        case 'error': return COLORS.error;
        default: return COLORS.textMuted;
      }
    })();
    this.doc.setFillColor(...statusColor);
    this.doc.roundedRect(this.margin + 2, this.currentY + 2, 4, 46, 2, 2, 'F');
    
    // Campaign title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...COLORS.text);
    this.doc.text(campaign.brand_name, this.margin + 10, this.currentY + 10);
    
    // Status badge
    this.doc.setFillColor(...statusColor);
    this.doc.setTextColor(...COLORS.white);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    const statusText = campaign.status.toUpperCase();
    const statusWidth = this.doc.getTextWidth(statusText) + 6;
    this.doc.roundedRect(this.margin + this.contentWidth - statusWidth - 5, this.currentY + 5, statusWidth, 8, 2, 2, 'F');
    this.doc.text(statusText, this.margin + this.contentWidth - statusWidth - 2, this.currentY + 10);
    
    // Campaign details in two columns
    const leftColX = this.margin + 10;
    const rightColX = this.margin + 90;
    let detailY = this.currentY + 20;
    
    // Left column
    this.doc.setTextColor(...COLORS.textLight);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Creator:', leftColX, detailY);
    this.doc.setTextColor(...COLORS.text);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(campaign.creators?.name || 'Unknown', leftColX + 20, detailY);
    
    detailY += 6;
    this.doc.setTextColor(...COLORS.textLight);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Date:', leftColX, detailY);
    this.doc.setTextColor(...COLORS.text);
    this.doc.text(format(new Date(campaign.campaign_date), 'MMM d, yyyy'), leftColX + 20, detailY);
    
    // Right column - Analytics
    if (options.includeAnalytics) {
      detailY = this.currentY + 20;
      this.doc.setTextColor(...COLORS.textLight);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Views:', rightColX, detailY);
      this.doc.setTextColor(...COLORS.primary);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text((campaign.total_views || 0).toLocaleString(), rightColX + 20, detailY);
      
      detailY += 6;
      this.doc.setTextColor(...COLORS.textLight);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Engagement:', rightColX, detailY);
      this.doc.setTextColor(...COLORS.accent);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${(campaign.engagement_rate || 0).toFixed(1)}%`, rightColX + 30, detailY);
    }
    
    // Deal value if available
    if (campaign.deal_value) {
      detailY += 6;
      this.doc.setTextColor(...COLORS.textLight);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Value:', leftColX, detailY);
      this.doc.setTextColor(...COLORS.warning);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`$${campaign.deal_value.toLocaleString()}`, leftColX + 20, detailY);
    }
    
    this.currentY = cardStartY + 60;
    this.resetTextStyle();
  }

  private addExecutiveSummary(campaigns: Campaign[]) {
    this.addSectionHeader('Executive Summary', COLORS.secondary);
    
    const totalViews = campaigns.reduce((sum, c) => sum + (c.total_views || 0), 0);
    const totalEngagement = campaigns.reduce((sum, c) => sum + (c.total_engagement || 0), 0);
    const avgEngagementRate = campaigns.length > 0 
      ? campaigns.reduce((sum, c) => sum + (c.engagement_rate || 0), 0) / campaigns.length 
      : 0;
    
    const totalValue = campaigns.reduce((sum, c) => sum + (c.deal_value || 0), 0);
    
    // Metric cards layout
    let cardX = this.margin;
    const cardSpacing = 5;
    
    // Views card
    const cardWidth1 = this.addMetricCard('Total Views', totalViews.toLocaleString(), undefined, COLORS.primary);
    cardX += cardWidth1;
    
    // Engagement rate card  
    this.currentY -= 25; // Reset Y for same row
    this.margin = cardX;
    const cardWidth2 = this.addMetricCard('Avg Engagement', `${avgEngagementRate.toFixed(1)}%`, undefined, COLORS.accent);
    cardX += cardWidth2;
    
    // Campaigns card
    this.currentY -= 25; // Reset Y for same row
    this.margin = cardX;
    const cardWidth3 = this.addMetricCard('Campaigns', campaigns.length.toString(), undefined, COLORS.secondary);
    
    // Deal value card
    if (totalValue > 0) {
      cardX += cardWidth3;
      this.currentY -= 25; // Reset Y for same row
      this.margin = cardX;
      this.addMetricCard('Total Value', `$${totalValue.toLocaleString()}`, undefined, COLORS.warning);
    }
    
    // Reset margin
    this.margin = 25;
    this.currentY += 35;
    
    // Key insights
    const insights = this.generateInsights(campaigns);
    if (insights.length > 0) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...COLORS.text);
      this.doc.text('Key Insights:', this.margin, this.currentY);
      this.currentY += 8;
      
      insights.forEach((insight, index) => {
        this.doc.setFillColor(...COLORS.background);
        this.doc.roundedRect(this.margin, this.currentY - 2, this.contentWidth, 10, 2, 2, 'F');
        
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(...COLORS.text);
        this.doc.text(`• ${insight}`, this.margin + 5, this.currentY + 4);
        this.currentY += 12;
      });
    }
    
    this.currentY += 10;
  }

  private generateInsights(campaigns: Campaign[]): string[] {
    const insights: string[] = [];
    
    // Best performing campaign
    const bestCampaign = campaigns.reduce((best, current) => 
      (current.total_views || 0) > (best.total_views || 0) ? current : best
    , campaigns[0]);
    
    if (bestCampaign && bestCampaign.total_views) {
      insights.push(`${bestCampaign.brand_name} achieved the highest views with ${bestCampaign.total_views.toLocaleString()}`);
    }
    
    // Platform analysis
    const platformViews: Record<string, number> = {};
    campaigns.forEach(campaign => {
      if (campaign.analytics_data) {
        Object.entries(campaign.analytics_data).forEach(([platform, data]) => {
          if (Array.isArray(data)) {
            const views = data.reduce((sum: number, item: any) => sum + (item.views || 0), 0);
            platformViews[platform] = (platformViews[platform] || 0) + views;
          }
        });
      }
    });
    
    const topPlatform = Object.entries(platformViews).sort(([,a], [,b]) => b - a)[0];
    if (topPlatform) {
      insights.push(`${topPlatform[0].charAt(0).toUpperCase() + topPlatform[0].slice(1)} generated the most views with ${topPlatform[1].toLocaleString()}`);
    }
    
    // Engagement rate insight
    const avgEngagement = campaigns.reduce((sum, c) => sum + (c.engagement_rate || 0), 0) / campaigns.length;
    if (avgEngagement > 3) {
      insights.push(`Strong average engagement rate of ${avgEngagement.toFixed(1)}% indicates high audience connection`);
    }
    
    return insights.slice(0, 3); // Limit to top 3 insights
  }

  async exportPremiumReport(
    campaigns: Campaign[], 
    title: string = 'Campaign Performance Report',
    options: ExportOptions = {}
  ): Promise<void> {
    // Add first page header
    this.addPageHeader();
    
    // Calculate metrics for hero
    const totalViews = campaigns.reduce((sum, c) => sum + (c.total_views || 0), 0);
    const totalEngagement = campaigns.reduce((sum, c) => sum + (c.total_engagement || 0), 0);
    
    // Hero section
    this.addHeroHeader(
      title,
      `Comprehensive analysis of ${campaigns.length} campaigns`,
      {
        views: totalViews,
        engagement: totalEngagement,
        campaigns: campaigns.length
      }
    );
    
    // Executive summary
    this.addExecutiveSummary(campaigns);
    
    // Campaign details
    if (campaigns.length > 0) {
      this.addSectionHeader('Campaign Details', COLORS.primary);
      
      campaigns.forEach((campaign, index) => {
        this.addCampaignCard(campaign, {
          includeAnalytics: true,
          ...options
        });
      });
    }
    
    // Add footer to all pages
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.addPageFooter();
    }
    
    const filename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    this.doc.save(`${filename}_premium.pdf`);
  }

  async exportSingleCampaignPremium(campaign: Campaign, options: ExportOptions = {}): Promise<void> {
    this.addPageHeader();
    
    this.addHeroHeader(
      campaign.brand_name,
      `Campaign by ${campaign.creators?.name || 'Unknown Creator'}`,
      {
        views: campaign.total_views || 0,
        engagement: campaign.total_engagement || 0,
        campaigns: 1
      }
    );
    
    // Campaign details card
    this.addCampaignCard(campaign, {
      includeAnalytics: true,
      includeContentUrls: true,
      ...options
    });
    
    // Content URLs section if requested
    if (options.includeContentUrls && campaign.content_urls) {
      this.addSectionHeader('Content Links', COLORS.accent);
      
      Object.entries(campaign.content_urls).forEach(([platform, urls]) => {
        if (Array.isArray(urls) && urls.length > 0) {
          this.doc.setFontSize(12);
          this.doc.setFont('helvetica', 'bold');
          this.doc.setTextColor(...COLORS.text);
          this.doc.text(`${platform.charAt(0).toUpperCase() + platform.slice(1)}:`, this.margin, this.currentY);
          this.currentY += 8;
          
          urls.forEach((url, index) => {
            if (url && url.trim()) {
              this.checkPageBreak();
              this.doc.setFontSize(9);
              this.doc.setFont('helvetica', 'normal');
              this.doc.setTextColor(...COLORS.primary);
              this.doc.text(`${index + 1}. ${url}`, this.margin + 5, this.currentY);
              this.currentY += 6;
            }
          });
          
          this.currentY += 5;
        }
      });
    }
    
    this.addPageFooter();
    this.doc.save(`${campaign.brand_name}_premium_report.pdf`);
  }

  // Legacy compatibility methods
  async exportWithCharts(
    campaigns: Campaign[], 
    title: string = 'Premium Campaign Analytics Report',
    options: ExportOptions = {}
  ): Promise<void> {
    return this.exportPremiumReport(campaigns, title, options);
  }

  exportMasterCampaigns(masterCampaigns: MasterCampaignData[], options: ExportOptions = {}): void {
    this.addPageHeader();
    
    this.addHeroHeader(
      'Master Campaigns Report',
      `${masterCampaigns.length} master campaigns included in this report`
    );

    // Summary statistics
    this.addSectionHeader('Master Campaign Summary', COLORS.secondary);
    const totalCampaigns = masterCampaigns.reduce((sum, mc) => sum + mc.campaigns.length, 0);
    const totalViews = masterCampaigns.reduce((sum, mc) => sum + mc.totalViews, 0);
    const totalEngagement = masterCampaigns.reduce((sum, mc) => sum + mc.totalEngagement, 0);

    let cardX = this.margin;
    
    // Master campaigns card
    const cardWidth1 = this.addMetricCard('Master Campaigns', masterCampaigns.length.toString(), undefined, COLORS.secondary);
    cardX += cardWidth1;
    
    // Total campaigns card  
    this.currentY -= 25;
    this.margin = cardX;
    const cardWidth2 = this.addMetricCard('Total Campaigns', totalCampaigns.toString(), undefined, COLORS.primary);
    cardX += cardWidth2;
    
    // Total views card
    this.currentY -= 25;
    this.margin = cardX;
    this.addMetricCard('Total Views', totalViews.toLocaleString(), undefined, COLORS.accent);
    
    // Reset margin
    this.margin = 25;
    this.currentY += 35;

    // Individual master campaigns
    masterCampaigns.forEach((masterCampaign) => {
      this.addSectionHeader(`Master Campaign: ${masterCampaign.name}`, COLORS.primary);
      
      // Master campaign summary
      this.addKeyValuePair('Campaign Count', masterCampaign.campaigns.length.toString());
      this.addKeyValuePair('Date Range', masterCampaign.dateRange);
      this.addKeyValuePair('Total Views', masterCampaign.totalViews.toLocaleString());
      this.addKeyValuePair('Total Engagement', masterCampaign.totalEngagement.toLocaleString());
      this.addKeyValuePair('Average Engagement Rate', `${masterCampaign.avgEngagementRate.toFixed(2)}%`);
      
      this.currentY += 10;

      // Individual campaigns
      masterCampaign.campaigns.forEach((campaign) => {
        this.addCampaignCard(campaign, {
          includeAnalytics: true,
          includeContentUrls: true,
          ...options
        });
      });
    });

    this.addPageFooter();
    this.doc.save('master_campaigns_premium_report.pdf');
  }
}