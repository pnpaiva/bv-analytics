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
}

export interface MasterCampaignData {
  name: string;
  campaigns: Campaign[];
  totalViews: number;
  totalEngagement: number;
  avgEngagementRate: number;
  dateRange: string;
}

export class EnhancedPDFExporter {
  private doc: jsPDF;
  private currentY: number;
  private margin: number;
  private pageWidth: number;
  private pageHeight: number;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4', true); // Enable Unicode support
    this.currentY = 20;
    this.margin = 20;
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  private addHeader(title: string, subtitle?: string) {
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 12;

    if (subtitle) {
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(subtitle, this.margin, this.currentY);
      this.currentY += 8;
    }

    // Add generation date
    this.doc.setFontSize(10);
    this.doc.setTextColor(120, 120, 120);
    this.doc.text(`Generated on ${format(new Date(), 'MMMM d, yyyy \'at\' h:mm a')}`, this.margin, this.currentY);
    this.currentY += 15;

    // Add line separator
    this.doc.setLineWidth(0.5);
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;

    this.resetTextStyle();
  }

  private resetTextStyle() {
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
  }

  private checkPageBreak(requiredSpace: number = 20) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  private addSectionHeader(title: string) {
    this.checkPageBreak(25);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 10;
    this.resetTextStyle();
  }

