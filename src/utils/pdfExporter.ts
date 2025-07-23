import jsPDF from 'jspdf';
import { Campaign } from '@/hooks/useCampaigns';
import { format } from 'date-fns';

export interface ExportOptions {
  includeLogo?: boolean;
  includeAnalytics?: boolean;
  includeContentUrls?: boolean;
  includeMasterCampaigns?: boolean;
}

export interface MasterCampaignData {
  name: string;
  campaigns: Campaign[];
  totalViews: number;
  totalEngagement: number;
  avgEngagementRate: number;
  dateRange: string;
}

export class PDFExporter {
  private doc: jsPDF;
  private currentY: number;
  private margin: number;
  private pageWidth: number;
  private pageHeight: number;

  constructor() {
    this.doc = new jsPDF();
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

  private addSubsectionHeader(title: string) {
    this.checkPageBreak(20);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 8;
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

  private addText(text: string, indent: number = 0) {
    this.checkPageBreak();
    const lines = this.doc.splitTextToSize(text, this.pageWidth - this.margin * 2 - indent);
    lines.forEach((line: string) => {
      this.checkPageBreak();
      this.doc.text(line, this.margin + indent, this.currentY);
      this.currentY += 5;
    });
  }

  private addCampaignCard(campaign: Campaign, options: ExportOptions) {
    this.checkPageBreak(50);
    
    // Campaign header with border
    const cardStartY = this.currentY;
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.3);
    
    this.addSubsectionHeader(campaign.brand_name);
    
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

    // Master campaign info
    if (campaign.master_campaign_name) {
      this.addKeyValuePair('Master Campaign', campaign.master_campaign_name);
      if (campaign.master_campaign_start_date && campaign.master_campaign_end_date) {
        const startDate = format(new Date(campaign.master_campaign_start_date), 'MMM d, yyyy');
        const endDate = format(new Date(campaign.master_campaign_end_date), 'MMM d, yyyy');
        this.addKeyValuePair('Master Campaign Period', `${startDate} - ${endDate}`);
      }
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
      
      if (campaign.analytics_updated_at) {
        this.addKeyValuePair('Last Updated', format(new Date(campaign.analytics_updated_at), 'MMM d, yyyy \'at\' h:mm a'), 10);
      }
    }

    // Content URLs
    if (options.includeContentUrls && campaign.content_urls) {
      this.currentY += 5;
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Content Links:', this.margin, this.currentY);
      this.currentY += 6;

      Object.entries(campaign.content_urls).forEach(([platform, urls]) => {
        if (Array.isArray(urls) && urls.length > 0) {
          this.doc.setFont('helvetica', 'bold');
          this.doc.text(`${platform.charAt(0).toUpperCase() + platform.slice(1)}:`, this.margin + 10, this.currentY);
          this.currentY += 5;
          
          urls.forEach((url, index) => {
            if (url && url.trim()) {
              this.checkPageBreak();
              this.doc.setFont('helvetica', 'normal');
              this.doc.setTextColor(0, 0, 255);
              this.doc.text(`${index + 1}. ${url}`, this.margin + 20, this.currentY);
              this.doc.setTextColor(0, 0, 0);
              this.currentY += 5;
            }
          });
        }
      });
    }

    // Platform-specific analytics
    if (options.includeAnalytics && campaign.analytics_data) {
      this.currentY += 5;
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Platform Analytics:', this.margin, this.currentY);
      this.currentY += 6;

      Object.entries(campaign.analytics_data).forEach(([platform, data]) => {
        if (Array.isArray(data) && data.length > 0) {
          this.doc.setFont('helvetica', 'bold');
          this.doc.text(`${platform.charAt(0).toUpperCase() + platform.slice(1)}:`, this.margin + 10, this.currentY);
          this.currentY += 5;

          data.forEach((item: any, index: number) => {
            this.addKeyValuePair(`Post ${index + 1} Views`, item.views?.toLocaleString() || '0', 20);
            this.addKeyValuePair(`Post ${index + 1} Engagement`, item.engagement?.toLocaleString() || '0', 20);
            this.addKeyValuePair(`Post ${index + 1} Rate`, `${item.rate?.toFixed(2) || '0'}%`, 20);
            if (item.url) {
              this.checkPageBreak();
              this.doc.setFont('helvetica', 'normal');
              this.doc.setTextColor(0, 0, 255);
              this.doc.text(`URL: ${item.url}`, this.margin + 20, this.currentY);
              this.doc.setTextColor(0, 0, 0);
              this.currentY += 6;
            }
            this.currentY += 3;
          });
        }
      });
    }

    // Add card border
    const cardEndY = this.currentY + 5;
    this.doc.setDrawColor(220, 220, 220);
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.margin - 5, cardStartY - 5, this.pageWidth - this.margin * 2 + 10, cardEndY - cardStartY + 5);
    
    this.currentY = cardEndY + 10;
    this.resetTextStyle();
  }

