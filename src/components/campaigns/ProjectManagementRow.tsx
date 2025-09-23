import React, { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ChevronDown, 
  ChevronRight, 
  Calendar, 
  FileText, 
  Clock, 
  DollarSign,
  User,
  Building2
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectTimeline } from './ProjectTimeline';
import { FileUploadSection } from './FileUploadSection';

interface ProjectManagementRowProps {
  campaign: {
    id: string;
    brand_name: string;
    campaign_date: string;
    status: string;
    total_views?: number;
    total_engagement?: number;
    engagement_rate?: number;
    fixed_deal_value?: number;
    logo_url?: string;
    clients?: { name: string };
  };
  creator: {
    id: string;
    name: string;
    avatar_url?: string;
    platform_handles?: any;
  };
  campaignCreator: {
    id: string;
    campaign_id: string;
    creator_id: string;
    stage: string;
    priority: string;
    contract_status: string;
    brief_status: string;
    video_approval_status: string;
    payment_status: string;
    payment_amount?: number;
    deadline?: string;
    notes?: string;
    final_video_url?: string;
  };
}

const priorityColors = {
  high: 'destructive',
  medium: 'default',
  low: 'secondary',
} as const;

const stageColors = {
  not_started: 'secondary',
  in_progress: 'default',
  review: 'outline',
  completed: 'default',
  cancelled: 'destructive',
} as const;

export function ProjectManagementRow({ campaign, creator, campaignCreator }: ProjectManagementRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (amount?: number) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <TableRow className="cursor-pointer hover:bg-muted/50">
        <TableCell>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </TableCell>
        
        <TableCell>
          <div className="flex items-center gap-3">
            {campaign.logo_url && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={campaign.logo_url} alt={campaign.brand_name} />
                <AvatarFallback>{campaign.brand_name.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <div>
              <div className="font-medium">{campaign.brand_name}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {campaign.clients?.name || 'No client'}
              </div>
            </div>
          </div>
        </TableCell>

        <TableCell>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={creator.avatar_url} alt={creator.name} />
              <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{creator.name}</div>
              <div className="text-sm text-muted-foreground">
                {creator.platform_handles?.youtube || 
                 creator.platform_handles?.instagram || 
                 creator.platform_handles?.tiktok || 'No handle'}
              </div>
            </div>
          </div>
        </TableCell>

        <TableCell>
          <Badge variant={stageColors[campaignCreator.stage as keyof typeof stageColors] || 'default'}>
            {campaignCreator.stage.replace('_', ' ')}
          </Badge>
        </TableCell>

        <TableCell>
          <Badge variant={priorityColors[campaignCreator.priority as keyof typeof priorityColors] || 'default'}>
            {campaignCreator.priority}
          </Badge>
        </TableCell>

        <TableCell>
          <div className="text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(campaign.campaign_date).toLocaleDateString()}
            </div>
            {campaignCreator.deadline && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(campaignCreator.deadline).toLocaleDateString()}
              </div>
            )}
          </div>
        </TableCell>

        <TableCell>
          <div className="text-sm">
            <div>{formatNumber(campaign.total_views)} views</div>
            <div className="text-muted-foreground">
              {campaign.engagement_rate?.toFixed(1)}% engagement
            </div>
          </div>
        </TableCell>

        <TableCell>
          <div className="text-sm">
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {formatCurrency(campaignCreator.payment_amount || campaign.fixed_deal_value)}
            </div>
            <Badge variant="outline" className="mt-1">
              {campaignCreator.payment_status}
            </Badge>
          </div>
        </TableCell>
      </TableRow>

      <CollapsibleContent asChild>
        <TableRow>
          <TableCell colSpan={8} className="p-0">
            <div className="border-t bg-muted/20 p-4">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="files">Files</TabsTrigger>
                  <TabsTrigger value="status">Status</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Campaign Details</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <div><strong>Status:</strong> {campaign.status}</div>
                        <div><strong>Campaign Date:</strong> {new Date(campaign.campaign_date).toLocaleDateString()}</div>
                        <div><strong>Total Views:</strong> {formatNumber(campaign.total_views)}</div>
                        <div><strong>Total Engagement:</strong> {formatNumber(campaign.total_engagement)}</div>
                        <div><strong>Engagement Rate:</strong> {campaign.engagement_rate?.toFixed(1)}%</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Creator Assignment</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <div><strong>Stage:</strong> {campaignCreator.stage.replace('_', ' ')}</div>
                        <div><strong>Priority:</strong> {campaignCreator.priority}</div>
                        <div><strong>Contract:</strong> {campaignCreator.contract_status}</div>
                        <div><strong>Brief:</strong> {campaignCreator.brief_status}</div>
                        <div><strong>Video Approval:</strong> {campaignCreator.video_approval_status}</div>
                        <div><strong>Payment:</strong> {campaignCreator.payment_status}</div>
                        {campaignCreator.final_video_url && (
                          <div>
                            <strong>Final Video:</strong> 
                            <a href={campaignCreator.final_video_url} target="_blank" rel="noopener noreferrer" className="text-primary ml-1">
                              View Video
                            </a>
                          </div>
                        )}
                        {campaignCreator.notes && (
                          <div><strong>Notes:</strong> {campaignCreator.notes}</div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="mt-4">
                  <ProjectTimeline campaignId={campaign.id} creatorId={creator.id} />
                </TabsContent>

                <TabsContent value="files" className="mt-4">
                  <FileUploadSection 
                    campaignId={campaign.id} 
                    creatorId={creator.id}
                  />
                </TabsContent>

                <TabsContent value="status" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Contract Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline">{campaignCreator.contract_status}</Badge>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Brief Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline">{campaignCreator.brief_status}</Badge>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Video Approval
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline">{campaignCreator.video_approval_status}</Badge>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </TableCell>
        </TableRow>
      </CollapsibleContent>
    </Collapsible>
  );
}