  private addKeyValuePair(key: string, value: string, indent: number = 0) {
    this.checkPageBreak();
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${key}:`, this.margin + indent, this.currentY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(value, this.margin + indent + 40, this.currentY);
    this.currentY += 6;
  }

  private async addChartFromElement(element: HTMLElement, title: string) {
    try {
      this.checkPageBreak(80);
      
      // Add chart title
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(title, this.margin, this.currentY);
      this.currentY += 10;

      // Convert chart to canvas
      const canvas = await html2canvas(element, {
        backgroundColor: 'white',
        scale: 2,
        logging: false,
        useCORS: true
      });

      // Convert canvas to image
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate dimensions to fit page
      const imgWidth = this.pageWidth - this.margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Check if we need a new page
      this.checkPageBreak(imgHeight + 10);
      
      // Add image to PDF
      this.doc.addImage(imgData, 'PNG', this.margin, this.currentY, imgWidth, imgHeight);
      this.currentY += imgHeight + 15;
      
    } catch (error) {
      console.error('Error adding chart to PDF:', error);
      // Fallback - just add a placeholder
      this.doc.setFont('helvetica', 'italic');
      this.doc.text('Chart could not be rendered', this.margin, this.currentY);
      this.currentY += 10;
    }
  }

  private addMiniDashboard(campaigns: Campaign[]) {
    this.addSectionHeader('Campaign Overview');
    
    const totalViews = campaigns.reduce((sum, c) => sum + (c.total_views || 0), 0);
    const totalEngagement = campaigns.reduce((sum, c) => sum + (c.total_engagement || 0), 0);
    const avgEngagementRate = campaigns.length > 0 
      ? campaigns.reduce((sum, c) => sum + (c.engagement_rate || 0), 0) / campaigns.length 
      : 0;

    // Get all individual posts from campaigns
    const allPosts: Array<{url: string, views: number, engagement: number, engagementRate: number, platform: string, campaignName: string}> = [];
    
    campaigns.forEach(campaign => {
      if (campaign.analytics_data) {
        Object.entries(campaign.analytics_data).forEach(([platform, data]) => {
          if (Array.isArray(data)) {
            data.forEach((item: any) => {
              if (item.content_url && item.views) {
                allPosts.push({
                  url: item.content_url,
                  views: item.views || 0,
                  engagement: item.engagement || 0,
                  engagementRate: item.engagement_rate || 0,
                  platform: platform,
                  campaignName: campaign.brand_name
                });
              }
            });
          }
        });
      }
    });

    // Find top performing posts
    const topPosts = [...allPosts]
      .sort((a, b) => b.views - a.views)
      .slice(0, 3);

    // Find best performing campaign
    const bestCampaign = campaigns.reduce((best, current) => 
      (current.total_views || 0) > (best.total_views || 0) ? current : best
    , campaigns[0]);

    this.addKeyValuePair('Total Views', totalViews.toLocaleString());
    this.addKeyValuePair('Avg Engagement Rate', `${avgEngagementRate.toFixed(2)}%`);
    this.currentY += 5;

    if (bestCampaign) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Best Performing Campaign:', this.margin, this.currentY);
      this.currentY += 6;
      this.addKeyValuePair('Campaign', bestCampaign.brand_name, 10);
      this.addKeyValuePair('Views', (bestCampaign.total_views || 0).toLocaleString(), 10);
      this.addKeyValuePair('Engagement Rate', `${(bestCampaign.engagement_rate || 0).toFixed(2)}%`, 10);
      this.currentY += 5;
    }

    if (topPosts.length > 0) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Top 3 Performing Posts:', this.margin, this.currentY);
      this.currentY += 6;
      
      topPosts.forEach((post, index) => {
        const rankText = index === 0 ? '#1' : index === 1 ? '#2' : '#3';
        this.addKeyValuePair(
          `${rankText} ${post.platform.toUpperCase()}`, 
          `${post.views.toLocaleString()} views (${post.engagementRate.toFixed(2)}%)`,
          10
        );
        this.addKeyValuePair('Campaign', post.campaignName, 15);
        this.addKeyValuePair('URL', post.url.substring(0, 50) + '...', 15);
        this.currentY += 2;
      });
    }

    this.currentY += 10;
  }

  async exportWithCharts(
    campaigns: Campaign[], 
    title: string = 'Enhanced Campaign Analytics Report',
    options: ExportOptions = {}
  ): Promise<void> {
    this.addHeader(title, `${campaigns.length} campaigns included in this report`);

    // Add mini dashboard
    this.addMiniDashboard(campaigns);

    // Add charts if available and requested
    if (options.includeCharts) {
      // Look for chart elements in the DOM
      const chartElements = [
        { selector: '[data-chart="platform-performance"]', title: 'Platform Performance' },
        { selector: '[data-chart="view-distribution"]', title: 'View Distribution' },
        { selector: '[data-chart="platform-breakdown"]', title: 'Platform Breakdown' },
        { selector: '[data-chart="creator-performance"]', title: 'Creator Performance' }
      ];

      for (const { selector, title } of chartElements) {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
          await this.addChartFromElement(element, title);
        }
      }
    }

    // Add summary statistics
    this.addSectionHeader('Summary Statistics');
    const totalViews = campaigns.reduce((sum, c) => sum + (c.total_views || 0), 0);
    const totalEngagement = campaigns.reduce((sum, c) => sum + (c.total_engagement || 0), 0);
    const avgEngagementRate = campaigns.length > 0 
      ? campaigns.reduce((sum, c) => sum + (c.engagement_rate || 0), 0) / campaigns.length 
      : 0;

    this.addKeyValuePair('Total Campaigns', campaigns.length.toString());
    this.addKeyValuePair('Total Views', totalViews.toLocaleString());
    this.addKeyValuePair('Total Engagement', totalEngagement.toLocaleString());
    this.addKeyValuePair('Average Engagement Rate', `${avgEngagementRate.toFixed(2)}%`);
    
    const uniqueCreators = new Set(campaigns.map(c => c.creators?.name).filter(Boolean));
    const uniqueClients = new Set(campaigns.map(c => c.clients?.name).filter(Boolean));
    
    this.addKeyValuePair('Unique Creators', uniqueCreators.size.toString());
    this.addKeyValuePair('Unique Clients', uniqueClients.size.toString());

    this.currentY += 15;

    // Add individual campaign details if requested
    if (options.includeAnalytics) {
      this.addSectionHeader('Campaign Details');
      campaigns.forEach((campaign) => {
        this.addCampaignCard(campaign, options);
      });
    }

    const filename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    this.doc.save(`${filename}.pdf`);
  }

  private addCampaignCard(campaign: Campaign, options: ExportOptions) {
    this.checkPageBreak(50);
    
    // Campaign header with border
    const cardStartY = this.currentY;
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.3);
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(campaign.brand_name, this.margin, this.currentY);
    this.currentY += 8;
    
    // Basic info
    this.addKeyValuePair('Creator', campaign.creators?.name || 'Unknown Creator');
    if (campaign.clients?.name) {
      this.addKeyValuePair('Client', campaign.clients.name);
    }
    this.addKeyValuePair('Status', campaign.status.toUpperCase());
    this.addKeyValuePair('Campaign Date', format(new Date(campaign.campaign_date), 'MMMM d, yyyy'));
    
    if (campaign.deal_value) {
      this.addKeyValuePair('Deal Value', `$${campaign.deal_value.toLocaleString()}`);
    }

    // Analytics data
    if (options.includeAnalytics) {
      this.currentY += 5;
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Analytics:', this.margin, this.currentY);
      this.currentY += 6;
      
      this.addKeyValuePair('Total Views', campaign.total_views?.toLocaleString() || '0', 10);
      this.addKeyValuePair('Total Engagement', campaign.total_engagement?.toLocaleString() || '0', 10);
      this.addKeyValuePair('Engagement Rate', `${campaign.engagement_rate?.toFixed(2) || '0'}%`, 10);
    }

    // Add card border
    const cardEndY = this.currentY + 5;
    this.doc.setDrawColor(220, 220, 220);
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.margin - 5, cardStartY - 5, this.pageWidth - this.margin * 2 + 10, cardEndY - cardStartY + 5);
    
    this.currentY = cardEndY + 10;
    this.resetTextStyle();
  }
}