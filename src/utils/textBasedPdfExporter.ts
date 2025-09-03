import jsPDF from 'jspdf';
import { Campaign } from '@/hooks/useCampaigns';
import { format } from 'date-fns';

export interface TextExportOptions {
  includeAnalytics?: boolean;
  includeContentUrls?: boolean;
  includeMasterCampaigns?: boolean;
  customTitle?: string;
}

export interface MasterCampaignData {
  name: string;
  campaigns: Campaign[];
  totalViews: number;
  totalEngagement: number;
  avgEngagementRate: number;
  dateRange: string;
}

export class TextBasedPDFExporter {
  private doc: jsPDF;
  private currentY: number;
  private margin: number;
  private pageWidth: number;
  private pageHeight: number;
  private lineHeight: number;

  constructor() {
    this.doc = new jsPDF();
    this.currentY = 20;
    this.margin = 20;
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.lineHeight = 6;
  }

  private addPageHeader() {
    const pageNum = this.doc.getCurrentPageInfo().pageNumber;
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(128, 128, 128);
    this.doc.text(`Page ${pageNum}`, this.pageWidth - this.margin - 15, 15);
    this.doc.text(`Generated on ${format(new Date(), 'MMM d, yyyy h:mm a')}`, this.margin, 15);
    
    // Add a line
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, 18, this.pageWidth - this.margin, 18);
  }

  private resetTextStyle() {
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
  }

  private checkPageBreak(requiredSpace: number = 25) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.addPageHeader();
      this.currentY = 25;
    }
  }

  private addTitle(title: string) {
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 15;
    
    // Add line separator
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
    this.resetTextStyle();
  }

  private addSectionHeader(title: string) {
    this.checkPageBreak(20);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 8;
    
    // Underline
    this.doc.setDrawColor(100, 100, 100);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, this.currentY, this.margin + 50, this.currentY);
    this.currentY += 8;
    this.resetTextStyle();
  }

  private addSubheader(text: string) {
    this.checkPageBreak();
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(text, this.margin, this.currentY);
    this.currentY += this.lineHeight + 2;
    this.resetTextStyle();
  }

  private addText(text: string, indent: number = 0, bold: boolean = false) {
    this.checkPageBreak();
    this.doc.setFont('helvetica', bold ? 'bold' : 'normal');
    
    const maxWidth = this.pageWidth - this.margin * 2 - indent;
    const lines = this.doc.splitTextToSize(text, maxWidth);
    
    lines.forEach((line: string) => {
      this.checkPageBreak();
      this.doc.text(line, this.margin + indent, this.currentY);
      this.currentY += this.lineHeight;
    });
    
    this.resetTextStyle();
  }

  private addKeyValue(key: string, value: string, indent: number = 0) {
    this.checkPageBreak();
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${key}:`, this.margin + indent, this.currentY);
    
    this.doc.setFont('helvetica', 'normal');
    const keyWidth = this.doc.getTextWidth(`${key}: `);
    const maxValueWidth = this.pageWidth - this.margin * 2 - indent - keyWidth;
    const valueLines = this.doc.splitTextToSize(value, maxValueWidth);
    
    valueLines.forEach((line: string, index: number) => {
      if (index === 0) {
        this.doc.text(line, this.margin + indent + keyWidth, this.currentY);
      } else {
        this.currentY += this.lineHeight;
        this.checkPageBreak();
        this.doc.text(line, this.margin + indent + keyWidth, this.currentY);
      }
    });
    
    this.currentY += this.lineHeight;
    this.resetTextStyle();
  }

  private addBulletPoint(text: string, indent: number = 0) {
    this.checkPageBreak();
    this.doc.text('•', this.margin + indent, this.currentY);
    
    const maxWidth = this.pageWidth - this.margin * 2 - indent - 8;
    const lines = this.doc.splitTextToSize(text, maxWidth);
    
    lines.forEach((line: string, index: number) => {
      if (index === 0) {
        this.doc.text(line, this.margin + indent + 8, this.currentY);
      } else {
        this.currentY += this.lineHeight;
        this.checkPageBreak();
        this.doc.text(line, this.margin + indent + 8, this.currentY);
      }
    });
    
    this.currentY += this.lineHeight;
  }

  private addDivider() {
    this.currentY += 5;
    this.checkPageBreak();
    this.doc.setDrawColor(180, 180, 180);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 8;
  }

  private addExecutiveSummary(campaigns: Campaign[]) {
    this.addSectionHeader('EXECUTIVE SUMMARY');
    
    const totalViews = campaigns.reduce((sum, c) => sum + (c.total_views || 0), 0);
    const totalEngagement = campaigns.reduce((sum, c) => sum + (c.total_engagement || 0), 0);
    const avgEngagementRate = campaigns.length > 0 
      ? campaigns.reduce((sum, c) => sum + (c.engagement_rate || 0), 0) / campaigns.length 
      : 0;
    const totalValue = campaigns.reduce((sum, c) => sum + (c.deal_value || 0), 0);
    
    this.addKeyValue('Report Period', format(new Date(), 'MMMM yyyy'));
    this.addKeyValue('Total Campaigns', campaigns.length.toString());
    this.addKeyValue('Total Views', totalViews.toLocaleString());
    this.addKeyValue('Total Engagement', totalEngagement.toLocaleString());
    this.addKeyValue('Average Engagement Rate', `${avgEngagementRate.toFixed(2)}%`);
    if (totalValue > 0) {
      this.addKeyValue('Total Campaign Value', `$${totalValue.toLocaleString()}`);
    }
    
    // Performance insights
    this.currentY += 5;
    this.addSubheader('Key Performance Insights:');
    
    const bestCampaign = campaigns.reduce((best, current) => 
      (current.total_views || 0) > (best.total_views || 0) ? current : best
    , campaigns[0]);
    
    if (bestCampaign) {
      this.addBulletPoint(`Top performing campaign: "${bestCampaign.brand_name}" with ${(bestCampaign.total_views || 0).toLocaleString()} views`, 5);
    }
    
    const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
    if (completedCampaigns > 0) {
      this.addBulletPoint(`${completedCampaigns} campaigns completed successfully`, 5);
    }
    
    if (avgEngagementRate > 3) {
      this.addBulletPoint(`Strong average engagement rate of ${avgEngagementRate.toFixed(1)}% indicates excellent audience connection`, 5);
    }
    
    this.addDivider();
  }

  private addCampaignDetails(campaign: Campaign, options: TextExportOptions) {
    this.checkPageBreak(40);
    
    this.addSubheader(`Campaign: ${campaign.brand_name}`);
    
    // Basic campaign information
    this.addKeyValue('Creator', campaign.creators?.name || 'Unknown Creator', 5);
    if (campaign.clients?.name) {
      this.addKeyValue('Client', campaign.clients.name, 5);
    }
    this.addKeyValue('Status', campaign.status.toUpperCase(), 5);
    this.addKeyValue('Campaign Date', format(new Date(campaign.campaign_date), 'MMMM d, yyyy'), 5);
    
    if (campaign.deal_value) {
      this.addKeyValue('Deal Value', `$${campaign.deal_value.toLocaleString()}`, 5);
    }

    // Master campaign information
    if (campaign.master_campaign_name) {
      this.addKeyValue('Master Campaign', campaign.master_campaign_name, 5);
      if (campaign.master_campaign_start_date && campaign.master_campaign_end_date) {
        const startDate = format(new Date(campaign.master_campaign_start_date), 'MMM d, yyyy');
        const endDate = format(new Date(campaign.master_campaign_end_date), 'MMM d, yyyy');
        this.addKeyValue('Campaign Period', `${startDate} - ${endDate}`, 5);
      }
    }

    // Analytics data
    if (options.includeAnalytics) {
      this.currentY += 3;
      this.addText('PERFORMANCE METRICS:', 5, true);
      this.addKeyValue('Total Views', (campaign.total_views || 0).toLocaleString(), 10);
      this.addKeyValue('Total Engagement', (campaign.total_engagement || 0).toLocaleString(), 10);
      this.addKeyValue('Engagement Rate', `${(campaign.engagement_rate || 0).toFixed(2)}%`, 10);
      
      if (campaign.analytics_updated_at) {
        this.addKeyValue('Last Analytics Update', format(new Date(campaign.analytics_updated_at), 'MMM d, yyyy h:mm a'), 10);
      }
    }

    // Content URLs
    if (options.includeContentUrls && campaign.content_urls) {
      this.currentY += 3;
      this.addText('CONTENT LINKS:', 5, true);

      Object.entries(campaign.content_urls).forEach(([platform, urls]) => {
        if (Array.isArray(urls) && urls.length > 0) {
          this.addText(`${platform.charAt(0).toUpperCase() + platform.slice(1)}:`, 10, true);
          
          urls.forEach((url, index) => {
            if (url && url.trim()) {
              this.addText(`${index + 1}. ${url}`, 15);
            }
          });
        }
      });
    }

    // Platform-specific analytics breakdown
    if (options.includeAnalytics && campaign.analytics_data) {
      this.currentY += 3;
      this.addText('PLATFORM BREAKDOWN:', 5, true);

      Object.entries(campaign.analytics_data).forEach(([platform, data]) => {
        if (Array.isArray(data) && data.length > 0) {
          this.addText(`${platform.charAt(0).toUpperCase() + platform.slice(1)}:`, 10, true);

          data.forEach((item: any, index: number) => {
            this.addKeyValue(`Content ${index + 1} Views`, (item.views || 0).toLocaleString(), 15);
            this.addKeyValue(`Content ${index + 1} Engagement`, (item.engagement || 0).toLocaleString(), 15);
            this.addKeyValue(`Content ${index + 1} Rate`, `${(item.rate || 0).toFixed(2)}%`, 15);
            if (item.url) {
              this.addKeyValue(`Content ${index + 1} URL`, item.url, 15);
            }
            if (index < data.length - 1) this.currentY += 2;
          });
        }
      });
    }
    
    this.addDivider();
  }

  private addPlatformSummary(campaigns: Campaign[]) {
    this.addSectionHeader('PLATFORM PERFORMANCE SUMMARY');
    
    const platformStats: Record<string, { views: number; engagement: number; contentCount: number }> = {};
    
    campaigns.forEach(campaign => {
      if (campaign.analytics_data) {
        Object.entries(campaign.analytics_data).forEach(([platform, data]) => {
          if (!platformStats[platform]) {
            platformStats[platform] = { views: 0, engagement: 0, contentCount: 0 };
          }
          
          if (Array.isArray(data)) {
            data.forEach((item: any) => {
              platformStats[platform].views += item.views || 0;
              platformStats[platform].engagement += item.engagement || 0;
              platformStats[platform].contentCount += 1;
            });
          }
        });
      }
    });
    
    Object.entries(platformStats)
      .sort(([,a], [,b]) => b.views - a.views)
      .forEach(([platform, stats]) => {
        this.addSubheader(platform.charAt(0).toUpperCase() + platform.slice(1));
        this.addKeyValue('Total Views', stats.views.toLocaleString(), 5);
        this.addKeyValue('Total Engagement', stats.engagement.toLocaleString(), 5);
        this.addKeyValue('Content Pieces', stats.contentCount.toString(), 5);
        this.addKeyValue('Avg Engagement Rate', `${stats.views > 0 ? ((stats.engagement / stats.views) * 100).toFixed(2) : '0'}%`, 5);
        this.currentY += 3;
      });
    
    this.addDivider();
  }

  exportReport(
    campaigns: Campaign[], 
    title: string = 'Campaign Analytics Report',
    options: TextExportOptions = {}
  ): void {
    // Add page header to first page
    this.addPageHeader();
    
    // Add main title
    this.addTitle(title);
    
    // Add report metadata
    this.addKeyValue('Report Generated', format(new Date(), 'MMMM d, yyyy \'at\' h:mm a'));
    this.addKeyValue('Total Campaigns Included', campaigns.length.toString());
    this.currentY += 10;
    
    // Executive summary
    this.addExecutiveSummary(campaigns);
    
    // Platform summary
    if (options.includeAnalytics) {
      this.addPlatformSummary(campaigns);
    }
    
    // Individual campaign details
    if (campaigns.length > 0) {
      this.addSectionHeader('CAMPAIGN DETAILS');
      
      campaigns.forEach((campaign, index) => {
        this.addCampaignDetails(campaign, {
          includeAnalytics: true,
          includeContentUrls: true,
          ...options
        });
        
        // Add extra space between campaigns except for the last one
        if (index < campaigns.length - 1) {
          this.currentY += 5;
        }
      });
    }
    
    // Add final page numbers to all pages
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setTextColor(128, 128, 128);
      this.doc.text(`${i} of ${totalPages}`, this.pageWidth - this.margin - 20, this.pageHeight - 10);
    }
    
    const filename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    this.doc.save(`${filename}_report.pdf`);
  }

  exportSingleCampaign(campaign: Campaign, options: TextExportOptions = {}): void {
    this.addPageHeader();
    this.addTitle(`Campaign Report: ${campaign.brand_name}`);
    
    this.addKeyValue('Report Generated', format(new Date(), 'MMMM d, yyyy \'at\' h:mm a'));
    this.addKeyValue('Creator', campaign.creators?.name || 'Unknown Creator');
    this.addKeyValue('Campaign Date', format(new Date(campaign.campaign_date), 'MMMM d, yyyy'));
    this.currentY += 10;

    this.addCampaignDetails(campaign, {
      includeAnalytics: true,
      includeContentUrls: true,
      ...options
    });

    this.doc.save(`${campaign.brand_name}_Campaign_Report.pdf`);
  }
}