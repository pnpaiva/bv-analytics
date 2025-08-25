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
import { useClients } from '@/hooks/useClients';
import { useMasterCampaigns } from '@/hooks/useMasterCampaigns';
import { ClientCombobox } from '@/components/ui/client-combobox';
import { ImageUpload } from '@/components/ui/image-upload';
import { CampaignCreatorManager } from './CampaignCreatorManager';
import { Plus, Loader2 } from 'lucide-react';

export function CreateCampaignDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    brand_name: '',
    campaign_date: '',
    campaign_month: '',
    fixed_deal_value: '',
    variable_deal_value: '',
    client_id: '',
    master_campaign_name: '',
    logo_url: '',
  });

  const [creators, setCreators] = useState([
    {
      creator_id: '',
      content_urls: {
        youtube: [''],
        instagram: [''],
        tiktok: [''],
      },
    },
  ]);

  const createCampaign = useCreateCampaign();
  const { data: clients = [] } = useClients();
  const { data: masterCampaigns = [] } = useMasterCampaigns();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up creators data - remove empty URLs
    const cleanedCreators = creators.map(creator => ({
      creator_id: creator.creator_id,
      content_urls: {
        youtube: creator.content_urls.youtube.filter(url => url.trim() !== ''),
        instagram: creator.content_urls.instagram.filter(url => url.trim() !== ''),
        tiktok: creator.content_urls.tiktok.filter(url => url.trim() !== ''),
      },
    })).filter(creator => creator.creator_id); // Only include creators with selected creator_id

    await createCampaign.mutateAsync({
      brand_name: formData.brand_name,
      campaign_date: formData.campaign_date,
      campaign_month: formData.campaign_month || undefined,
      fixed_deal_value: formData.fixed_deal_value ? parseFloat(formData.fixed_deal_value) : undefined,
      variable_deal_value: formData.variable_deal_value ? parseFloat(formData.variable_deal_value) : undefined,
      client_id: formData.client_id || undefined,
      master_campaign_name: formData.master_campaign_name || undefined,
      logo_url: formData.logo_url || undefined,
      creators: cleanedCreators,
    });

    setOpen(false);
    setFormData({
      brand_name: '',
      campaign_date: '',
      campaign_month: '',
      fixed_deal_value: '',
      variable_deal_value: '',
      client_id: '',
      master_campaign_name: '',
      logo_url: '',
    });
    setCreators([
      {
        creator_id: '',
        content_urls: {
          youtube: [''],
          instagram: [''],
          tiktok: [''],
        },
      },
    ]);
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
            
            <div className="col-span-2 space-y-2">
              <Label>Campaign Logo</Label>
              <ImageUpload
                value={formData.logo_url}
                onValueChange={(url) => setFormData({ ...formData, logo_url: url })}
                label=""
                placeholder="Upload company logo"
              />
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

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fixed_deal_value">Fixed Deal Value</Label>
              <Input
                id="fixed_deal_value"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.fixed_deal_value}
                onChange={(e) => setFormData({ ...formData, fixed_deal_value: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="variable_deal_value">Variable Deal Value</Label>
              <Input
                id="variable_deal_value"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.variable_deal_value}
                onChange={(e) => setFormData({ ...formData, variable_deal_value: e.target.value })}
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
            <ClientCombobox
              value={formData.client_id}
              onValueChange={(value) => setFormData({ ...formData, client_id: value })}
              placeholder="Select or create client..."
            />
          </div>

            <CampaignCreatorManager
              creators={creators}
              onChange={setCreators}
            />

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