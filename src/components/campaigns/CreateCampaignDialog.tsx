import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateCampaign } from '@/hooks/useCampaigns';
import { useCreators } from '@/hooks/useCreators';
import { useClients } from '@/hooks/useClients';
import { useMasterCampaigns } from '@/hooks/useMasterCampaigns';
import { Plus, Loader2 } from 'lucide-react';

export function CreateCampaignDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    brand_name: '',
    creator_id: '',
    campaign_date: '',
    campaign_month: '',
    deal_value: '',
    client_id: '',
    master_campaign_name: '',
    youtube_urls: '',
    instagram_urls: '',
    tiktok_urls: '',
  });

  const createCampaign = useCreateCampaign();
  const { data: creators = [] } = useCreators();
  const { data: clients = [] } = useClients();
  const { data: masterCampaigns = [] } = useMasterCampaigns();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const content_urls: Record<string, string[]> = {};
    
    if (formData.youtube_urls.trim()) {
      content_urls.youtube = formData.youtube_urls.split('\n').filter(url => url.trim());
    }
    if (formData.instagram_urls.trim()) {
      content_urls.instagram = formData.instagram_urls.split('\n').filter(url => url.trim());
    }
    if (formData.tiktok_urls.trim()) {
      content_urls.tiktok = formData.tiktok_urls.split('\n').filter(url => url.trim());
    }

    console.log('Creating campaign with content_urls:', content_urls);

    await createCampaign.mutateAsync({
      brand_name: formData.brand_name,
      creator_id: formData.creator_id,
      campaign_date: formData.campaign_date,
      campaign_month: formData.campaign_month || undefined,
      deal_value: formData.deal_value ? parseFloat(formData.deal_value) : undefined,
      client_id: formData.client_id || undefined,
      master_campaign_name: formData.master_campaign_name || undefined,
      content_urls,
    });

    setOpen(false);
    setFormData({
      brand_name: '',
      creator_id: '',
      campaign_date: '',
      campaign_month: '',
      deal_value: '',
      client_id: '',
      master_campaign_name: '',
      youtube_urls: '',
      instagram_urls: '',
      tiktok_urls: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Create a new campaign to track analytics across multiple platforms.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand_name">Brand Name *</Label>
              <Input
                id="brand_name"
                value={formData.brand_name}
                onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="creator_id">Creator *</Label>
              <Select
                value={formData.creator_id}
                onValueChange={(value) => setFormData({ ...formData, creator_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select creator" />
                </SelectTrigger>
                <SelectContent>
                  {creators.map((creator) => (
                    <SelectItem key={creator.id} value={creator.id}>
                      {creator.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="campaign_date">Campaign Date *</Label>
              <Input
                id="campaign_date"
                type="date"
                value={formData.campaign_date}
                onChange={(e) => setFormData({ ...formData, campaign_date: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="campaign_month">Campaign Month</Label>
              <Input
                id="campaign_month"
                placeholder="e.g., January 2024, Q1 2024"
                value={formData.campaign_month}
                onChange={(e) => setFormData({ ...formData, campaign_month: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deal_value">Deal Value</Label>
              <Input
                id="deal_value"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.deal_value}
                onChange={(e) => setFormData({ ...formData, deal_value: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="master_campaign_name">Master Campaign</Label>
              <Select
                value={formData.master_campaign_name}
                onValueChange={(value) => setFormData({ ...formData, master_campaign_name: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select master campaign (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {masterCampaigns.map((masterCampaign: any) => (
                    <SelectItem key={masterCampaign.name} value={masterCampaign.name}>
                      {masterCampaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_id">Client</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData({ ...formData, client_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select client (optional)" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Content URLs</Label>
            
            <div className="space-y-2">
              <Label htmlFor="youtube_urls" className="text-sm">YouTube URLs (one per line)</Label>
              <Textarea
                id="youtube_urls"
                placeholder="https://youtube.com/watch?v=..."
                value={formData.youtube_urls}
                onChange={(e) => setFormData({ ...formData, youtube_urls: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="instagram_urls" className="text-sm">Instagram URLs (one per line)</Label>
              <Textarea
                id="instagram_urls"
                placeholder="https://instagram.com/p/..."
                value={formData.instagram_urls}
                onChange={(e) => setFormData({ ...formData, instagram_urls: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tiktok_urls" className="text-sm">TikTok URLs (one per line)</Label>
              <Textarea
                id="tiktok_urls"
                placeholder="https://tiktok.com/@user/video/..."
                value={formData.tiktok_urls}
                onChange={(e) => setFormData({ ...formData, tiktok_urls: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCampaign.isPending}>
              {createCampaign.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Campaign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}