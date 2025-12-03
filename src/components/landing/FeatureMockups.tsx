import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Eye, 
  Heart, 
  TrendingUp, 
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
  Grid3X3,
  List,
  MapPin,
  Star,
  MessageCircle,
  Check,
  X
} from 'lucide-react';

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

export const UnifiedDashboardMockup = () => {
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const campaigns = [
    { id: '1', brand: "Nike", logo: "N", views: 2400000, engagement: 156000, rate: 6.5, status: "completed", color: "from-orange-500 to-red-500" },
    { id: '2', brand: "Spotify", logo: "S", views: 1800000, engagement: 98000, rate: 5.4, status: "completed", color: "from-green-500 to-green-600" },
    { id: '3', brand: "Adobe", logo: "A", views: 950000, engagement: 72000, rate: 7.6, status: "analyzing", color: "from-red-500 to-pink-500" },
    { id: '4', brand: "Revolut", logo: "R", views: 3200000, engagement: 245000, rate: 7.7, status: "completed", color: "from-blue-500 to-purple-500" },
  ];

  const filteredCampaigns = campaigns.filter(c => 
    c.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedCampaigns(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleRefresh = (id: string) => {
    setRefreshingId(id);
    setTimeout(() => setRefreshingId(null), 1500);
  };

  return (
    <div className="bg-background rounded-xl border border-border overflow-hidden">
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-sm">Campaigns</h3>
            <p className="text-xs text-muted-foreground">
              {selectedCampaigns.length > 0 ? `${selectedCampaigns.length} selected` : 'Manage your influencer campaigns'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={viewMode === 'cards' ? 'default' : 'outline'} 
              size="sm" 
              className="h-7 text-xs"
              onClick={() => setViewMode('cards')}
            >
              <Grid3X3 className="h-3 w-3 mr-1" /> Cards
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'outline'} 
              size="sm" 
              className="h-7 text-xs"
              onClick={() => setViewMode('list')}
            >
              <List className="h-3 w-3 mr-1" /> List
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs"
              disabled={selectedCampaigns.length === 0}
            >
              <Download className="h-3 w-3 mr-1" /> Export
            </Button>
          </div>
        </div>
        <div className="mt-3 relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input 
            placeholder="Search campaigns..." 
            className="pl-7 h-8 text-xs" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className={`p-3 ${viewMode === 'cards' ? 'grid grid-cols-2 gap-3' : 'space-y-2'}`}>
        {filteredCampaigns.map((campaign) => (
          <Card 
            key={campaign.id} 
            className={`border bg-card overflow-hidden cursor-pointer transition-all hover:shadow-md ${
              selectedCampaigns.includes(campaign.id) ? 'ring-2 ring-primary border-primary' : 'border-border'
            }`}
            onClick={() => toggleSelect(campaign.id)}
          >
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center gap-2">
                <Checkbox 
                  className="h-3 w-3" 
                  checked={selectedCampaigns.includes(campaign.id)}
                  onClick={(e) => e.stopPropagation()}
                  onCheckedChange={() => toggleSelect(campaign.id)}
                />
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRefresh(campaign.id);
                  }}
                >
                  <RefreshCw className={`h-3 w-3 ${refreshingId === campaign.id ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="hover:bg-muted/50 rounded p-1 transition-colors">
                  <p className="text-xs font-semibold text-foreground">{formatNumber(campaign.views)}</p>
                  <p className="text-[10px] text-muted-foreground">Views</p>
                </div>
                <div className="hover:bg-muted/50 rounded p-1 transition-colors">
                  <p className="text-xs font-semibold text-foreground">{formatNumber(campaign.engagement)}</p>
                  <p className="text-[10px] text-muted-foreground">Engagement</p>
                </div>
                <div className="hover:bg-muted/50 rounded p-1 transition-colors">
                  <p className="text-xs font-semibold text-green-600">{campaign.rate}%</p>
                  <p className="text-[10px] text-muted-foreground">Rate</p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-border/50 flex gap-1">
                <div className="p-1 rounded hover:bg-muted/50 cursor-pointer transition-colors">
                  <Youtube className="h-3 w-3 text-red-500" />
                </div>
                <div className="p-1 rounded hover:bg-muted/50 cursor-pointer transition-colors">
                  <Instagram className="h-3 w-3 text-pink-500" />
                </div>
                <div className="p-1 rounded hover:bg-muted/50 cursor-pointer transition-colors">
                  <TikTokIcon className="h-3 w-3 text-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const CreatorProfilesMockup = () => {
  const [selectedCreator, setSelectedCreator] = useState(0);
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);

  const creators = [
    { name: "Alex Rivera", followers: "1.2M", initials: "AR" },
    { name: "Sarah Chen", followers: "850K", initials: "SC" },
    { name: "Mike Torres", followers: "2.1M", initials: "MT" },
  ];

  const platforms = [
    { platform: "YouTube", icon: Youtube, color: "text-red-500", followers: "1.2M", rate: "8.5%" },
    { platform: "Instagram", icon: Instagram, color: "text-pink-500", followers: "450K", rate: "12.3%" },
    { platform: "TikTok", icon: TikTokIcon, color: "text-foreground", followers: "890K", rate: "15.2%" },
  ];

  const collaborations = [
    { brand: "Nike", views: "2.4M" }, 
    { brand: "Spotify", views: "1.8M" },
    { brand: "Adobe", views: "950K" }
  ];

  return (
    <div className="bg-background rounded-xl border border-border overflow-hidden">
      <div className="bg-card border-b border-border px-4 py-3">
        <h3 className="font-semibold text-foreground text-sm">Creator Profiles</h3>
        <p className="text-xs text-muted-foreground">Click a creator to view details</p>
      </div>
      
      <div className="flex">
        <div className="w-1/3 border-r border-border p-2 space-y-1">
          {creators.map((creator, i) => (
            <div 
              key={i} 
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                selectedCreator === i 
                  ? 'bg-primary/10 border border-primary/20' 
                  : 'hover:bg-muted/50 border border-transparent'
              }`}
              onClick={() => setSelectedCreator(i)}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                {creator.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{creator.name}</p>
                <p className="text-[10px] text-muted-foreground">{creator.followers}</p>
              </div>
              {selectedCreator === i && <Check className="h-3 w-3 text-primary" />}
            </div>
          ))}
        </div>
        
        <div className="flex-1 p-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary font-bold">
              {creators[selectedCreator].initials}
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm">{creators[selectedCreator].name}</h4>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <MapPin className="h-3 w-3" /> Los Angeles, CA
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-3">
            {platforms.map((p, i) => (
              <div 
                key={i} 
                className={`p-2 rounded-lg border text-center cursor-pointer transition-all ${
                  hoveredPlatform === p.platform 
                    ? 'bg-primary/10 border-primary/30 scale-105' 
                    : 'bg-muted/30 border-border/50 hover:bg-muted/50'
                }`}
                onMouseEnter={() => setHoveredPlatform(p.platform)}
                onMouseLeave={() => setHoveredPlatform(null)}
              >
                <p.icon className={`h-4 w-4 mx-auto mb-1 ${p.color}`} />
                <p className="text-xs font-semibold text-foreground">{p.followers}</p>
                <p className="text-[10px] text-green-600">{p.rate} ER</p>
              </div>
            ))}
          </div>
          
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Recent Collaborations</p>
            <div className="space-y-1">
              {collaborations.map((c, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-2 bg-muted/20 rounded text-xs cursor-pointer hover:bg-muted/40 transition-colors group"
                >
                  <span className="text-foreground">{c.brand}</span>
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">{c.views} views</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CampaignAnalyticsMockup = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const barData = [35, 45, 40, 60, 55, 70, 65, 80, 75, 85, 90, 95];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const metrics = [
    { label: "Total Views", value: "8.4M", icon: Eye, trend: "+12%", key: "views" },
    { label: "Engagement", value: "571K", icon: Heart, trend: "+8%", key: "engagement" },
    { label: "Avg Rate", value: "6.8%", icon: TrendingUp, trend: "+2%", key: "rate" },
    { label: "Campaigns", value: "24", icon: Target, trend: "", key: "campaigns" },
  ];

  const platforms = [
    { platform: "YouTube", percentage: 55, color: "bg-red-500" },
    { platform: "Instagram", percentage: 28, color: "bg-pink-500" },
    { platform: "TikTok", percentage: 17, color: "bg-foreground" },
  ];

  return (
    <div className="bg-background rounded-xl border border-border overflow-hidden">
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-sm">Analytics</h3>
            <p className="text-xs text-muted-foreground">Click metrics to filter data</p>
          </div>
          <div className="flex gap-1">
            {['overview', 'videos', 'compare'].map((tab) => (
              <Badge 
                key={tab}
                variant="outline" 
                className={`text-[10px] h-5 cursor-pointer transition-colors ${
                  activeTab === tab ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-3 grid grid-cols-4 gap-2">
        {metrics.map((m) => (
          <div 
            key={m.key}
            className={`p-2 rounded-lg border cursor-pointer transition-all ${
              selectedMetric === m.key 
                ? 'bg-primary/10 border-primary/30 scale-105' 
                : 'bg-muted/30 border-border/50 hover:bg-muted/50'
            }`}
            onClick={() => setSelectedMetric(selectedMetric === m.key ? null : m.key)}
          >
            <div className="flex items-center justify-between mb-1">
              <m.icon className={`h-3 w-3 ${selectedMetric === m.key ? 'text-primary' : 'text-muted-foreground'}`} />
              {m.trend && <span className="text-[10px] text-green-600">{m.trend}</span>}
            </div>
            <p className="text-sm font-bold text-foreground">{m.value}</p>
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>
      
      <div className="px-3 pb-3">
        <div className="bg-muted/20 rounded-lg p-3 border border-border/50">
          <p className="text-[10px] text-muted-foreground mb-2">
            {hoveredBar !== null ? `${months[hoveredBar]}: ${barData[hoveredBar]}K views` : 'Hover over bars to see details'}
          </p>
          <div className="flex items-end gap-1 h-20">
            {barData.map((h, i) => (
              <div 
                key={i} 
                className="flex-1 flex flex-col items-center cursor-pointer"
                onMouseEnter={() => setHoveredBar(i)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                <div 
                  className={`w-full rounded-t transition-all ${
                    hoveredBar === i ? 'bg-primary scale-105' : 'bg-primary/60 hover:bg-primary/80'
                  }`}
                  style={{ height: `${h}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1 text-[8px] text-muted-foreground">
            <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span>
          </div>
        </div>
        
        <div className="mt-2 grid grid-cols-3 gap-2">
          {platforms.map((p, i) => (
            <div key={i} className="flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-muted/30 transition-colors">
              <div className={`w-2 h-2 rounded-full ${p.color}`} />
              <span className="text-[10px] text-muted-foreground">{p.platform}</span>
              <span className="text-[10px] font-medium text-foreground ml-auto">{p.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ClientDashboardMockup = () => {
  const [expandedCampaign, setExpandedCampaign] = useState<number | null>(0);
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  const campaigns = [
    { name: "Q4 Product Launch", progress: 85, views: "4.2M", status: "On Track", details: "3 creators • 12 videos" },
    { name: "Holiday Special", progress: 45, views: "1.8M", status: "In Progress", details: "5 creators • 8 videos" },
  ];

  return (
    <div className="bg-background rounded-xl border border-border overflow-hidden">
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
      
      <div className="p-3 grid grid-cols-2 gap-2">
        <div 
          className={`p-3 rounded-lg border cursor-pointer transition-all ${
            hoveredMetric === 'cpv' 
              ? 'bg-green-500/20 border-green-500/40 scale-105' 
              : 'bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 hover:border-green-500/30'
          }`}
          onMouseEnter={() => setHoveredMetric('cpv')}
          onMouseLeave={() => setHoveredMetric(null)}
        >
          <DollarSign className="h-4 w-4 text-green-600 mb-1" />
          <p className="text-lg font-bold text-foreground">$0.004</p>
          <p className="text-[10px] text-muted-foreground">Cost per View</p>
        </div>
        <div 
          className={`p-3 rounded-lg border cursor-pointer transition-all ${
            hoveredMetric === 'roi' 
              ? 'bg-primary/20 border-primary/40 scale-105' 
              : 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:border-primary/30'
          }`}
          onMouseEnter={() => setHoveredMetric('roi')}
          onMouseLeave={() => setHoveredMetric(null)}
        >
          <TrendingUp className="h-4 w-4 text-primary mb-1" />
          <p className="text-lg font-bold text-foreground">342%</p>
          <p className="text-[10px] text-muted-foreground">ROI</p>
        </div>
      </div>
      
      <div className="px-3 pb-3">
        <p className="text-xs font-medium text-muted-foreground mb-2">Your Campaigns (click to expand)</p>
        <div className="space-y-2">
          {campaigns.map((c, i) => (
            <div 
              key={i} 
              className={`p-2 rounded-lg border cursor-pointer transition-all ${
                expandedCampaign === i ? 'bg-muted/50 border-primary/30' : 'bg-muted/30 border-border/50 hover:bg-muted/40'
              }`}
              onClick={() => setExpandedCampaign(expandedCampaign === i ? null : i)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-foreground">{c.name}</span>
                <Badge variant="outline" className="text-[10px] h-4 bg-green-500/10 text-green-600 border-green-500/20">
                  {c.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${c.progress}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground">{c.views}</span>
              </div>
              {expandedCampaign === i && (
                <div className="mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground animate-fade-in">
                  {c.details} • {c.progress}% complete
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
          <CheckCircle className="h-3 w-3 text-green-500" />
          <span>Real-time data • Updated 2 min ago</span>
        </div>
      </div>
    </div>
  );
};

export const PdfReportMockup = () => {
  const [selectedOptions, setSelectedOptions] = useState(['charts', 'sentiment']);
  const [isExporting, setIsExporting] = useState(false);

  const toggleOption = (option: string) => {
    setSelectedOptions(prev => prev.includes(option) ? prev.filter(x => x !== option) : [...prev, option]);
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 2000);
  };

  const exportOptions = [
    { id: 'charts', label: 'Include Charts', icon: BarChart3 },
    { id: 'sentiment', label: 'Sentiment', icon: MessageCircle },
    { id: 'branded', label: 'Branded', icon: Star },
  ];

  return (
    <div className="bg-background rounded-xl border border-border overflow-hidden">
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-sm">Campaign Report</h3>
            <p className="text-xs text-muted-foreground">Nike Q4 Campaign</p>
          </div>
          <Button size="sm" className="h-7 text-xs bg-primary" onClick={handleExport} disabled={isExporting}>
            {isExporting ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Download className="h-3 w-3 mr-1" />}
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </Button>
        </div>
      </div>
      
      <div className="p-3">
        <div className="bg-white dark:bg-muted/10 rounded-lg p-3 border border-border shadow-inner">
          <div className="flex items-center justify-between pb-2 border-b border-border/30 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-orange-500 to-red-500" />
              <span className="text-xs font-medium text-foreground">Nike Campaign Report</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Dec 2024</span>
          </div>
          
          <div className="mb-3">
            <p className="text-[10px] text-muted-foreground mb-1">Views Over Time</p>
            <div className="flex items-end gap-0.5 h-10">
              {[40, 55, 45, 70, 65, 80, 75, 90, 85, 95].map((h, i) => (
                <div key={i} className="flex-1 bg-primary/60 rounded-t hover:bg-primary transition-colors cursor-pointer" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          
          <div className="space-y-1 text-[10px]">
            {[
              { label: "Total Views", value: "4,823,456" },
              { label: "Total Engagement", value: "312,450" },
              { label: "Engagement Rate", value: "6.5%" },
              { label: "Sentiment Score", value: "+78% Positive", highlight: true },
            ].map((row, i) => (
              <div key={i} className={`flex justify-between py-1 border-b border-border/20 hover:bg-muted/20 px-1 -mx-1 transition-colors cursor-default ${i === 3 ? 'border-b-0' : ''}`}>
                <span className="text-muted-foreground">{row.label}</span>
                <span className={`font-medium ${row.highlight ? 'text-green-600' : 'text-foreground'}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-3 flex gap-2">
          {exportOptions.map((option) => (
            <Badge 
              key={option.id}
              variant="outline" 
              className={`text-[10px] h-5 cursor-pointer transition-all ${
                selectedOptions.includes(option.id) ? 'bg-primary/20 border-primary/40 text-primary' : 'hover:bg-muted'
              }`}
              onClick={() => toggleOption(option.id)}
            >
              <option.icon className="h-3 w-3 mr-1" />
              {option.label}
              {selectedOptions.includes(option.id) && <Check className="h-2 w-2 ml-1" />}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AlertsMockup = () => {
  const [notifications, setNotifications] = useState([
    { id: '1', icon: "🎉", title: "Milestone Achieved!", message: "Nike campaign hit 1M views", time: "2 min ago", type: "success", read: false },
    { id: '2', icon: "📈", title: "Engagement Spike", message: "Revolut engagement up 45%", time: "1 hour ago", type: "info", read: false },
    { id: '3', icon: "🚀", title: "Viral Alert!", message: "TikTok video trending #47", time: "3 hours ago", type: "viral", read: true },
    { id: '4', icon: "✅", title: "Campaign Complete", message: "Spotify campaign finalized", time: "5 hours ago", type: "complete", read: true },
  ]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="bg-background rounded-xl border border-border overflow-hidden">
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
          <div className="relative cursor-pointer" onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}>
            <Bell className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-3 space-y-2 max-h-[280px] overflow-y-auto">
        {notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`p-2.5 rounded-lg border cursor-pointer transition-all group ${
              notification.type === 'success' ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10' :
              notification.type === 'viral' ? 'bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10' :
              notification.type === 'complete' ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' :
              'bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10'
            } ${!notification.read ? 'ring-1 ring-primary/30' : ''}`}
            onClick={() => markAsRead(notification.id)}
          >
            <div className="flex items-start gap-2">
              <span className="text-sm">{notification.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-medium text-foreground">{notification.title}</p>
                  {!notification.read && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{notification.message}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{notification.time}</span>
                <button 
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded"
                  onClick={(e) => { e.stopPropagation(); dismissNotification(notification.id); }}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-xs">No notifications</div>
        )}
      </div>
      
      <div className="px-3 pb-3 flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground cursor-pointer" onClick={() => setAlertsEnabled(!alertsEnabled)}>
          <div className={`w-6 h-3 rounded-full transition-colors ${alertsEnabled ? 'bg-primary' : 'bg-muted'}`}>
            <div className={`w-2.5 h-2.5 rounded-full bg-white shadow-sm transition-transform mt-0.25 ${alertsEnabled ? 'translate-x-3' : 'translate-x-0.5'}`} />
          </div>
          <span>Auto-alerts {alertsEnabled ? 'enabled' : 'disabled'}</span>
        </div>
        <Badge variant="outline" className="text-[10px] h-5 bg-primary/5 text-primary cursor-pointer hover:bg-primary/10">
          <Zap className="h-3 w-3 mr-1" /> Configure
        </Badge>
      </div>
    </div>
  );
};

export const featureMockups = {
  dashboard: UnifiedDashboardMockup,
  creators: CreatorProfilesMockup,
  campaigns: CampaignAnalyticsMockup,
  clients: ClientDashboardMockup,
  reports: PdfReportMockup,
  alerts: AlertsMockup,
};
