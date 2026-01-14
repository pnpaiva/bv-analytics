import jsPDF from 'jspdf';
import { Campaign } from '@/hooks/useCampaigns';
import { format } from 'date-fns';
import QRCode from 'qrcode';

// Normalize content URLs which can be strings or objects with url property
type ContentUrlLike = string | { url?: string; [key: string]: unknown } | null | undefined;

export interface ExecutiveExportOptions {
  includeLogo?: boolean;
  includeAnalytics?: boolean;
  includeContentUrls?: boolean;
  includeMasterCampaigns?: boolean;
  includeCharts?: boolean;
  includeSentiment?: boolean;
  getCreatorNameForUrl?: (campaignId: string, url: string) => string | undefined;
  topVideos?: Array<{ title: string; url: string; platform: string; views: number; engagement: number; engagementRate: number }>;
  sentimentData?: Map<string, Array<{
    content_url: string;
    platform: string;
    sentiment_score: number;
    sentiment_label: string;
    main_topics: string[];
    key_themes: string[];
    total_comments_analyzed: number;
    analysis_metadata?: {
      blurb?: string;
      examples?: Array<{ text: string; category: string }>;
    };
  }>>;
  campaignCreators?: Array<{
    campaign_id: string;
    creator_id: string;
    content_urls?: Record<string, ContentUrlLike[]>;
    creators?: { name: string };
  }>;
}

// Beyond Views Brand Color Palette (from index.css design system)
const COLORS = {
  // Primary brand colors
  primary: [51, 51, 204] as [number, number, number],         // #3333CC - brand primary
  primaryDark: [32, 32, 137] as [number, number, number],     // #202089 - primary dark  
  primaryLight: [207, 216, 255] as [number, number, number],  // #CFD8FF - primary light
  
  // Secondary colors
  teal: [45, 212, 191] as [number, number, number],           // #2DD4BF - secondary teal
  orange: [255, 107, 53] as [number, number, number],         // #FF6B35 - secondary orange
  
  // Accent colors
  coral: [255, 144, 143] as [number, number, number],         // #FF908F - accent coral
  amber: [255, 202, 110] as [number, number, number],         // #FFCA6E - accent amber
  sky: [125, 178, 254] as [number, number, number],           // #7DB2FE - accent sky
  mint: [129, 211, 198] as [number, number, number],          // #81D3C6 - accent mint
  
  // Neutrals
  white: [255, 255, 255] as [number, number, number],         // #FFFFFF
  black: [15, 15, 19] as [number, number, number],            // #0F0F13
  grayLight: [251, 251, 254] as [number, number, number],     // #FBFBFE
  grayMedium: [233, 239, 255] as [number, number, number],    // #E9EFFF
  grayDark: [97, 125, 188] as [number, number, number],       // #617DBC
  border: [207, 216, 255] as [number, number, number],        // #CFD8FF (primaryLight)
  
  // Status colors (mapped to brand)
  positive: [45, 212, 191] as [number, number, number],       // teal
  negative: [255, 144, 143] as [number, number, number],      // coral
  neutral: [97, 125, 188] as [number, number, number],        // grayDark
  
  // Legacy aliases for compatibility
  navy: [51, 51, 204] as [number, number, number],            // mapped to primary
  navyLight: [207, 216, 255] as [number, number, number],     // mapped to primaryLight
  slate: [97, 125, 188] as [number, number, number],          // mapped to grayDark
  slateLight: [129, 211, 198] as [number, number, number],    // mapped to mint
  gold: [255, 107, 53] as [number, number, number],           // mapped to orange
  goldLight: [255, 202, 110] as [number, number, number],     // mapped to amber
  emerald: [45, 212, 191] as [number, number, number],        // mapped to teal
  lightGray: [233, 239, 255] as [number, number, number],     // mapped to grayMedium
};

