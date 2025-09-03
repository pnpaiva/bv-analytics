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
  getCreatorNameForUrl?: (campaignId: string, url: string) => string | undefined;
  topVideos?: Array<{ title: string; url: string; platform: string; views: number; engagement: number; engagementRate: number }>;
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

  private async addBrandLogoIfAny(campaign: Campaign, yTop: number, maxWidthMm: number = 18, maxHeightMm: number = 12) {
    try {
      if (!campaign.logo_url) return;
      const res = await fetch(campaign.logo_url, { mode: 'cors' });
      if (!res.ok) return;
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      // Load to get natural aspect ratio
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.crossOrigin = 'anonymous';
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = dataUrl;
      });
      const naturalW = img.naturalWidth || 1;
      const naturalH = img.naturalHeight || 1;
      const ratio = naturalW / naturalH;
      let drawW = maxWidthMm;
      let drawH = drawW / ratio;
      if (drawH > maxHeightMm) {
        drawH = maxHeightMm;
        drawW = drawH * ratio;
      }
      // Anchor logo inside the card, top-right within margins
      const x = this.pageWidth - this.margin - drawW;
      const y = yTop + 2; // small padding from top of card
      this.doc.addImage(dataUrl, 'PNG', x, y, drawW, drawH);
    } catch {
      // ignore logo failures silently
    }
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
      // Also consider declared content_urls when analytics_data is absent
      const pushUrls = (urlsMap?: Record<string, string[]>) => {
        if (!urlsMap) return;
        Object.entries(urlsMap).forEach(([platform, urls]) => {
          if (Array.isArray(urls)) {
            urls.forEach((u) => {
              if (u && u.trim()) {
                allPosts.push({
                  url: u,
                  views: 0,
                  engagement: 0,
                  engagementRate: 0,
                  platform,
                  campaignName: campaign.brand_name,
                });
              }
            });
          }
        });
      };

      // Prefer nested campaign_creators content urls if available
      if (Array.isArray((campaign as any).campaign_creators) && (campaign as any).campaign_creators.length > 0) {
        (campaign as any).campaign_creators.forEach((cc: any) => pushUrls(cc?.content_urls));
      } else {
        pushUrls(campaign.content_urls as any);
      }
    });

    // Find top performing posts
    const topPosts = [...allPosts]
      .sort((a, b) => b.views - a.views)
      .slice(0, 3);

    // Replace verbose details with compact metric cards only
    this.currentY += 6;

    // Summary metric cards (visual, compact)
    const spacing = 6;
    const cols = 3;
    const cardWidth = (this.pageWidth - this.margin * 2 - spacing * (cols - 1));
    const unitWidth = cardWidth / cols;
    const cardHeight = 18;

    const totalContent = allPosts.length;
    const uniqueCreators = new Set(campaigns.map(c => c.creators?.name).filter(Boolean));

    const metrics = [
      { title: 'Total Campaigns', value: campaigns.length.toString() },
      { title: 'Total Views', value: totalViews.toLocaleString() },
      { title: 'Total Engagement', value: totalEngagement.toLocaleString() },
      { title: 'Avg Engagement Rate', value: `${avgEngagementRate.toFixed(2)}%` },
      { title: 'Total Content', value: totalContent.toString() },
      { title: 'Unique Creators', value: uniqueCreators.size.toString() },
    ];

    // two rows of 3 -> we'll render first 3, then remaining
    let startY = this.currentY;
    this.checkPageBreak(cardHeight + 10);
    metrics.forEach((m, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = this.margin + col * (unitWidth + spacing);
      const y = startY + row * (cardHeight + 6);
      this.doc.setDrawColor(200, 200, 200);
      this.doc.setLineWidth(0.5);
      this.doc.roundedRect(x, y, unitWidth, cardHeight, 2, 2, 'S');
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.text(m.title, x + 3, y + 6);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(12);
      this.doc.text(m.value, x + 3, y + 13);
    });

    this.currentY = startY + Math.ceil(metrics.length / cols) * (cardHeight + 6) + 6;
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
        { selector: '[data-chart="creator-performance"]', title: 'Creator Performance' },
        { selector: '[data-chart="top-videos-chart"]', title: 'Top Performing Videos (Chart)' },
        { selector: '[data-chart="video-performance-distribution"]', title: 'Video Performance Distribution' }
      ];

      for (const { selector, title } of chartElements) {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
          await this.addChartFromElement(element, title);
        }
      }
    }

    // Add clickable list of top videos if provided
    if (options.topVideos && options.topVideos.length > 0) {
      this.addSectionHeader('Top Performing Videos (Links)');
      options.topVideos.slice(0, 10).forEach((v, idx) => {
        this.checkPageBreak();
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(`${idx + 1}. ${v.title} — ${v.platform}`, this.margin, this.currentY);
        this.currentY += 5;
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(`Views: ${v.views.toLocaleString()}  •  Engagement: ${v.engagement.toLocaleString()}  •  Rate: ${v.engagementRate.toFixed(2)}%`, this.margin, this.currentY);
        this.currentY += 5;
        this.doc.setTextColor(0, 0, 255);
        this.doc.text(v.url, this.margin, this.currentY);
        this.doc.setTextColor(0, 0, 0);
        this.currentY += 8;
      });
    }

    // Remove verbose summary statistics block (now represented via metric cards)

    // Add individual campaign details if requested
    if (options.includeAnalytics) {
      this.addSectionHeader('Campaign Details');
      for (const campaign of campaigns) {
        await this.addCampaignCard(campaign, options);
      }
    }

    const filename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    this.doc.save(`${filename}.pdf`);
  }

  private async addCampaignCard(campaign: Campaign, options: ExportOptions) {
    // Prevent card from splitting across pages by ensuring minimum space
    const minCardSpace = 90; // a bit larger to accommodate logos/links
    if (this.currentY + minCardSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
    
    // Campaign header with border
    const cardStartY = this.currentY;
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.3);
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(campaign.brand_name, this.margin, this.currentY);
    // Try to add brand logo on the right (inside card bounds)
    if (options.includeLogo) {
      await this.addBrandLogoIfAny(campaign, cardStartY);
    }
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

    // Content URLs with per-URL creator annotation
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
              const creatorName = options.getCreatorNameForUrl ? (options.getCreatorNameForUrl(campaign.id, url) || '') : '';
              this.doc.setFont('helvetica', 'normal');
              this.doc.setTextColor(0, 0, 255);
              this.doc.text(`${index + 1}. ${url}`, this.margin + 20, this.currentY);
              this.doc.setTextColor(0, 0, 0);
              if (creatorName) {
                this.doc.setFont('helvetica', 'italic');
                this.doc.text(`Creator: ${creatorName}`, this.margin + 20, this.currentY + 5);
                this.currentY += 10;
              } else {
                this.currentY += 6;
              }
            }
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
}