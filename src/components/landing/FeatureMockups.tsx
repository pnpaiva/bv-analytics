import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  Heart, 
  Target, 
  Youtube, 
  Instagram,
  MessageSquare,
  FileText,
  Download,
  Bell,
  Zap,
  CheckCircle,
  Clock,
  DollarSign,
  Star
} from 'lucide-react';

// Mini metric card component
const MetricCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  color = "primary"
}: { 
  title: string; 
  value: string; 
  icon: any; 
  trend?: string;
  color?: string;
}) => (
  <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
    <div className="flex items-center justify-between mb-1">
      <Icon className={`h-4 w-4 text-${color}`} />
      {trend && <span className="text-xs text-green-500 font-medium">{trend}</span>}
    </div>
    <p className="text-lg font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{title}</p>
  </div>
);

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// 1. Unified Dashboard Mockup
export const UnifiedDashboardMockup = () => (
  <div className="bg-card rounded-xl p-4 space-y-4 border border-border">
    {/* Header */}
    <div className="flex items-center justify-between">
      <h4 className="font-semibold text-foreground">Campaign Overview</h4>
      <Badge variant="outline" className="text-xs">Live</Badge>
    </div>
    
    {/* Platform Tabs */}
    <div className="flex gap-2">
      <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
        <Youtube className="h-3 w-3 mr-1" /> YouTube
      </Badge>
      <Badge className="bg-pink-500/10 text-pink-500 border-pink-500/20">
        <Instagram className="h-3 w-3 mr-1" /> Instagram
      </Badge>
      <Badge className="bg-foreground/10 text-foreground border-foreground/20">
        <TikTokIcon className="h-3 w-3 mr-1" /> TikTok
      </Badge>
    </div>
    
    {/* Metrics Grid */}
    <div className="grid grid-cols-3 gap-3">
      <MetricCard title="Total Views" value="2.4M" icon={Eye} trend="+12%" />
      <MetricCard title="Engagement" value="156K" icon={Heart} trend="+8%" />
      <MetricCard title="Campaigns" value="12" icon={Target} />
    </div>
    
    {/* Mini Chart */}
    <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
      <p className="text-xs text-muted-foreground mb-2">Platform Performance</p>
      <div className="flex items-end gap-2 h-16">
        <div className="flex-1 bg-red-500/60 rounded-t" style={{ height: '80%' }}></div>
        <div className="flex-1 bg-pink-500/60 rounded-t" style={{ height: '60%' }}></div>
        <div className="flex-1 bg-foreground/40 rounded-t" style={{ height: '45%' }}></div>
        <div className="flex-1 bg-red-500/60 rounded-t" style={{ height: '90%' }}></div>
        <div className="flex-1 bg-pink-500/60 rounded-t" style={{ height: '70%' }}></div>
        <div className="flex-1 bg-foreground/40 rounded-t" style={{ height: '55%' }}></div>
      </div>
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>Mon</span>
        <span>Wed</span>
        <span>Fri</span>
      </div>
    </div>
  </div>
);

