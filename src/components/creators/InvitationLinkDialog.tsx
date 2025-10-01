import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGenerateInvitation } from '@/hooks/useCreatorInvitations';
import { useOrganizationContext } from '@/hooks/useOrganizationContext';
import { Copy, Check, Mail, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface InvitationLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: string;
  creatorName: string;
}

export function InvitationLinkDialog({
  open,
  onOpenChange,
  creatorId,
  creatorName,
}: InvitationLinkDialogProps) {
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { selectedOrganizationId } = useOrganizationContext();
  const generateInvitation = useGenerateInvitation();

  const handleGenerate = async () => {
    if (!selectedOrganizationId) {
      toast.error('Please select an organization first');
      return;
    }

    try {
      const token = await generateInvitation.mutateAsync({
        creatorId,
        organizationId: selectedOrganizationId,
      });
      setInvitationToken(token);
    } catch (error) {
      console.error('Failed to generate invitation:', error);
    }
  };

  const invitationUrl = invitationToken
    ? `${window.location.origin}/creator-invitation?token=${invitationToken}`
    : '';

  const handleCopy = async () => {
    if (!invitationUrl) return;

    try {
      await navigator.clipboard.writeText(invitationUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleEmailShare = () => {
    if (!invitationUrl) return;

    const subject = encodeURIComponent('Connect Your YouTube Channel');
    const body = encodeURIComponent(
      `Hi,\n\nYou've been invited to connect your YouTube channel for ${creatorName}.\n\nClick the link below to get started:\n${invitationUrl}\n\nThis link will expire in 7 days.\n\nBest regards`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleClose = () => {
    setInvitationToken(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>YouTube Connection Invitation</DialogTitle>
          <DialogDescription>
            Generate an invitation link for {creatorName} to connect their YouTube channel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!invitationToken ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the button below to generate a unique invitation link. The creator can use this
                link to securely connect their YouTube channel to your platform.
              </p>
              <Button
                onClick={handleGenerate}
                disabled={generateInvitation.isPending}
                className="w-full"
              >
                {generateInvitation.isPending ? 'Generating...' : 'Generate Invitation Link'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invitation-url">Invitation Link</Label>
                <div className="flex gap-2">
                  <Input
                    id="invitation-url"
                    value={invitationUrl}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Share this link with the creator</p>
                    <p className="text-muted-foreground">
                      The link will expire in 7 days. The creator can use it to connect their YouTube
                      channel and grant access to their analytics.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCopy} variant="outline" className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button onClick={handleEmailShare} variant="outline" className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Send via Email
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
