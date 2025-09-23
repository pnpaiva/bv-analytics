import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  DollarSign, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  CheckCircle2,
  Calendar,
  Filter,
  Search,
  Eye,
  Edit3,
  Table,
  Clock as TimelineIcon,
  Paperclip
} from 'lucide-react';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { useProjectOverview, useCampaignCreatorsProject, useProjectStages } from '@/hooks/useProjectManagement';
import { CampaignManagementDialog } from '@/components/campaigns/CampaignManagementDialog';
import { ProjectManagementTable } from '@/components/campaigns/ProjectManagementTable';
import { TimelineManagement } from '@/components/campaigns/TimelineManagement';
import { FileAttachmentSystem } from '@/components/campaigns/FileAttachmentSystem';
import { useCampaigns } from '@/hooks/useCampaigns';

export default function ProjectManagement() {
  const { data: overview } = useProjectOverview();
  const { data: allCreators = [] } = useCampaignCreatorsProject();
  const { data: stages = [] } = useProjectStages();
  const { data: campaigns = [] } = useCampaigns();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  const getStageColor = (stageName: string) => {
    const normalizedStageName = stageName.toLowerCase().replace(/_/g, ' ');
    const stage = stages.find(s => s.name.toLowerCase() === normalizedStageName);
    return stage?.color || '#6B7280';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white'; 
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500 text-white';
      case 'pending': return 'bg-yellow-500 text-white';
      case 'overdue': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Filter creators based on search and filter criteria
  const filteredCreators = allCreators.filter(creator => {
    const matchesSearch = !searchTerm || 
      creator.creators?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.campaigns?.brand_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = stageFilter === 'all' || creator.stage === stageFilter || creator.stage?.toLowerCase().replace(/_/g, ' ') === stageFilter;
    const matchesPriority = priorityFilter === 'all' || creator.priority === priorityFilter;
    const matchesPayment = paymentFilter === 'all' || creator.payment_status === paymentFilter;

    return matchesSearch && matchesStage && matchesPriority && matchesPayment;
  });

  // Get upcoming deadlines (next 7 days)
  const upcomingDeadlines = allCreators.filter(creator => {
    if (!creator.deadline) return false;
    const deadline = parseISO(creator.deadline);
    const now = new Date();
    const nextWeek = addDays(now, 7);
    return isAfter(deadline, now) && isBefore(deadline, nextWeek);
  }).sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

  // Get overdue items
  const overdueItems = allCreators.filter(creator => {
    if (!creator.deadline) return false;
    return isBefore(parseISO(creator.deadline), new Date());
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Project Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage all campaign creators, track progress, payments, and deadlines across your organization
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="table">
              <Table className="h-4 w-4 mr-2" />
              Manage Table
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <TimelineIcon className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="files">
              <Paperclip className="h-4 w-4 mr-2" />
              Files
            </TabsTrigger>
            <TabsTrigger value="creators">All Creators</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview?.totalProjects || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Across {campaigns.length} campaigns
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${overview?.totalPaymentAmount?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {overview?.paymentStats?.paid || 0} paid • {overview?.paymentStats?.pending || 0} pending
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{upcomingDeadlines.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Next 7 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{overdueItems.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Need attention
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Stage Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Stages</CardTitle>
                  <CardDescription>Distribution of creators across project stages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stages.map(stage => {
                      const stageKey = stage.name.toLowerCase().replace(/\s+/g, '_');
                      const count = overview?.stageStats?.[stageKey] || 
                                   overview?.stageStats?.[stage.name.toLowerCase()] || 
                                   allCreators.filter(c => c.stage?.toLowerCase().replace(/_/g, ' ') === stage.name.toLowerCase()).length;
                      const percentage = overview?.totalProjects ? (count / overview.totalProjects) * 100 : 0;
                      
                      return (
                        <div key={stage.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: stage.color }}
                              />
                              <span className="text-sm font-medium">{stage.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">{percentage.toFixed(0)}%</span>
                              <Badge variant="outline">{count}</Badge>
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="h-2 rounded-full transition-all"
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: stage.color 
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Overview</CardTitle>
                  <CardDescription>Payment status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['paid', 'pending', 'overdue'].map(status => {
                      const count = overview?.paymentStats?.[status] || 0;
                      const amount = allCreators
                        .filter(c => c.payment_status === status)
                        .reduce((sum, c) => sum + (c.payment_amount || 0), 0);
                      const percentage = overview?.totalProjects ? (count / overview.totalProjects) * 100 : 0;
                      
                      return (
                        <div key={status} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge className={getPaymentStatusColor(status)}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Badge>
                            <div className="text-sm text-muted-foreground">
                              {count} creators • ${amount.toLocaleString()}
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                status === 'paid' ? 'bg-green-500' :
                                status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="table" className="space-y-6">
            <ProjectManagementTable />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <TimelineManagement />
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            <FileAttachmentSystem />
          </TabsContent>

          <TabsContent value="creators" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search creators or campaigns..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stage</label>
                    <Select value={stageFilter} onValueChange={setStageFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stages</SelectItem>
                        {stages.filter(stage => stage.name && stage.name.trim()).map(stage => (
                          <SelectItem 
                            key={stage.id} 
                            value={stage.name.toLowerCase().replace(/\s+/g, '_')}
                          >
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment</label>
                    <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm('');
                        setStageFilter('all');
                        setPriorityFilter('all');
                        setPaymentFilter('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Creators List */}
            <div className="grid gap-4">
              {filteredCreators.map((creator) => (
                <Card key={creator.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {creator.creators?.avatar_url && (
                          <img 
                            src={creator.creators.avatar_url} 
                            alt={creator.creators.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold text-lg">{creator.creators?.name}</h3>
                          <p className="text-muted-foreground">{creator.campaigns?.brand_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              style={{ backgroundColor: getStageColor(creator.stage) }}
                              className="text-white text-xs"
                            >
                              {creator.stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                            <Badge className={`${getPriorityColor(creator.priority)} text-xs`}>
                              {creator.priority?.charAt(0).toUpperCase() + creator.priority?.slice(1)}
                            </Badge>
                            <Badge className={`${getPaymentStatusColor(creator.payment_status)} text-xs`}>
                              ${creator.payment_amount?.toLocaleString()} - {creator.payment_status}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {creator.deadline && (
                          <div className="text-right">
                            <div className="text-sm font-medium">Deadline</div>
                            <div className={`text-sm ${
                              isBefore(parseISO(creator.deadline), new Date()) 
                                ? 'text-destructive' 
                                : 'text-muted-foreground'
                            }`}>
                              {format(parseISO(creator.deadline), "MMM dd, yyyy")}
                            </div>
                          </div>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCampaignId(creator.campaign_id)}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="deadlines" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Deadlines */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-600">
                    <Clock className="h-5 w-5" />
                    Upcoming Deadlines (Next 7 Days)
                  </CardTitle>
                  <CardDescription>Items due soon that need attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingDeadlines.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No upcoming deadlines</p>
                    ) : (
                      upcomingDeadlines.map((creator) => (
                        <div key={creator.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{creator.creators?.name}</div>
                            <div className="text-sm text-muted-foreground">{creator.campaigns?.brand_name}</div>
                            <Badge 
                              style={{ backgroundColor: getStageColor(creator.stage) }}
                              className="text-white text-xs mt-1"
                            >
                              {creator.stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-yellow-600">
                              {format(parseISO(creator.deadline!), "MMM dd")}
                            </div>
                            <Badge className={getPriorityColor(creator.priority)}>
                              {creator.priority}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Overdue Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    Overdue Items
                  </CardTitle>
                  <CardDescription>Items past their deadline</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {overdueItems.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No overdue items</p>
                    ) : (
                      overdueItems.map((creator) => (
                        <div key={creator.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                          <div>
                            <div className="font-medium">{creator.creators?.name}</div>
                            <div className="text-sm text-muted-foreground">{creator.campaigns?.brand_name}</div>
                            <Badge 
                              style={{ backgroundColor: getStageColor(creator.stage) }}
                              className="text-white text-xs mt-1"
                            >
                              {creator.stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-red-600">
                              {format(parseISO(creator.deadline!), "MMM dd")}
                            </div>
                            <div className="text-xs text-red-600">
                              Overdue
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <div className="grid gap-4">
              {campaigns.map((campaign) => {
                const campaignCreators = allCreators.filter(c => c.campaign_id === campaign.id);
                const totalBudget = campaignCreators.reduce((sum, c) => sum + (c.payment_amount || 0), 0);
                const completedCreators = campaignCreators.filter(c => c.stage === 'completed').length;
                const completionRate = campaignCreators.length > 0 ? (completedCreators / campaignCreators.length) * 100 : 0;

                return (
                  <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {campaign.logo_url && (
                            <img 
                              src={campaign.logo_url} 
                              alt={`${campaign.brand_name} logo`}
                              className="w-12 h-12 object-contain rounded border bg-white p-1"
                            />
                          )}
                          <div>
                            <h3 className="font-semibold text-lg">{campaign.brand_name}</h3>
                            <p className="text-muted-foreground">
                              {campaignCreators.length} creators • ${totalBudget.toLocaleString()} budget
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">{campaign.status}</Badge>
                              <Badge variant="secondary">
                                {completionRate.toFixed(0)}% Complete
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-medium">Progress</div>
                            <div className="w-24 bg-muted rounded-full h-2 mt-1">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${completionRate}%` }}
                              />
                            </div>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCampaignId(campaign.id)}
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Manage
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Campaign Management Dialog */}
        {selectedCampaign && (
          <CampaignManagementDialog
            campaign={selectedCampaign}
            isOpen={!!selectedCampaignId}
            onClose={() => setSelectedCampaignId(null)}
          />
        )}
      </div>
    </div>
  );
}