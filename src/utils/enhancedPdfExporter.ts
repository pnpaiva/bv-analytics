import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Campaign } from '@/hooks/useCampaigns';
import { format } from 'date-fns';
import QRCode from 'qrcode';

// content_urls can be either string[] (legacy) or objects like { url, insertionStart, insertionEnd }.
// Normalize everything to a string URL before trimming/printing.
type ContentUrlLike =
  | string
  | {
      url?: string;
      insertionStart?: string;
      insertionEnd?: string;
      [key: string]: unknown;
    }
  | null
  | undefined;

export interface ExportOptions {
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

  private normalizeUrl(input: ContentUrlLike): string | null {
    const url = typeof input === 'string' ? input : input?.url;
    if (typeof url !== 'string') return null;
    const trimmed = url.trim();
    return trimmed.length ? trimmed : null;
  }

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

  private async getVideoThumbnail(url: string, platform: string): Promise<string | null> {
    try {
      if (platform === 'youtube') {
        const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
        if (videoId) {
          // Try to fetch the thumbnail
          const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          try {
            const response = await fetch(thumbnailUrl, { mode: 'cors' });
            if (response.ok) {
              const blob = await response.blob();
              return await this.blobToDataUrl(blob);
            }
          } catch {
            // Fallback to standard quality thumbnail
            const fallbackUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            const response = await fetch(fallbackUrl, { mode: 'cors' });
            if (response.ok) {
              const blob = await response.blob();
              return await this.blobToDataUrl(blob);
            }
          }
        }
      }
      // For other platforms, we can't easily get thumbnails without API access
      return null;
    } catch (error) {
      console.error('Error fetching video thumbnail:', error);
      return null;
    }
  }

