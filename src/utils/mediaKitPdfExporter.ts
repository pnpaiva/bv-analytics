import jsPDF from 'jspdf';
import { format } from 'date-fns';

// Media kit specific interface
interface CreatorProfile {
  id: string;
  name: string;
  avatar_url?: string;
  platform_handles?: Record<string, string>;
  location?: string;
  email?: string;
  phone?: string;
  bio?: string;
  totalViews: number;
  totalEngagement: number;
  engagementRate: number;
  followerCount: number;
  demographics: {
    [platform: string]: {
      gender: { female: number; male: number };
      age: { '18-24': number; '25-34': number; '35-44': number; '45-54': number; '55+': number };
      location: { [country: string]: number };
    };
  };
  platformBreakdown: {
    platform: string;
    views: number;
    engagement: number;
    engagementRate: number;
    followerCount: number;
  }[];
  brandCollaborations: {
    brandName: string;
    logoUrl?: string;
    views: number;
    engagement: number;
    engagementRate: number;
    date: string;
  }[];
  topVideos: {
    title: string;
    platform: string;
    views: number;
    engagement: number;
    engagementRate: number;
    url: string;
    thumbnail?: string;
    description?: string;
  }[];
  services: {
    name: string;
    price: number;
  }[];
}

// Premium color palette
const COLORS = {
  primary: [51, 51, 204] as [number, number, number], // #3333cc
  primaryLight: [102, 102, 230] as [number, number, number],
  secondary: [244, 211, 94] as [number, number, number], // #F4D35E
  accent: [16, 185, 129] as [number, number, number],
  text: [15, 23, 42] as [number, number, number],
  textLight: [71, 85, 105] as [number, number, number],
  textMuted: [148, 163, 184] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  background: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

export class MediaKitPDFExporter {
  private doc: jsPDF;
  private currentY: number;
  private margin: number;
  private contentWidth: number;
  private pageWidth: number;
  private pageHeight: number;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4', true);
    this.currentY = 25;
    this.margin = 25;
    this.contentWidth = 160;
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  private addPageHeader() {
    this.doc.setFillColor(...COLORS.background);
    this.doc.rect(0, 0, this.pageWidth, 15, 'F');
    
    this.doc.setDrawColor(...COLORS.primary);
    this.doc.setLineWidth(2);
    this.doc.line(0, 3, this.pageWidth, 3);
  }

  private addPageFooter() {
    const footerY = this.pageHeight - 15;
    
    this.doc.setDrawColor(...COLORS.border);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, footerY, this.pageWidth - this.margin, footerY);
    
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...COLORS.textMuted);
    
    const pageNum = this.doc.getCurrentPageInfo().pageNumber;
    const pageText = `Page ${pageNum}`;
    const pageWidth = this.doc.getTextWidth(pageText);
    this.doc.text(pageText, this.pageWidth - this.margin - pageWidth, footerY + 8);
    
    const timestamp = format(new Date(), 'MMM d, yyyy • h:mm a');
    this.doc.text(timestamp, this.margin, footerY + 8);
  }

  private addHeroHeader(profile: CreatorProfile) {
    // Hero background
    this.doc.setFillColor(...COLORS.primary);
    this.doc.roundedRect(this.margin - 5, this.currentY - 5, this.contentWidth + 10, 50, 4, 4, 'F');
    
    this.doc.setTextColor(...COLORS.white);
    
    // Creator name
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(profile.name, this.margin + 5, this.currentY + 12);
    
    // Media Kit subtitle
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Media Kit', this.margin + 5, this.currentY + 25);
    
    // Key metrics
    const metricsY = this.currentY + 35;
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    
    let metricsX = this.margin + 5;
    const spacing = 45;
    
    this.doc.text(`${profile.totalViews.toLocaleString()}`, metricsX, metricsY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Total Views', metricsX, metricsY + 4);
    
    metricsX += spacing;
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${profile.followerCount.toLocaleString()}`, metricsX, metricsY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Followers', metricsX, metricsY + 4);
    
    metricsX += spacing;
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${profile.engagementRate.toFixed(1)}%`, metricsX, metricsY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Engagement', metricsX, metricsY + 4);
    
    this.currentY += 60;
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
    
    this.doc.setFillColor(color[0], color[1], color[2]);
    this.doc.roundedRect(this.margin - 2, this.currentY - 2, this.contentWidth + 4, 12, 2, 2, 'F');
    
    this.doc.setTextColor(...COLORS.white);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin + 2, this.currentY + 6);
    
    this.currentY += 18;
    this.resetTextStyle();
  }

  private addKeyValuePair(key: string, value: string, indent: number = 0) {
    this.checkPageBreak();
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...COLORS.textLight);
    this.doc.setFontSize(9);
    this.doc.text(`${key}:`, this.margin + indent, this.currentY);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...COLORS.text);
    this.doc.setFontSize(10);
    this.doc.text(value, this.margin + indent + 35, this.currentY);
    
    this.currentY += 6;
  }

  private addContactInfo(profile: CreatorProfile) {
    this.addSectionHeader('Contact Information');
    
    if (profile.email) {
      this.addKeyValuePair('Email', profile.email);
    }
    if (profile.phone) {
      this.addKeyValuePair('Phone', profile.phone);
    }
    if (profile.location) {
      this.addKeyValuePair('Location', profile.location);
    }
    
    // Platform handles
    if (profile.platform_handles) {
      this.currentY += 5;
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Social Media:', this.margin, this.currentY);
      this.currentY += 8;
      
      Object.entries(profile.platform_handles).forEach(([platform, handle]) => {
        if (handle) {
          this.addKeyValuePair(platform.charAt(0).toUpperCase() + platform.slice(1), handle, 10);
        }
      });
    }
    
    this.currentY += 10;
  }

  private addPlatformBreakdown(profile: CreatorProfile) {
    this.addSectionHeader('Platform Performance');
    
    profile.platformBreakdown.forEach((platform, index) => {
      this.checkPageBreak(25);
      
      // Platform card
      this.doc.setFillColor(...COLORS.white);
      this.doc.setDrawColor(...COLORS.border);
      this.doc.setLineWidth(0.5);
      this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, 20, 3, 3, 'FD');
      
      // Platform name
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...COLORS.primary);
      this.doc.text(platform.platform, this.margin + 5, this.currentY + 8);
      
      // Metrics
      const metricsY = this.currentY + 15;
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...COLORS.textLight);
      
      let x = this.margin + 5;
      this.doc.text(`Views: ${platform.views.toLocaleString()}`, x, metricsY);
      x += 40;
      this.doc.text(`Followers: ${platform.followerCount.toLocaleString()}`, x, metricsY);
      x += 40;
      this.doc.text(`Engagement: ${platform.engagementRate.toFixed(1)}%`, x, metricsY);
      
      this.currentY += 25;
    });
    
    this.currentY += 5;
  }

  private addDemographics(profile: CreatorProfile, platform: string) {
    const demographics = profile.demographics[platform.toLowerCase()];
    if (!demographics) return;
    
    this.addSectionHeader(`${platform} Demographics`);
    
    // Gender distribution
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Gender Distribution:', this.margin, this.currentY);
    this.currentY += 8;
    
    Object.entries(demographics.gender).forEach(([gender, percentage]) => {
      this.addKeyValuePair(gender.charAt(0).toUpperCase() + gender.slice(1), `${percentage}%`, 10);
    });
    
    this.currentY += 5;
    
    // Age distribution
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Age Distribution:', this.margin, this.currentY);
    this.currentY += 8;
    
    Object.entries(demographics.age).forEach(([age, percentage]) => {
      this.addKeyValuePair(age, `${percentage}%`, 10);
    });
    
    this.currentY += 5;
    
    // Top locations
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Top Locations:', this.margin, this.currentY);
    this.currentY += 8;
    
    const sortedLocations = Object.entries(demographics.location)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5);
    
    sortedLocations.forEach(([location, percentage]) => {
      this.addKeyValuePair(location, `${percentage}%`, 10);
    });
    
    this.currentY += 10;
  }

  private addTopContent(profile: CreatorProfile, platform: string) {
    const platformVideos = profile.topVideos
      .filter(video => video.platform.toLowerCase() === platform.toLowerCase())
      .slice(0, 3);
    
    if (platformVideos.length === 0) return;
    
    this.addSectionHeader(`Top ${platform} Content`);
    
    platformVideos.forEach((video, index) => {
      this.checkPageBreak(30);
      
      this.doc.setFillColor(...COLORS.white);
      this.doc.setDrawColor(...COLORS.border);
      this.doc.setLineWidth(0.5);
      this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, 25, 3, 3, 'FD');
      
      // Video title
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...COLORS.text);
      const maxTitleWidth = this.contentWidth - 10;
      const lines = this.doc.splitTextToSize(video.title, maxTitleWidth);
      this.doc.text(lines[0], this.margin + 5, this.currentY + 8);
      
      // Metrics
      const metricsY = this.currentY + 18;
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...COLORS.textLight);
      
      let x = this.margin + 5;
      this.doc.text(`Views: ${video.views.toLocaleString()}`, x, metricsY);
      x += 35;
      this.doc.text(`Engagement: ${video.engagement.toLocaleString()}`, x, metricsY);
      x += 45;
      this.doc.text(`Rate: ${video.engagementRate.toFixed(1)}%`, x, metricsY);
      
      this.currentY += 30;
    });
    
    this.currentY += 5;
  }

  private addServices(profile: CreatorProfile) {
    if (profile.services.length === 0) return;
    
    this.addSectionHeader('Services & Pricing', COLORS.secondary);
    
    profile.services.forEach((service) => {
      this.checkPageBreak(15);
      
      this.doc.setFillColor(...COLORS.background);
      this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, 12, 2, 2, 'F');
      
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...COLORS.text);
      this.doc.text(service.name, this.margin + 5, this.currentY + 7);
      
      this.doc.setTextColor(...COLORS.primary);
      const priceText = `$${service.price.toLocaleString()}`;
      const priceWidth = this.doc.getTextWidth(priceText);
      this.doc.text(priceText, this.margin + this.contentWidth - priceWidth - 5, this.currentY + 7);
      
      this.currentY += 15;
    });
    
    this.currentY += 5;
  }

  async exportMediaKit(profile: CreatorProfile): Promise<void> {
    // Add first page header
    this.addPageHeader();
    
    // Hero section
    this.addHeroHeader(profile);
    
    // Contact information
    this.addContactInfo(profile);
    
    // Bio if available
    if (profile.bio) {
      this.addSectionHeader('About');
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...COLORS.text);
      const lines = this.doc.splitTextToSize(profile.bio, this.contentWidth);
      lines.forEach((line: string) => {
        this.checkPageBreak();
        this.doc.text(line, this.margin, this.currentY);
        this.currentY += 5;
      });
      this.currentY += 10;
    }
    
    // Platform breakdown
    this.addPlatformBreakdown(profile);
    
    // Demographics and top content for each platform
    const platforms = ['youtube', 'instagram', 'tiktok'];
    platforms.forEach(platform => {
      if (profile.demographics[platform]) {
        this.addDemographics(profile, platform);
        this.addTopContent(profile, platform);
      }
    });
    
    // Services
    this.addServices(profile);
    
    // Add footer to all pages
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.addPageFooter();
    }
    
    const filename = `${profile.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_media_kit`;
    this.doc.save(`${filename}.pdf`);
  }
}