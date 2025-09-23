import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Users, 
  Calendar,
  BarChart3,
  DollarSign
} from 'lucide-react';
import { ProjectManagementRow } from './ProjectManagementRow';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useCreators } from '@/hooks/useCreators';
import { useCampaignCreators } from '@/hooks/useCampaignCreators';

export function ProjectManagementMain() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('campaign_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: campaigns = [] } = useCampaigns();
  const { data: creators = [] } = useCreators();
  const { data: projectData = [] } = useCampaignCreators();

  // Combine data for the table
  const tableData = projectData
    .map(item => {
      const campaign = campaigns.find(c => c.id === item.campaign_id);
      const creator = creators.find(c => c.id === item.creator_id);
      
      if (!campaign || !creator) return null;
      
      return {
        campaign,
        creator,
        campaignCreator: item
      };
    })
    .filter(Boolean) as Array<{
      campaign: any;
      creator: any;
      campaignCreator: any;
    }>;

  // Apply filters and search
  const filteredData = tableData.filter(item => {
    const matchesSearch = 
      item.campaign.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.campaign.clients?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || item.campaign.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || item.campaignCreator.priority === priorityFilter;
    const matchesStage = stageFilter === 'all' || item.campaignCreator.stage === stageFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesStage;
  });

  // Apply sorting
  const sortedData = [...filteredData].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortBy) {
      case 'campaign_date':
        aValue = new Date(a.campaign.campaign_date);
        bValue = new Date(b.campaign.campaign_date);
        break;
      case 'brand_name':
        aValue = a.campaign.brand_name;
        bValue = b.campaign.brand_name;
        break;
      case 'creator_name':
        aValue = a.creator.name;
        bValue = b.creator.name;
        break;
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[a.campaignCreator.priority as keyof typeof priorityOrder] || 0;
        bValue = priorityOrder[b.campaignCreator.priority as keyof typeof priorityOrder] || 0;
        break;
      case 'stage':
        aValue = a.campaignCreator.stage;
        bValue = b.campaignCreator.stage;
        break;
      default:
        aValue = a.campaign.campaign_date;
        bValue = b.campaign.campaign_date;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <SortAsc className="h-4 w-4 opacity-50" />;
    return sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  // Calculate summary statistics
  const totalCampaigns = new Set(filteredData.map(item => item.campaign.id)).size;
  const totalCreators = new Set(filteredData.map(item => item.creator.id)).size;
  const totalViews = filteredData.reduce((sum, item) => sum + (item.campaign.total_views || 0), 0);
  const totalValue = filteredData.reduce((sum, item) => 
    sum + (item.campaignCreator.payment_amount || item.campaign.fixed_deal_value || 0), 0
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredData.length}</div>
            <p className="text-xs text-muted-foreground">
              {totalCampaigns} campaigns, {totalCreators} creators
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(totalViews)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-US', { 
                style: 'currency', 
                currency: 'USD',
                notation: 'compact'
              }).format(totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Project portfolio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Performance</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredData.length > 0 
                ? (filteredData.reduce((sum, item) => sum + (item.campaign.engagement_rate || 0), 0) / filteredData.length).toFixed(1)
                : '0'
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Engagement rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Project Management
          </CardTitle>
          <CardDescription>
            Manage campaigns, creators, and track project progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns, creators, or clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Project Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('brand_name')}
                      className="h-auto p-0 font-semibold"
                    >
                      Campaign <SortIcon field="brand_name" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('creator_name')}
                      className="h-auto p-0 font-semibold"
                    >
                      Creator <SortIcon field="creator_name" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('stage')}
                      className="h-auto p-0 font-semibold"
                    >
                      Stage <SortIcon field="stage" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('priority')}
                      className="h-auto p-0 font-semibold"
                    >
                      Priority <SortIcon field="priority" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('campaign_date')}
                      className="h-auto p-0 font-semibold"
                    >
                      Dates <SortIcon field="campaign_date" />
                    </Button>
                  </TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.length > 0 ? (
                  sortedData.map((item, index) => (
                    <ProjectManagementRow
                      key={`${item.campaign.id}-${item.creator.id}-${index}`}
                      campaign={item.campaign}
                      creator={item.creator}
                      campaignCreator={item.campaignCreator}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No projects found matching your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}