  private async blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async generateQRCode(url: string): Promise<string> {
    try {
      return await QRCode.toDataURL(url, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
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
      const pushUrls = (urlsMap?: Record<string, any[]>) => {
        if (!urlsMap) return;
        Object.entries(urlsMap).forEach(([platform, urls]) => {
          if (Array.isArray(urls)) {
            urls.forEach((u) => {
              const normalized = this.normalizeUrl(u as any);
              if (normalized) {
                allPosts.push({
                  url: normalized,
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
    const uniqueCreators = new Set(campaigns.flatMap(c => 
      c.campaign_creators?.map(cc => cc.creators?.name) || [c.creators?.name]
    ).filter(Boolean));

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

  private getCreatorName(campaign: Campaign): string {
    // Try to get creator name from campaign_creators first
    if (campaign.campaign_creators && campaign.campaign_creators.length > 0) {
      const names = campaign.campaign_creators
        .map(cc => cc.creators?.name)
        .filter(Boolean);
      if (names.length > 0) {
        return names.join(', ');
      }
    }
    // Fallback to legacy creators field
    return campaign.creators?.name || 'Unknown Creator';
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
    
    // Basic info - use helper method to get creator name
    this.addKeyValuePair('Creator', this.getCreatorName(campaign));
    if (campaign.clients?.name) {
      this.addKeyValuePair('Client', campaign.clients.name);
    }
    this.addKeyValuePair('Status', campaign.status.toUpperCase());
    this.addKeyValuePair('Campaign Date', format(new Date(campaign.campaign_date), 'MMMM d, yyyy'));
    
    // Handle both old deal_value and new fixed/variable deal values
    const dealValue = campaign.deal_value ?? ((campaign.fixed_deal_value || 0) + (campaign.variable_deal_value || 0));
    if (dealValue) {
      this.addKeyValuePair('Deal Value', `$${dealValue.toLocaleString()}`);
    }

    // Analytics data
    if (options.includeAnalytics) {
      this.currentY += 5;
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Analytics:', this.margin, this.currentY);
      this.currentY += 6;
      
      this.addKeyValuePair('Total Views', (campaign.total_views ?? 0).toLocaleString(), 10);
      this.addKeyValuePair('Total Engagement', (campaign.total_engagement ?? 0).toLocaleString(), 10);
      this.addKeyValuePair('Engagement Rate', `${(campaign.engagement_rate ?? 0).toFixed(2)}%`, 10);
    }

    // Content URLs with per-URL creator annotation
    if (options.includeContentUrls) {
      // Aggregate content URLs from campaign creators or fallback to campaign.content_urls
      let allContentUrls: Record<string, Array<{ url: string; creatorName?: string }>> = {};

      // First, try to get URLs from campaign_creators (preferred method)
      if (campaign.campaign_creators && campaign.campaign_creators.length > 0) {
        campaign.campaign_creators.forEach((campaignCreator: any) => {
          const creatorName = campaignCreator.creators?.name || 'Unknown Creator';
          const contentUrls = (campaignCreator.content_urls || {}) as Record<string, ContentUrlLike[]>;

          Object.entries(contentUrls).forEach(([platform, urls]) => {
            if (!Array.isArray(urls) || urls.length === 0) return;
            if (!allContentUrls[platform]) allContentUrls[platform] = [];

            urls.forEach((urlData) => {
              const normalized = this.normalizeUrl(urlData);
              if (!normalized) return;
              allContentUrls[platform].push({ url: normalized, creatorName });
            });
          });
        });
      }

      // Fallback to campaign.content_urls if no campaign_creators data
      if (Object.keys(allContentUrls).length === 0 && campaign.content_urls) {
        Object.entries(campaign.content_urls as Record<string, ContentUrlLike[]>).forEach(([platform, urls]) => {
          if (!Array.isArray(urls) || urls.length === 0) return;

          allContentUrls[platform] = urls
            .map((urlData) => {
              const normalized = this.normalizeUrl(urlData);
              if (!normalized) return null;
              const creatorName = options.getCreatorNameForUrl ? options.getCreatorNameForUrl(campaign.id, normalized) : undefined;
              return { url: normalized, creatorName };
            })
            .filter(Boolean) as Array<{ url: string; creatorName?: string }>;
        });
      }

      // Render content URLs if we have any
      if (Object.keys(allContentUrls).length > 0) {
        this.currentY += 5;
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Content Links:', this.margin, this.currentY);
        this.currentY += 6;

        for (const [platform, urlData] of Object.entries(allContentUrls)) {
          if (urlData.length > 0) {
            this.doc.setFont('helvetica', 'bold');
            this.doc.text(`${platform.charAt(0).toUpperCase() + platform.slice(1)}:`, this.margin + 10, this.currentY);
            this.currentY += 5;

            for (const item of urlData) {
              this.checkPageBreak(70); // More space needed for thumbnails and QR codes
              const startY = this.currentY;
              
              // Try to fetch thumbnail and generate QR code
              const thumbnail = await this.getVideoThumbnail(item.url, platform);
              const qrCode = await this.generateQRCode(item.url);
              
              // Layout: [Thumbnail] [QR Code] [Text Info]
              const thumbnailWidth = 40;
              const thumbnailHeight = 22.5; // 16:9 aspect ratio
              const qrSize = 22;
              const leftMargin = this.margin + 20;
              
              // Add thumbnail if available
              if (thumbnail) {
                try {
                  this.doc.addImage(thumbnail, 'JPEG', leftMargin, startY, thumbnailWidth, thumbnailHeight);
                  // Make thumbnail clickable
                  this.doc.link(leftMargin, startY, thumbnailWidth, thumbnailHeight, { url: item.url });
                } catch (error) {
                  console.error('Error adding thumbnail to PDF:', error);
                }
              }
              
              // Add QR code
              if (qrCode) {
                const qrX = leftMargin + thumbnailWidth + 5;
                try {
                  this.doc.addImage(qrCode, 'PNG', qrX, startY, qrSize, qrSize);
                  // Make QR code clickable
                  this.doc.link(qrX, startY, qrSize, qrSize, { url: item.url });
                } catch (error) {
                  console.error('Error adding QR code to PDF:', error);
                }
              }
              
              // Add text info to the right
              const textX = leftMargin + thumbnailWidth + qrSize + 10;
              this.doc.setFont('helvetica', 'normal');
              this.doc.setFontSize(9);
              this.doc.text('Scan QR or click to view', textX, startY + 5);
              
              if (item.creatorName) {
                this.doc.setFont('helvetica', 'italic');
                this.doc.setFontSize(8);
                this.doc.text(`Creator: ${item.creatorName}`, textX, startY + 10);
              }
              
              // Add clickable URL at bottom
              this.doc.setFont('helvetica', 'normal');
              this.doc.setFontSize(7);
              this.doc.setTextColor(0, 0, 255);
              const urlText = item.url.length > 60 ? item.url.substring(0, 57) + '...' : item.url;
              this.doc.textWithLink(urlText, textX, startY + 16, { url: item.url });
              this.doc.setTextColor(0, 0, 0);
              
              // Move cursor down past the largest element
              this.currentY = startY + Math.max(thumbnailHeight, qrSize) + 8;
            }
            
            this.currentY += 5;
          }
        }
      }
    }

    // Add sentiment analysis data if available
    if (options.includeSentiment && options.sentimentData) {
      const campaignSentiments = options.sentimentData.get(campaign.id);
      if (campaignSentiments && campaignSentiments.length > 0) {
        this.currentY += 5;
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Comment Sentiment Analysis:', this.margin, this.currentY);
        this.currentY += 6;

        campaignSentiments.forEach((sentiment) => {
          this.checkPageBreak(40);
          
          // URL and Platform
          this.doc.setFont('helvetica', 'bold');
          this.doc.setFontSize(9);
          this.doc.text(`${sentiment.platform.charAt(0).toUpperCase() + sentiment.platform.slice(1)}:`, this.margin + 10, this.currentY);
          this.currentY += 5;
          
          // Sentiment Overview
          const sentimentIcon = sentiment.sentiment_label === 'positive' ? '😊' : 
                               sentiment.sentiment_label === 'negative' ? '😞' : '😐';
          this.doc.setFont('helvetica', 'normal');
          this.doc.setFontSize(8);
          this.doc.text(`${sentimentIcon} ${sentiment.sentiment_label.toUpperCase()} (${sentiment.total_comments_analyzed} comments analyzed)`, this.margin + 15, this.currentY);
          this.currentY += 5;
          
          // Blurb
          if (sentiment.analysis_metadata?.blurb) {
            this.doc.setFont('helvetica', 'italic');
            this.doc.setFontSize(8);
            const blurbLines = this.doc.splitTextToSize(sentiment.analysis_metadata.blurb, this.pageWidth - this.margin * 2 - 20);
            blurbLines.forEach((line: string) => {
              this.checkPageBreak();
              this.doc.text(line, this.margin + 15, this.currentY);
              this.currentY += 4;
            });
            this.currentY += 2;
          }
          
          // Main Topics
          if (sentiment.main_topics && sentiment.main_topics.length > 0) {
            this.doc.setFont('helvetica', 'bold');
            this.doc.setFontSize(8);
            this.doc.text('Main Topics:', this.margin + 15, this.currentY);
            this.currentY += 4;
            this.doc.setFont('helvetica', 'normal');
            const topicsText = sentiment.main_topics.join(', ');
            const topicsLines = this.doc.splitTextToSize(topicsText, this.pageWidth - this.margin * 2 - 20);
            topicsLines.forEach((line: string) => {
              this.checkPageBreak();
              this.doc.text(line, this.margin + 15, this.currentY);
              this.currentY += 4;
            });
            this.currentY += 2;
          }
          
          // Key Themes
          if (sentiment.key_themes && sentiment.key_themes.length > 0) {
            this.doc.setFont('helvetica', 'bold');
            this.doc.setFontSize(8);
            this.doc.text('Key Themes:', this.margin + 15, this.currentY);
            this.currentY += 4;
            this.doc.setFont('helvetica', 'normal');
            const themesText = sentiment.key_themes.join(', ');
            const themesLines = this.doc.splitTextToSize(themesText, this.pageWidth - this.margin * 2 - 20);
            themesLines.forEach((line: string) => {
              this.checkPageBreak();
              this.doc.text(line, this.margin + 15, this.currentY);
              this.currentY += 4;
            });
            this.currentY += 2;
          }
          
          // Example Comments
          if (sentiment.analysis_metadata?.examples && sentiment.analysis_metadata.examples.length > 0) {
            this.doc.setFont('helvetica', 'bold');
            this.doc.setFontSize(8);
            this.doc.text('Example Comments:', this.margin + 15, this.currentY);
            this.currentY += 4;
            
            sentiment.analysis_metadata.examples.slice(0, 3).forEach((example) => {
              this.checkPageBreak();
              this.doc.setFont('helvetica', 'bold');
              this.doc.setFontSize(7);
              const categoryColor = example.category === 'positive' ? [34, 197, 94] : 
                                   example.category === 'negative' ? [239, 68, 68] : [100, 100, 100];
              this.doc.setTextColor(categoryColor[0], categoryColor[1], categoryColor[2]);
              this.doc.text(`${example.category}:`, this.margin + 15, this.currentY);
              this.doc.setTextColor(0, 0, 0);
              this.currentY += 4;
              
              this.doc.setFont('helvetica', 'italic');
              this.doc.setFontSize(7);
              const commentLines = this.doc.splitTextToSize(`"${example.text}"`, this.pageWidth - this.margin * 2 - 20);
              commentLines.forEach((line: string) => {
                this.checkPageBreak();
                this.doc.text(line, this.margin + 18, this.currentY);
                this.currentY += 3.5;
              });
              this.currentY += 2;
            });
          }
          
          this.currentY += 5;
        });
      }
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