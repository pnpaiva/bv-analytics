import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Eye, 
  Heart, 
  TrendingUp, 
  Users, 
  Target, 
  Youtube, 
  Instagram,
  Search,
  RefreshCw,
  Download,
  BarChart3,
  DollarSign,
  Bell,
  Zap,
  CheckCircle,
  ExternalLink,
  FileText,
  Filter,
  Grid3X3,
  List,
  MapPin,
  Mail,
  Phone,
  Star,
  MessageCircle,
  Smile
} from 'lucide-react';

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
};

// 1. Unified Dashboard Mockup - Campaigns Grid
export const UnifiedDashboardMockup = () => (
  <div className="bg-background rounded-xl border border-border overflow-hidden">
    {/* Header */}
    <div className="bg-card border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground text-sm">Campaigns</h3>
          <p className="text-xs text-muted-foreground">Manage your influencer campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs">
            <Grid3X3 className="h-3 w-3 mr-1" /> Cards
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs">
            <Download className="h-3 w-3 mr-1" /> Export
          </Button>
        </div>
      </div>
      {/* Search */}
      <div className="mt-3 relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input placeholder="Search campaigns..." className="pl-7 h-8 text-xs" />
      </div>
    </div>
    
    {/* Campaign Cards Grid */}
    <div className="p-3 grid grid-cols-2 gap-3">
      {[
        { brand: "Nike", logo: "N", views: 2400000, engagement: 156000, rate: 6.5, status: "completed", color: "from-orange-500 to-red-500" },
        { brand: "Spotify", logo: "S", views: 1800000, engagement: 98000, rate: 5.4, status: "completed", color: "from-green-500 to-green-600" },
        { brand: "Adobe", logo: "A", views: 950000, engagement: 72000, rate: 7.6, status: "analyzing", color: "from-red-500 to-pink-500" },
        { brand: "Revolut", logo: "R", views: 3200000, engagement: 245000, rate: 7.7, status: "completed", color: "from-blue-500 to-purple-500" },
      ].map((campaign, i) => (
        <Card key={i} className="border border-border bg-card overflow-hidden">
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center gap-2">
              <Checkbox className="h-3 w-3" />
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${campaign.color} flex items-center justify-center text-white font-bold text-xs`}>
                {campaign.logo}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-xs truncate">{campaign.brand}</p>
                <Badge 
                  variant="outline" 
                  className={`text-[10px] h-4 ${campaign.status === 'completed' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'}`}
                >
                  {campaign.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs font-semibold text-foreground">{formatNumber(campaign.views)}</p>
                <p className="text-[10px] text-muted-foreground">Views</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{formatNumber(campaign.engagement)}</p>
                <p className="text-[10px] text-muted-foreground">Engagement</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-green-600">{campaign.rate}%</p>
                <p className="text-[10px] text-muted-foreground">Rate</p>
              </div>
            </div>
            {/* Content Links */}
            <div className="mt-2 pt-2 border-t border-border/50 flex gap-1">
              <Youtube className="h-3 w-3 text-red-500" />
              <Instagram className="h-3 w-3 text-pink-500" />
              <TikTokIcon className="h-3 w-3 text-foreground" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// 2. Creator Profiles Mockup - Actual creator profile view
export const CreatorProfilesMockup = () => (
  <div className="bg-background rounded-xl border border-border overflow-hidden">
    {/* Header */}
    <div className="bg-card border-b border-border px-4 py-3">
      <h3 className="font-semibold text-foreground text-sm">Creator Profiles</h3>
      <p className="text-xs text-muted-foreground">View and manage your creators</p>
    </div>
    
    <div className="flex">
      {/* Creator List */}
      <div className="w-1/3 border-r border-border p-2 space-y-1">
        {[
          { name: "Alex Rivera", followers: "1.2M", active: true },
          { name: "Sarah Chen", followers: "850K", active: false },
          { name: "Mike Torres", followers: "2.1M", active: false },
        ].map((creator, i) => (
          <div key={i} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${creator.active ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-bold text-xs">
              {creator.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{creator.name}</p>
              <p className="text-[10px] text-muted-foreground">{creator.followers}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Creator Detail */}
      <div className="flex-1 p-3">
        {/* Profile Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-bold">
            AR
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm">Alex Rivera</h4>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <MapPin className="h-3 w-3" /> Los Angeles, CA
            </div>
          </div>
        </div>
        
        {/* Platform Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { platform: "YouTube", icon: Youtube, color: "text-red-500", followers: "1.2M", rate: "8.5%" },
            { platform: "Instagram", icon: Instagram, color: "text-pink-500", followers: "450K", rate: "12.3%" },
            { platform: "TikTok", icon: TikTokIcon, color: "text-foreground", followers: "890K", rate: "15.2%" },
          ].map((p, i) => (
            <div key={i} className="p-2 bg-muted/30 rounded-lg border border-border/50 text-center">
              <p.icon className={`h-4 w-4 mx-auto mb-1 ${p.color}`} />
              <p className="text-xs font-semibold text-foreground">{p.followers}</p>
              <p className="text-[10px] text-green-600">{p.rate} ER</p>
            </div>
          ))}
        </div>
        
        {/* Recent Collaborations */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Recent Collaborations</p>
          <div className="space-y-1">
            {[{ brand: "Nike", views: "2.4M" }, { brand: "Spotify", views: "1.8M" }].map((c, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-muted/20 rounded text-xs">
                <span className="text-foreground">{c.brand}</span>
                <span className="text-muted-foreground">{c.views} views</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// 3. Campaign Analytics Mockup - Charts and metrics
export const CampaignAnalyticsMockup = () => (
  <div className="bg-background rounded-xl border border-border overflow-hidden">
    {/* Header */}
    <div className="bg-card border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground text-sm">Analytics</h3>
          <p className="text-xs text-muted-foreground">Campaign performance insights</p>
        </div>
        <div className="flex gap-1">
          <Badge variant="outline" className="text-[10px] h-5">Overview</Badge>
          <Badge variant="outline" className="text-[10px] h-5 bg-muted/50">Videos</Badge>
          <Badge variant="outline" className="text-[10px] h-5 bg-muted/50">Compare</Badge>
        </div>
      </div>
    </div>
    
    {/* Metrics Row */}
    <div className="p-3 grid grid-cols-4 gap-2">
      {[
        { label: "Total Views", value: "8.4M", icon: Eye, trend: "+12%" },
        { label: "Engagement", value: "571K", icon: Heart, trend: "+8%" },
        { label: "Avg Rate", value: "6.8%", icon: TrendingUp, trend: "+2%" },
        { label: "Campaigns", value: "24", icon: Target, trend: "" },
      ].map((m, i) => (
        <div key={i} className="p-2 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center justify-between mb-1">
            <m.icon className="h-3 w-3 text-primary" />
            {m.trend && <span className="text-[10px] text-green-600">{m.trend}</span>}
          </div>
          <p className="text-sm font-bold text-foreground">{m.value}</p>
          <p className="text-[10px] text-muted-foreground">{m.label}</p>
        </div>
      ))}
    </div>
    
    {/* Chart Area */}
    <div className="px-3 pb-3">
      <div className="bg-muted/20 rounded-lg p-3 border border-border/50">
        <p className="text-[10px] text-muted-foreground mb-2">Performance Over Time</p>
        <div className="flex items-end gap-1 h-20">
          {[35, 45, 40, 60, 55, 70, 65, 80, 75, 85, 90, 95].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-primary/60 rounded-t transition-all hover:bg-primary" 
                style={{ height: `${h}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1 text-[8px] text-muted-foreground">
          <span>Jan</span>
          <span>Mar</span>
          <span>May</span>
          <span>Jul</span>
          <span>Sep</span>
          <span>Nov</span>
        </div>
      </div>
      
      {/* Platform Breakdown */}
      <div className="mt-2 grid grid-cols-3 gap-2">
        {[
          { platform: "YouTube", percentage: 55, color: "bg-red-500" },
          { platform: "Instagram", percentage: 28, color: "bg-pink-500" },
          { platform: "TikTok", percentage: 17, color: "bg-foreground" },
        ].map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${p.color}`} />
            <span className="text-[10px] text-muted-foreground">{p.platform}</span>
            <span className="text-[10px] font-medium text-foreground ml-auto">{p.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// 4. Client Dashboard Mockup
export const ClientDashboardMockup = () => (
  <div className="bg-background rounded-xl border border-border overflow-hidden">
    {/* Header */}
    <div className="bg-card border-b border-border px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
          AC
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm">Acme Corp Dashboard</h3>
          <Badge variant="outline" className="text-[10px] h-4">Client View</Badge>
        </div>
      </div>
    </div>
    
    {/* ROI Metrics */}
    <div className="p-3 grid grid-cols-2 gap-2">
      <div className="p-3 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg border border-green-500/20">
        <DollarSign className="h-4 w-4 text-green-600 mb-1" />
        <p className="text-lg font-bold text-foreground">$0.004</p>
        <p className="text-[10px] text-muted-foreground">Cost per View</p>
      </div>
      <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
        <TrendingUp className="h-4 w-4 text-primary mb-1" />
        <p className="text-lg font-bold text-foreground">342%</p>
        <p className="text-[10px] text-muted-foreground">ROI</p>
      </div>
    </div>
    
    {/* Active Campaigns */}
    <div className="px-3 pb-3">
      <p className="text-xs font-medium text-muted-foreground mb-2">Your Campaigns</p>
      <div className="space-y-2">
        {[
          { name: "Q4 Product Launch", progress: 85, views: "4.2M", status: "On Track" },
          { name: "Holiday Special", progress: 45, views: "1.8M", status: "In Progress" },
        ].map((c, i) => (
          <div key={i} className="p-2 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-foreground">{c.name}</span>
              <Badge variant="outline" className="text-[10px] h-4 bg-green-500/10 text-green-600 border-green-500/20">
                {c.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${c.progress}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground">{c.views}</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Trust indicator */}
      <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
        <CheckCircle className="h-3 w-3 text-green-500" />
        <span>Real-time data • Updated 2 min ago</span>
      </div>
    </div>
  </div>
);

// 5. PDF Report Mockup
export const PdfReportMockup = () => (
  <div className="bg-background rounded-xl border border-border overflow-hidden">
    {/* Header */}
    <div className="bg-card border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground text-sm">Campaign Report</h3>
          <p className="text-xs text-muted-foreground">Nike Q4 Campaign</p>
        </div>
        <Button size="sm" className="h-7 text-xs bg-primary">
          <Download className="h-3 w-3 mr-1" /> Export PDF
        </Button>
      </div>
    </div>
    
    {/* Report Preview */}
    <div className="p-3">
      <div className="bg-white dark:bg-muted/10 rounded-lg p-3 border border-border shadow-inner">
        {/* Report Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border/30 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-orange-500 to-red-500" />
            <span className="text-xs font-medium text-foreground">Nike Campaign Report</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Dec 2024</span>
        </div>
        
        {/* Mini Chart */}
        <div className="mb-3">
          <p className="text-[10px] text-muted-foreground mb-1">Views Over Time</p>
          <div className="flex items-end gap-0.5 h-10">
            {[40, 55, 45, 70, 65, 80, 75, 90, 85, 95].map((h, i) => (
              <div key={i} className="flex-1 bg-primary/60 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        
        {/* Summary Table */}
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between py-1 border-b border-border/20">
            <span className="text-muted-foreground">Total Views</span>
            <span className="font-medium text-foreground">4,823,456</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/20">
            <span className="text-muted-foreground">Total Engagement</span>
            <span className="font-medium text-foreground">312,450</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/20">
            <span className="text-muted-foreground">Engagement Rate</span>
            <span className="font-medium text-foreground">6.5%</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Sentiment Score</span>
            <span className="font-medium text-green-600">+78% Positive</span>
          </div>
        </div>
      </div>
      
      {/* Export Options */}
      <div className="mt-3 flex gap-2">
        <Badge variant="outline" className="text-[10px] h-5 cursor-pointer hover:bg-muted">
          <BarChart3 className="h-3 w-3 mr-1" /> Include Charts
        </Badge>
        <Badge variant="outline" className="text-[10px] h-5 cursor-pointer hover:bg-muted">
          <MessageCircle className="h-3 w-3 mr-1" /> Sentiment
        </Badge>
        <Badge variant="outline" className="text-[10px] h-5 cursor-pointer hover:bg-muted">
          <Star className="h-3 w-3 mr-1" /> Branded
        </Badge>
      </div>
    </div>
  </div>
);

// 6. Alerts & Notifications Mockup
export const AlertsMockup = () => (
  <div className="bg-background rounded-xl border border-border overflow-hidden">
    {/* Header */}
    <div className="bg-card border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
        <div className="relative">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center font-bold">
            3
          </span>
        </div>
      </div>
    </div>
    
    {/* Notifications List */}
    <div className="p-3 space-y-2">
      {[
        { 
          icon: "🎉", 
          title: "Milestone Achieved!", 
          message: "Nike campaign hit 1M views", 
          time: "2 min ago",
          type: "success"
        },
        { 
          icon: "📈", 
          title: "Engagement Spike", 
          message: "Revolut engagement up 45%", 
          time: "1 hour ago",
          type: "info"
        },
        { 
          icon: "🚀", 
          title: "Viral Alert!", 
          message: "TikTok video trending #47", 
          time: "3 hours ago",
          type: "viral"
        },
        { 
          icon: "✅", 
          title: "Campaign Complete", 
          message: "Spotify campaign finalized", 
          time: "5 hours ago",
          type: "complete"
        },
      ].map((notification, i) => (
        <div 
          key={i} 
          className={`p-2.5 rounded-lg border ${
            notification.type === 'success' ? 'bg-green-500/5 border-green-500/20' :
            notification.type === 'viral' ? 'bg-orange-500/5 border-orange-500/20' :
            notification.type === 'complete' ? 'bg-primary/5 border-primary/20' :
            'bg-blue-500/5 border-blue-500/20'
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="text-sm">{notification.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">{notification.title}</p>
              <p className="text-[10px] text-muted-foreground truncate">{notification.message}</p>
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{notification.time}</span>
          </div>
        </div>
      ))}
    </div>
    
    {/* Quick Actions */}
    <div className="px-3 pb-3 flex items-center justify-between pt-2 border-t border-border/50">
      <span className="text-[10px] text-muted-foreground">Auto-alerts enabled</span>
      <Badge variant="outline" className="text-[10px] h-5 bg-primary/5 text-primary cursor-pointer">
        <Zap className="h-3 w-3 mr-1" /> Configure
      </Badge>
    </div>
  </div>
);

// Export all mockups
export const featureMockups = {
  dashboard: UnifiedDashboardMockup,
  creators: CreatorProfilesMockup,
  campaigns: CampaignAnalyticsMockup,
  clients: ClientDashboardMockup,
  reports: PdfReportMockup,
  alerts: AlertsMockup,
};
