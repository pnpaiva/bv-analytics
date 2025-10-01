import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useValidateInvitation, useMarkInvitationUsed, useYouTubeConnection } from '@/hooks/useCreatorInvitations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Youtube, Building2, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function CreatorInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const { data: invitation, isLoading: isValidating } = useValidateInvitation(token);
  const { data: existingConnection } = useYouTubeConnection(invitation?.creator_id || null);
  const markUsed = useMarkInvitationUsed();

  const handleConnectYouTube = async () => {
    if (!invitation?.creator_id || !invitation?.organization_id) {
      toast.error('Invalid invitation data');
      return;
    }

    try {
      // Generate OAuth URL
      const { data, error } = await supabase.functions.invoke('youtube-oauth-initiate', {
        body: {
          creatorId: invitation.creator_id,
          organizationId: invitation.organization_id,
        },
      });

      if (error) throw error;

      if (data?.authUrl) {
        // Mark invitation as used before redirecting
        await markUsed.mutateAsync(token!);
        
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to generate authorization URL');
      }
    } catch (error: any) {
      console.error('Error initiating YouTube OAuth:', error);
      toast.error(error.message || 'Failed to start YouTube connection');
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6 flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Validating invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-center">Invalid Invitation</CardTitle>
            <CardDescription className="text-center">
              This invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                Please contact your organization administrator for a new invitation link.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation.is_valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-center">Invitation Expired</CardTitle>
            <CardDescription className="text-center">
              This invitation has expired or has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                Invitation expired on: {new Date(invitation.expires_at).toLocaleDateString()}
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground text-center">
              Please request a new invitation link from your organization administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (existingConnection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-center">Already Connected</CardTitle>
            <CardDescription className="text-center">
              Your YouTube channel is already connected!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Youtube className="h-5 w-5 text-red-600" />
                <span className="font-medium">{existingConnection.channel_title}</span>
              </div>
              {existingConnection.subscriber_count && (
                <p className="text-sm text-muted-foreground">
                  {existingConnection.subscriber_count.toLocaleString()} subscribers
                </p>
              )}
            </div>
            <Alert>
              <AlertDescription>
                Your YouTube channel is successfully connected to {invitation.organization_name}.
                You can close this page.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <Youtube className="h-12 w-12 text-red-600" />
          </div>
          <CardTitle className="text-center">Connect Your YouTube Channel</CardTitle>
          <CardDescription className="text-center">
            You've been invited to connect your YouTube channel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Organization</p>
                <p className="text-sm text-muted-foreground">{invitation.organization_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Creator Profile</p>
                <p className="text-sm text-muted-foreground">{invitation.creator_name}</p>
              </div>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              By connecting your YouTube channel, you'll allow {invitation.organization_name} to:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>View your channel and video metadata</li>
                <li>Access analytics data (views, retention, demographics)</li>
                <li>Track performance metrics for campaigns</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleConnectYouTube}
            disabled={markUsed.isPending}
            className="w-full"
            size="lg"
          >
            {markUsed.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Youtube className="h-5 w-5 mr-2" />
                Connect YouTube Channel
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            This invitation expires on {new Date(invitation.expires_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
