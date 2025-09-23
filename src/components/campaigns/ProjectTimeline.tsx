import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Clock, 
  FileText, 
  Video, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  DollarSign,
  Calendar
} from 'lucide-react';
import { useProjectTimeline } from '@/hooks/useEnhancedProjectManagement';

interface ProjectTimelineProps {
  campaignId: string;
  creatorId?: string;
}

export function ProjectTimeline({ campaignId, creatorId }: ProjectTimelineProps) {
  const { data: timeline = [], isLoading } = useProjectTimeline(campaignId, creatorId);

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'stage_change':
        return <CheckCircle className="w-4 h-4" />;
      case 'file_upload':
        return <Upload className="w-4 h-4" />;
      case 'file_approval':
        return <CheckCircle className="w-4 h-4" />;
      case 'note_added':
        return <FileText className="w-4 h-4" />;
      case 'deadline_update':
        return <Calendar className="w-4 h-4" />;
      case 'payment_update':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'stage_change':
        return 'text-blue-600 bg-blue-100';
      case 'file_upload':
        return 'text-purple-600 bg-purple-100';
      case 'file_approval':
        return 'text-green-600 bg-green-100';
      case 'note_added':
        return 'text-gray-600 bg-gray-100';
      case 'deadline_update':
        return 'text-orange-600 bg-orange-100';
      case 'payment_update':
        return 'text-emerald-600 bg-emerald-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return <div>Loading timeline...</div>;
  }

  if (timeline.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No activity yet</h3>
            <p className="text-muted-foreground">Activity will appear here as the project progresses</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {timeline.map((activity, index) => (
        <Card key={activity.id}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-full ${getActivityColor(activity.activity_type)}`}>
                {getActivityIcon(activity.activity_type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{activity.title}</h4>
                  <time className="text-sm text-muted-foreground">
                    {new Date(activity.created_at).toLocaleDateString()} at{' '}
                    {new Date(activity.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </time>
                </div>
                
                {activity.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {activity.description}
                  </p>
                )}
                
                {(activity.old_value || activity.new_value) && (
                  <div className="mt-2 text-sm">
                    {activity.old_value && (
                      <span className="text-muted-foreground">
                        From: <span className="font-medium">{activity.old_value}</span>
                      </span>
                    )}
                    {activity.old_value && activity.new_value && (
                      <span className="text-muted-foreground mx-2">→</span>
                    )}
                    {activity.new_value && (
                      <span className="text-muted-foreground">
                        To: <span className="font-medium">{activity.new_value}</span>
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {activity.activity_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}