  private addMasterCampaignSection(masterCampaign: MasterCampaignData, options: ExportOptions) {
    this.addSectionHeader(`Master Campaign: ${masterCampaign.name}`);
    
    // Master campaign summary
    this.addKeyValuePair('Campaign Count', masterCampaign.campaigns.length.toString());
    this.addKeyValuePair('Date Range', masterCampaign.dateRange);
    this.addKeyValuePair('Total Views', masterCampaign.totalViews.toLocaleString());
    this.addKeyValuePair('Total Engagement', masterCampaign.totalEngagement.toLocaleString());
    this.addKeyValuePair('Average Engagement Rate', `${masterCampaign.avgEngagementRate.toFixed(2)}%`);
    
    this.currentY += 10;

    // Individual campaigns
    this.addSubsectionHeader('Individual Campaigns:');
    masterCampaign.campaigns.forEach((campaign, index) => {
      this.addCampaignCard(campaign, options);
    });
  }

  exportSingleCampaign(campaign: Campaign, options: ExportOptions = {}): void {
    this.addHeader(
      `Campaign Report: ${campaign.brand_name}`,
      `Creator: ${campaign.creators?.name || 'Unknown'} | Date: ${format(new Date(campaign.campaign_date), 'MMMM d, yyyy')}`
    );

    this.addCampaignCard(campaign, {
      includeAnalytics: true,
      includeContentUrls: true,
      ...options
    });

    this.doc.save(`${campaign.brand_name}_Campaign_Report.pdf`);
  }

  exportMultipleCampaigns(campaigns: Campaign[], title: string = 'Campaign Analytics Report', options: ExportOptions = {}): void {
    this.addHeader(
      title,
      `${campaigns.length} campaigns included in this report`
    );

    // Summary statistics
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

    // Individual campaigns
    this.addSectionHeader('Campaign Details');
    campaigns.forEach((campaign, index) => {
      this.addCampaignCard(campaign, {
        includeAnalytics: true,
        includeContentUrls: true,
        ...options
      });
    });

    const filename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    this.doc.save(`${filename}.pdf`);
  }

  exportMasterCampaigns(masterCampaigns: MasterCampaignData[], options: ExportOptions = {}): void {
    this.addHeader(
      'Master Campaigns Report',
      `${masterCampaigns.length} master campaigns included in this report`
    );

    // Summary statistics
    this.addSectionHeader('Master Campaign Summary');
    const totalCampaigns = masterCampaigns.reduce((sum, mc) => sum + mc.campaigns.length, 0);
    const totalViews = masterCampaigns.reduce((sum, mc) => sum + mc.totalViews, 0);
    const totalEngagement = masterCampaigns.reduce((sum, mc) => sum + mc.totalEngagement, 0);

    this.addKeyValuePair('Total Master Campaigns', masterCampaigns.length.toString());
    this.addKeyValuePair('Total Individual Campaigns', totalCampaigns.toString());
    this.addKeyValuePair('Total Views', totalViews.toLocaleString());
    this.addKeyValuePair('Total Engagement', totalEngagement.toLocaleString());

    this.currentY += 15;

    // Individual master campaigns
    masterCampaigns.forEach((masterCampaign) => {
      this.addMasterCampaignSection(masterCampaign, {
        includeAnalytics: true,
        includeContentUrls: true,
        ...options
      });
    });

    this.doc.save('master_campaigns_report.pdf');
  }
}