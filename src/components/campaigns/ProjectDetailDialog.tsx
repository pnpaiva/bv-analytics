import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  FileText, 
  Video, 
  Link as LinkIcon, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  Eye,
  Upload,
  ExternalLink
} from 'lucide-react';
import { CampaignCreatorEnhanced } from '@/hooks/useEnhancedProjectManagement';
import { FileUploadSection } from './FileUploadSection';
import { ProjectTimeline } from './ProjectTimeline';

interface ProjectDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  campaignCreator: CampaignCreatorEnhanced | null;
}

export function ProjectDetailDialog({ isOpen, onClose, campaignCreator }: ProjectDetailDialogProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!campaignCreator) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
      case 'signed':
        return 'bg-green-500 text-white';
      case 'in_progress':
      case 'submitted':
      case 'sent':
        return 'bg-blue-500 text-white';
      case 'pending':
      case 'not_sent':
      case 'not_submitted':
        return 'bg-yellow-500 text-white';
      case 'rejected':
      case 'needs_revision':
      case 'expired':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={campaignCreator.creators?.avatar_url} />
              <AvatarFallback>
                {campaignCreator.creators?.name?.charAt(0) || 'C'}
              </AvatarFallback>
            </Avatar>
            <div>
              <span>{campaignCreator.creators?.name || 'Unknown Creator'}</span>
              <span className="text-muted-foreground text-sm ml-2">
                - {campaignCreator.campaigns?.brand_name || 'Unknown Campaign'}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 mb-4">
          <Badge className={getStatusColor(campaignCreator.stage || 'pending')}>
            {campaignCreator.stage || 'Not Started'}
          </Badge>
          <Badge className={getPriorityColor(campaignCreator.priority || 'medium')}>
            {campaignCreator.priority || 'Medium'} Priority
          </Badge>
          <Badge variant="outline">
            Payment: {campaignCreator.payment_status || 'Pending'}
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[600px] mt-4">
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Creator Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Creator Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Name</label>
                      <p>{campaignCreator.creators?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p>{campaignCreator.creators?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Platforms</label>
                      <div className="flex gap-2 mt-1">
                        {campaignCreator.creators?.platform_handles && 
                         Object.entries(campaignCreator.creators.platform_handles as Record<string, string>).map(([platform, handle]) => (
                          <Badge key={platform} variant="secondary">
                            {platform}: {handle as string}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Campaign Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Campaign Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Brand</label>
                      <p>{campaignCreator.campaigns?.brand_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Campaign Date</label>
                      <p>{campaignCreator.campaigns?.campaign_date || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <Badge className={getStatusColor(campaignCreator.campaigns?.status || 'draft')}>
                        {campaignCreator.campaigns?.status || 'Draft'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Status Overview */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Project Status Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-muted-foreground">Contract</div>
                        <Badge className={getStatusColor(campaignCreator.contract_status || 'not_sent')}>
                          {campaignCreator.contract_status || 'Not Sent'}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-muted-foreground">Brief</div>
                        <Badge className={getStatusColor(campaignCreator.brief_status || 'not_sent')}>
                          {campaignCreator.brief_status || 'Not Sent'}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-muted-foreground">Video Approval</div>
                        <Badge className={getStatusColor(campaignCreator.video_approval_status || 'not_submitted')}>
                          {campaignCreator.video_approval_status || 'Not Submitted'}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-muted-foreground">Final Video</div>
                        <Badge className={getStatusColor(campaignCreator.final_video_url ? 'completed' : 'pending')}>
                          {campaignCreator.final_video_url ? 'Delivered' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Notes */}
              {campaignCreator.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{campaignCreator.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="files">
              <FileUploadSection 
                campaignId={campaignCreator.campaign_id}
                creatorId={campaignCreator.creator_id}
              />
            </TabsContent>

            <TabsContent value="timeline">
              <ProjectTimeline 
                campaignId={campaignCreator.campaign_id}
                creatorId={campaignCreator.creator_id}
              />
            </TabsContent>

            <TabsContent value="deadlines" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Contract Deadlines
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Sent Date</label>
                      <p>{campaignCreator.contract_sent_date || 'Not sent'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Deadline</label>
                      <p>{campaignCreator.contract_deadline || 'Not set'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Video Deadlines
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Submission Deadline</label>
                      <p>{campaignCreator.video_submission_deadline || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Final Delivery</label>
                      <p>{campaignCreator.final_delivery_date || 'Not delivered'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Project Deadline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Overall Deadline</label>
                      <p>{campaignCreator.deadline || 'Not set'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Amount</label>
                      <p className="text-2xl font-bold">
                        ${campaignCreator.payment_amount || 0}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <Badge className={getStatusColor(campaignCreator.payment_status || 'pending')}>
                        {campaignCreator.payment_status || 'Pending'}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                      <p>{campaignCreator.payment_due_date || 'Not set'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}