// 2. Creator Profiles Mockup
export const CreatorProfilesMockup = () => (
  <div className="bg-card rounded-xl p-4 space-y-4 border border-border">
    <h4 className="font-semibold text-foreground">Creator Profiles</h4>
    
    {/* Creator Cards */}
    <div className="space-y-3">
      {[
        { name: "Alex Rivera", followers: "1.2M", engagement: "8.5%", platforms: ["yt", "ig"], avatar: "AR" },
        { name: "Sarah Chen", followers: "850K", engagement: "12.3%", platforms: ["ig", "tt"], avatar: "SC" },
        { name: "Mike Torres", followers: "2.1M", engagement: "6.8%", platforms: ["yt", "tt"], avatar: "MT" },
      ].map((creator, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            {creator.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground text-sm truncate">{creator.name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{creator.followers} followers</span>
              <span className="text-green-500">↑ {creator.engagement}</span>
            </div>
          </div>
          <div className="flex gap-1">
            {creator.platforms.includes("yt") && <Youtube className="h-4 w-4 text-red-500" />}
            {creator.platforms.includes("ig") && <Instagram className="h-4 w-4 text-pink-500" />}
            {creator.platforms.includes("tt") && <TikTokIcon className="h-4 w-4 text-foreground" />}
          </div>
        </div>
      ))}
    </div>
    
    {/* Quick Stats */}
    <div className="flex gap-2 text-xs">
      <Badge variant="outline" className="bg-primary/5">
        <Users className="h-3 w-3 mr-1" /> 24 Creators
      </Badge>
      <Badge variant="outline" className="bg-green-500/5 text-green-600">
        <TrendingUp className="h-3 w-3 mr-1" /> Avg 9.2% ER
      </Badge>
    </div>
  </div>
);

// 3. Campaign Analytics Mockup
export const CampaignAnalyticsMockup = () => (
  <div className="bg-card rounded-xl p-4 space-y-4 border border-border">
    <div className="flex items-center justify-between">
      <h4 className="font-semibold text-foreground">Campaign: Nike Summer</h4>
      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>
    </div>
    
    {/* Campaign Card */}
    <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold">
          N
        </div>
        <div>
          <p className="font-medium text-foreground">Nike Summer Campaign</p>
          <p className="text-xs text-muted-foreground">5 creators • 12 videos</p>
        </div>
      </div>
      
      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="text-center p-2 bg-background/50 rounded">
          <p className="text-lg font-bold text-foreground">4.8M</p>
          <p className="text-xs text-muted-foreground">Total Views</p>
        </div>
        <div className="text-center p-2 bg-background/50 rounded">
          <p className="text-lg font-bold text-foreground">287K</p>
          <p className="text-xs text-muted-foreground">Engagement</p>
        </div>
      </div>
      
      {/* Sentiment */}
      <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded border border-green-500/20">
        <MessageSquare className="h-4 w-4 text-green-600" />
        <span className="text-xs text-green-600 font-medium">Sentiment: 78% Positive</span>
      </div>
    </div>
    
    {/* Content URLs */}
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Content Performance</p>
      {[
        { platform: "yt", views: "1.2M", title: "Summer Vibes..." },
        { platform: "ig", views: "890K", title: "Behind the scenes..." },
      ].map((content, i) => (
        <div key={i} className="flex items-center gap-2 text-xs p-2 bg-muted/20 rounded">
          {content.platform === "yt" ? <Youtube className="h-3 w-3 text-red-500" /> : <Instagram className="h-3 w-3 text-pink-500" />}
          <span className="flex-1 truncate text-muted-foreground">{content.title}</span>
          <span className="font-medium text-foreground">{content.views}</span>
        </div>
      ))}
    </div>
  </div>
);

// 4. Client Dashboard Mockup
export const ClientDashboardMockup = () => (
  <div className="bg-card rounded-xl p-4 space-y-4 border border-border">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold text-sm">
          A
        </div>
        <h4 className="font-semibold text-foreground">Acme Corp Dashboard</h4>
      </div>
      <Badge variant="outline" className="text-xs">Client View</Badge>
    </div>
    
    {/* ROI Metrics */}
    <div className="grid grid-cols-2 gap-3">
      <div className="p-3 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20">
        <DollarSign className="h-4 w-4 text-green-600 mb-1" />
        <p className="text-lg font-bold text-foreground">$0.004</p>
        <p className="text-xs text-muted-foreground">Cost per View</p>
      </div>
      <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
        <TrendingUp className="h-4 w-4 text-primary mb-1" />
        <p className="text-lg font-bold text-foreground">342%</p>
        <p className="text-xs text-muted-foreground">ROI</p>
      </div>
    </div>
    
    {/* Active Campaigns */}
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium">Active Campaigns</p>
      {[
        { name: "Q4 Product Launch", progress: 75, status: "On Track" },
        { name: "Holiday Special", progress: 45, status: "In Progress" },
      ].map((campaign, i) => (
        <div key={i} className="p-2 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">{campaign.name}</span>
            <Badge variant="outline" className="text-xs bg-green-500/5 text-green-600">{campaign.status}</Badge>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${campaign.progress}%` }}></div>
          </div>
        </div>
      ))}
    </div>
    
    {/* Trust indicator */}
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <CheckCircle className="h-3 w-3 text-green-500" />
      <span>Real-time data • Updated 2 min ago</span>
    </div>
  </div>
);

// 5. PDF Report Mockup
export const PdfReportMockup = () => (
  <div className="bg-card rounded-xl p-4 space-y-4 border border-border">
    <div className="flex items-center justify-between">
      <h4 className="font-semibold text-foreground">Campaign Report</h4>
      <button className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg">
        <Download className="h-3 w-3" />
        Export PDF
      </button>
    </div>
    
    {/* Report Preview */}
    <div className="bg-white dark:bg-muted/20 rounded-lg p-3 border border-border/50 shadow-inner">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/30 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary/20"></div>
          <span className="text-xs font-medium text-foreground">Campaign Performance Report</span>
        </div>
        <span className="text-xs text-muted-foreground">Dec 2024</span>
      </div>
      
      {/* Mini Chart */}
      <div className="mb-3">
        <div className="flex items-end gap-1 h-12">
          {[40, 55, 45, 70, 65, 80, 75, 90, 85, 95].map((h, i) => (
            <div key={i} className="flex-1 bg-primary/60 rounded-t" style={{ height: `${h}%` }}></div>
          ))}
        </div>
      </div>
      
      {/* Summary Table */}
      <div className="space-y-1 text-xs">
        <div className="flex justify-between py-1 border-b border-border/20">
          <span className="text-muted-foreground">Total Views</span>
          <span className="font-medium text-foreground">4,823,456</span>
        </div>
        <div className="flex justify-between py-1 border-b border-border/20">
          <span className="text-muted-foreground">Engagement Rate</span>
          <span className="font-medium text-foreground">8.7%</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-muted-foreground">Sentiment Score</span>
          <span className="font-medium text-green-600">+78%</span>
        </div>
      </div>
    </div>
    
    {/* Export Options */}
    <div className="flex gap-2">
      <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">
        <FileText className="h-3 w-3 mr-1" /> Include Charts
      </Badge>
      <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">
        <Star className="h-3 w-3 mr-1" /> Branded
      </Badge>
    </div>
  </div>
);

// 6. Alerts & Notifications Mockup
export const AlertsMockup = () => (
  <div className="bg-card rounded-xl p-4 space-y-4 border border-border">
    <div className="flex items-center justify-between">
      <h4 className="font-semibold text-foreground">Notifications</h4>
      <div className="relative">
        <Bell className="h-5 w-5 text-muted-foreground" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          3
        </span>
      </div>
    </div>
    
    {/* Notifications List */}
    <div className="space-y-2">
      {[
        { 
          icon: "🎉", 
          title: "Milestone Achieved!", 
          message: "Alex Rivera hit 1M views on Nike campaign", 
          time: "2 min ago",
          type: "success"
        },
        { 
          icon: "📈", 
          title: "Engagement Spike", 
          message: "Campaign engagement up 45% today", 
          time: "1 hour ago",
          type: "info"
        },
        { 
          icon: "🚀", 
          title: "Viral Alert!", 
          message: "TikTok video trending in top 100", 
          time: "3 hours ago",
          type: "viral"
        },
      ].map((notification, i) => (
        <div 
          key={i} 
          className={`p-3 rounded-lg border ${
            notification.type === 'success' ? 'bg-green-500/5 border-green-500/20' :
            notification.type === 'viral' ? 'bg-orange-500/5 border-orange-500/20' :
            'bg-blue-500/5 border-blue-500/20'
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="text-lg">{notification.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{notification.title}</p>
              <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{notification.time}</span>
          </div>
        </div>
      ))}
    </div>
    
    {/* Quick Actions */}
    <div className="flex items-center justify-between pt-2 border-t border-border/50">
      <span className="text-xs text-muted-foreground">Auto-refresh enabled</span>
      <Badge variant="outline" className="text-xs bg-primary/5 text-primary cursor-pointer">
        <Zap className="h-3 w-3 mr-1" /> Configure Alerts
      </Badge>
    </div>
  </div>
);

// Export all mockups as a map for easy access
export const featureMockups = {
  dashboard: UnifiedDashboardMockup,
  creators: CreatorProfilesMockup,
  campaigns: CampaignAnalyticsMockup,
  clients: ClientDashboardMockup,
  reports: PdfReportMockup,
  alerts: AlertsMockup,
};