export class ExecutivePDFExporter {
  private doc: jsPDF;
  private currentY: number;
  private margin: number;
  private pageWidth: number;
  private pageHeight: number;
  private contentWidth: number;
  private pageNumber: number = 1;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4', true);
    this.margin = 20;
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - this.margin * 2;
    this.currentY = this.margin;
  }

  private normalizeUrl(input: ContentUrlLike): string | null {
    const url = typeof input === 'string' ? input : input?.url;
    if (typeof url !== 'string') return null;
    const trimmed = url.trim();
    return trimmed.length ? trimmed : null;
  }

  private countTotalContent(campaigns: Campaign[], campaignCreators?: ExecutiveExportOptions['campaignCreators']): number {
    let total = 0;
    
    campaigns.forEach(campaign => {
      // Try campaign creators first (most accurate)
      if (campaignCreators) {
        const ccForCampaign = campaignCreators.filter(cc => cc.campaign_id === campaign.id);
        ccForCampaign.forEach(cc => {
          if (cc.content_urls) {
            Object.values(cc.content_urls).forEach((urls: any) => {
              if (Array.isArray(urls)) {
                urls.forEach((u: ContentUrlLike) => {
                  if (this.normalizeUrl(u)) total++;
                });
              }
            });
          }
        });
      } else if ((campaign as any).campaign_creators?.length > 0) {
        // Fallback to embedded campaign_creators
        (campaign as any).campaign_creators.forEach((cc: any) => {
          if (cc?.content_urls) {
            Object.values(cc.content_urls).forEach((urls: any) => {
              if (Array.isArray(urls)) {
                urls.forEach((u: ContentUrlLike) => {
                  if (this.normalizeUrl(u)) total++;
                });
              }
            });
          }
        });
      } else if (campaign.content_urls) {
        // Final fallback to campaign.content_urls
        Object.values(campaign.content_urls).forEach((urls: any) => {
          if (Array.isArray(urls)) {
            urls.forEach((u: ContentUrlLike) => {
              if (this.normalizeUrl(u)) total++;
            });
          }
        });
      }
    });
    
    return total;
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  }

  private checkPageBreak(requiredSpace: number = 20): boolean {
    if (this.currentY + requiredSpace > this.pageHeight - 25) {
      this.addPageFooter();
      this.doc.addPage();
      this.pageNumber++;
      this.currentY = this.margin + 10;
      this.addPageHeader();
      return true;
    }
    return false;
  }

  private addCoverPage(title: string, campaigns: Campaign[], options: ExecutiveExportOptions) {
    // Sophisticated navy header bar
    this.doc.setFillColor(...COLORS.navy);
    this.doc.rect(0, 0, this.pageWidth, 70, 'F');
    
    // Gold accent line
    this.doc.setFillColor(...COLORS.gold);
    this.doc.rect(0, 70, this.pageWidth, 3, 'F');
    
    // Report title
    this.doc.setTextColor(...COLORS.white);
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, 35);
    
    // Subtitle
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Executive Performance Summary', this.margin, 48);
    
    // Generation date
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLORS.slateLight);
    this.doc.text(format(new Date(), "MMMM d, yyyy 'at' h:mm a"), this.margin, 60);
    
    this.currentY = 95;
    
    // Key metrics summary boxes
    const totalViews = campaigns.reduce((sum, c) => sum + (c.total_views || 0), 0);
    const totalEngagement = campaigns.reduce((sum, c) => sum + (c.total_engagement || 0), 0);
    const avgEngagementRate = campaigns.length > 0 
      ? campaigns.reduce((sum, c) => sum + (c.engagement_rate || 0), 0) / campaigns.length 
      : 0;
    const totalContent = this.countTotalContent(campaigns, options.campaignCreators);
    
    const totalDealValue = campaigns.reduce((sum, c) => {
      const fixed = (c as any).fixed_deal_value || 0;
      const variable = (c as any).variable_deal_value || 0;
      return sum + (c.deal_value || fixed + variable || 0);
    }, 0);
    
    // Metrics row
    const metrics = [
      { label: 'Total Views', value: this.formatNumber(totalViews), color: COLORS.navy },
      { label: 'Engagement', value: this.formatNumber(totalEngagement), color: COLORS.emerald },
      { label: 'Avg. Rate', value: `${avgEngagementRate.toFixed(1)}%`, color: COLORS.gold },
      { label: 'Content', value: totalContent.toString(), color: COLORS.slate },
    ];
    
    const boxWidth = (this.contentWidth - 15) / 4;
    const boxHeight = 28;
    
    metrics.forEach((metric, i) => {
      const x = this.margin + i * (boxWidth + 5);
      
      // Box background
      this.doc.setFillColor(...COLORS.lightGray);
      this.doc.roundedRect(x, this.currentY, boxWidth, boxHeight, 3, 3, 'F');
      
      // Top accent
      this.doc.setFillColor(...metric.color);
      this.doc.roundedRect(x, this.currentY, boxWidth, 4, 3, 3, 'F');
      this.doc.rect(x, this.currentY + 2, boxWidth, 2, 'F');
      
      // Value
      this.doc.setTextColor(...metric.color);
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(metric.value, x + boxWidth / 2, this.currentY + 15, { align: 'center' });
      
      // Label
      this.doc.setTextColor(...COLORS.slate);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(metric.label, x + boxWidth / 2, this.currentY + 22, { align: 'center' });
    });
    
    this.currentY += boxHeight + 20;
    
    // Report scope section
    this.addSectionDivider('Report Scope');
    this.currentY += 5;
    
    const uniqueCreators = new Set(campaigns.flatMap(c => {
      if ((c as any).campaign_creators?.length > 0) {
        return (c as any).campaign_creators.map((cc: any) => cc.creators?.name).filter(Boolean);
      }
      return [c.creators?.name].filter(Boolean);
    }));
    
    const scopeItems = [
      { label: 'Campaigns Analyzed', value: campaigns.length.toString() },
      { label: 'Unique Creators', value: uniqueCreators.size.toString() },
      { label: 'Total Content Pieces', value: totalContent.toString() },
    ];
    
    if (totalDealValue > 0) {
      scopeItems.push({ label: 'Total Investment', value: `$${this.formatNumber(totalDealValue)}` });
    }
    
    scopeItems.forEach(item => {
      this.doc.setTextColor(...COLORS.slate);
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`${item.label}:`, this.margin + 5, this.currentY);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...COLORS.navy);
      this.doc.text(item.value, this.margin + 55, this.currentY);
      this.currentY += 7;
    });
  }

  private addSectionDivider(title: string) {
    this.checkPageBreak(20);
    
    // Navy background strip
    this.doc.setFillColor(...COLORS.navy);
    this.doc.rect(this.margin, this.currentY, this.contentWidth, 10, 'F');
    
    // Gold left accent
    this.doc.setFillColor(...COLORS.gold);
    this.doc.rect(this.margin, this.currentY, 4, 10, 'F');
    
    // Title text
    this.doc.setTextColor(...COLORS.white);
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title.toUpperCase(), this.margin + 10, this.currentY + 7);
    
    this.currentY += 15;
  }

  private addSubsectionHeader(title: string) {
    this.checkPageBreak(15);
    
    this.doc.setTextColor(...COLORS.navy);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    
    // Underline
    this.doc.setDrawColor(...COLORS.gold);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY + 2, this.margin + this.doc.getTextWidth(title), this.currentY + 2);
    
    this.currentY += 10;
  }

  private addPageHeader() {
    // Slim navy header
    this.doc.setFillColor(...COLORS.navy);
    this.doc.rect(0, 0, this.pageWidth, 12, 'F');
    
    // Gold accent
    this.doc.setFillColor(...COLORS.gold);
    this.doc.rect(0, 12, this.pageWidth, 1, 'F');
  }

  private addPageFooter() {
    const footerY = this.pageHeight - 12;
    
    // Footer line
    this.doc.setDrawColor(...COLORS.border);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, footerY, this.pageWidth - this.margin, footerY);
    
    // Page number
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...COLORS.slate);
    this.doc.text(`Page ${this.pageNumber}`, this.pageWidth - this.margin, footerY + 6, { align: 'right' });
    
    // Confidential notice
    this.doc.text('Confidential', this.margin, footerY + 6);
  }

  private addCampaignCard(campaign: Campaign, options: ExecutiveExportOptions, index: number) {
    this.checkPageBreak(50);
    
    const cardStartY = this.currentY;
    
    // Card container
    this.doc.setFillColor(...COLORS.white);
    this.doc.setDrawColor(...COLORS.border);
    this.doc.setLineWidth(0.5);
    this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, 45, 4, 4, 'FD');
    
    // Left accent bar with status color
    const statusColor = (() => {
      switch (campaign.status.toLowerCase()) {
        case 'live': return COLORS.emerald;
        case 'completed': return COLORS.navy;
        case 'draft': return COLORS.slateLight;
        default: return COLORS.slate;
      }
    })();
    this.doc.setFillColor(...statusColor);
    this.doc.roundedRect(this.margin, this.currentY, 5, 45, 4, 0, 'F');
    this.doc.rect(this.margin + 3, this.currentY, 2, 45, 'F');
    
    // Campaign number badge
    this.doc.setFillColor(...COLORS.navy);
    this.doc.circle(this.margin + 15, this.currentY + 10, 5, 'F');
    this.doc.setTextColor(...COLORS.white);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${index + 1}`, this.margin + 15, this.currentY + 12, { align: 'center' });
    
    // Campaign name
    this.doc.setTextColor(...COLORS.navy);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(campaign.brand_name, this.margin + 25, this.currentY + 12);
    
    // Status badge
    this.doc.setFillColor(...statusColor);
    const statusText = campaign.status.toUpperCase();
    const statusWidth = this.doc.getTextWidth(statusText) + 8;
    this.doc.roundedRect(this.pageWidth - this.margin - statusWidth - 5, this.currentY + 5, statusWidth, 8, 2, 2, 'F');
    this.doc.setTextColor(...COLORS.white);
    this.doc.setFontSize(7);
    this.doc.text(statusText, this.pageWidth - this.margin - statusWidth / 2 - 1, this.currentY + 10, { align: 'center' });
    
    // Creator and date info
    const creatorName = this.getCreatorName(campaign);
    this.doc.setTextColor(...COLORS.slate);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Creator: ${creatorName}`, this.margin + 25, this.currentY + 20);
    this.doc.text(`Date: ${format(new Date(campaign.campaign_date), 'MMM d, yyyy')}`, this.margin + 25, this.currentY + 27);
    
    // Metrics on the right side
    if (options.includeAnalytics) {
      const metricsX = this.margin + 110;
      
      // Views
      this.doc.setTextColor(...COLORS.navy);
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(this.formatNumber(campaign.total_views || 0), metricsX, this.currentY + 15);
      this.doc.setFontSize(7);
      this.doc.setTextColor(...COLORS.slate);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Views', metricsX, this.currentY + 20);
      
      // Engagement
      this.doc.setTextColor(...COLORS.emerald);
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(this.formatNumber(campaign.total_engagement || 0), metricsX + 30, this.currentY + 15);
      this.doc.setFontSize(7);
      this.doc.setTextColor(...COLORS.slate);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Engagement', metricsX + 30, this.currentY + 20);
      
      // Rate
      this.doc.setTextColor(...COLORS.gold);
      this.doc.setFontSize(14);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`${(campaign.engagement_rate || 0).toFixed(1)}%`, metricsX + 60, this.currentY + 15);
      this.doc.setFontSize(7);
      this.doc.setTextColor(...COLORS.slate);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Eng. Rate', metricsX + 60, this.currentY + 20);
    }
    
    // Deal value if available
    const dealValue = campaign.deal_value || ((campaign as any).fixed_deal_value || 0) + ((campaign as any).variable_deal_value || 0);
    if (dealValue > 0) {
      this.doc.setTextColor(...COLORS.gold);
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(`Investment: $${this.formatNumber(dealValue)}`, this.margin + 25, this.currentY + 35);
    }
    
    this.currentY = cardStartY + 52;
  }

  private getCreatorName(campaign: Campaign): string {
    if ((campaign as any).campaign_creators?.length > 0) {
      const names = (campaign as any).campaign_creators
        .map((cc: any) => cc.creators?.name)
        .filter(Boolean);
      if (names.length > 0) return names.join(', ');
    }
    return campaign.creators?.name || 'Unknown Creator';
  }

  private addSentimentSection(campaignId: string, sentiments: ExecutiveExportOptions['sentimentData'] extends Map<string, infer V> ? V : never) {
    if (!sentiments || sentiments.length === 0) return;
    
    this.checkPageBreak(60);
    this.addSubsectionHeader('Audience Sentiment Analysis');
    
    sentiments.forEach((sentiment) => {
      this.checkPageBreak(50);
      
      // Sentiment card
      const cardY = this.currentY;
      this.doc.setFillColor(...COLORS.lightGray);
      this.doc.roundedRect(this.margin + 5, cardY, this.contentWidth - 10, 50, 3, 3, 'F');
      
      // Platform label
      this.doc.setTextColor(...COLORS.navy);
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(sentiment.platform.charAt(0).toUpperCase() + sentiment.platform.slice(1), this.margin + 12, cardY + 8);
      
      // Sentiment indicator
      const sentimentColor = sentiment.sentiment_label === 'positive' ? COLORS.positive 
        : sentiment.sentiment_label === 'negative' ? COLORS.negative 
        : COLORS.neutral;
      
      this.doc.setFillColor(...sentimentColor);
      this.doc.circle(this.margin + this.contentWidth - 30, cardY + 8, 6, 'F');
      this.doc.setTextColor(...COLORS.white);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'bold');
      const sentimentIcon = sentiment.sentiment_label === 'positive' ? '+' 
        : sentiment.sentiment_label === 'negative' ? '-' : '~';
      this.doc.text(sentimentIcon, this.margin + this.contentWidth - 30, cardY + 10, { align: 'center' });
      
      // Sentiment label and score
      this.doc.setTextColor(...sentimentColor);
      this.doc.setFontSize(9);
      this.doc.text(`${sentiment.sentiment_label.toUpperCase()} (${sentiment.total_comments_analyzed} comments)`, this.margin + this.contentWidth - 60, cardY + 10, { align: 'right' });
      
      // Blurb
      if (sentiment.analysis_metadata?.blurb) {
        this.doc.setTextColor(...COLORS.slate);
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'italic');
        const blurbLines = this.doc.splitTextToSize(sentiment.analysis_metadata.blurb, this.contentWidth - 25);
        blurbLines.slice(0, 3).forEach((line: string, i: number) => {
          this.doc.text(line, this.margin + 12, cardY + 16 + i * 5);
        });
      }
      
      // Key themes as tags
      if (sentiment.key_themes?.length > 0) {
        let tagX = this.margin + 12;
        const tagY = cardY + 38;
        this.doc.setFontSize(7);
        
        sentiment.key_themes.slice(0, 4).forEach((theme: string) => {
          const tagWidth = this.doc.getTextWidth(theme) + 6;
          if (tagX + tagWidth < this.pageWidth - this.margin - 10) {
            this.doc.setFillColor(...COLORS.navy);
            this.doc.roundedRect(tagX, tagY - 4, tagWidth, 7, 2, 2, 'F');
            this.doc.setTextColor(...COLORS.white);
            this.doc.text(theme, tagX + 3, tagY);
            tagX += tagWidth + 3;
          }
        });
      }
      
      this.currentY = cardY + 55;
    });
  }

  private addExecutiveSummary(campaigns: Campaign[], options: ExecutiveExportOptions) {
    this.checkPageBreak(80);
    this.addSectionDivider('Executive Insights');
    
    const totalViews = campaigns.reduce((sum, c) => sum + (c.total_views || 0), 0);
    const totalEngagement = campaigns.reduce((sum, c) => sum + (c.total_engagement || 0), 0);
    const avgRate = campaigns.length > 0 
      ? campaigns.reduce((sum, c) => sum + (c.engagement_rate || 0), 0) / campaigns.length 
      : 0;
    
    // Insights block
    const insights: string[] = [];
    
    // Best performer
    const bestCampaign = campaigns.reduce((best, current) => 
      (current.total_views || 0) > (best.total_views || 0) ? current : best
    , campaigns[0]);
    if (bestCampaign?.total_views) {
      insights.push(`Top performer: ${bestCampaign.brand_name} achieved ${this.formatNumber(bestCampaign.total_views)} views with ${(bestCampaign.engagement_rate || 0).toFixed(1)}% engagement rate.`);
    }
    
    // Engagement analysis
    if (avgRate > 3) {
      insights.push(`Strong average engagement rate of ${avgRate.toFixed(1)}% indicates effective content resonance with target audiences.`);
    } else if (avgRate > 1) {
      insights.push(`Average engagement rate of ${avgRate.toFixed(1)}% is within industry norms. Consider A/B testing content formats to optimize.`);
    }
    
    // Volume insight
    if (campaigns.length > 1) {
      insights.push(`Across ${campaigns.length} campaigns, total reach of ${this.formatNumber(totalViews)} views generated ${this.formatNumber(totalEngagement)} engagement actions.`);
    }
    
    insights.forEach((insight) => {
      this.checkPageBreak(15);
      
      // Bullet point
      this.doc.setFillColor(...COLORS.gold);
      this.doc.circle(this.margin + 5, this.currentY - 1, 2, 'F');
      
      // Insight text
      this.doc.setTextColor(...COLORS.navy);
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      const lines = this.doc.splitTextToSize(insight, this.contentWidth - 15);
      lines.forEach((line: string) => {
        this.doc.text(line, this.margin + 12, this.currentY);
        this.currentY += 5;
      });
      this.currentY += 3;
    });
    
    this.currentY += 10;
  }

  async exportExecutiveReport(
    campaigns: Campaign[], 
    title: string = 'Campaign Performance Report',
    options: ExecutiveExportOptions = {}
  ): Promise<void> {
    // Cover page
    this.addCoverPage(title, campaigns, options);
    
    // New page for executive summary
    this.addPageFooter();
    this.doc.addPage();
    this.pageNumber++;
    this.addPageHeader();
    this.currentY = 25;
    
    // Executive summary
    this.addExecutiveSummary(campaigns, options);
    
    // Campaign details section
    this.addSectionDivider('Campaign Performance Details');
    
    for (let i = 0; i < campaigns.length; i++) {
      this.addCampaignCard(campaigns[i], options, i);
      
      // Add sentiment if available
      if (options.includeSentiment && options.sentimentData) {
        const sentiments = options.sentimentData.get(campaigns[i].id);
        if (sentiments && sentiments.length > 0) {
          this.addSentimentSection(campaigns[i].id, sentiments);
        }
      }
    }
    
    // Final page footer
    this.addPageFooter();
    
    const filename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    this.doc.save(`${filename}_executive.pdf`);
  }

  // Compatibility method for existing calls
  async exportWithCharts(
    campaigns: Campaign[], 
    title: string = 'Campaign Performance Report',
    options: ExecutiveExportOptions = {}
  ): Promise<void> {
    return this.exportExecutiveReport(campaigns, title, options);
  }
}
