import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2, Link2 } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { 
  useMasterCampaigns, 
  useCreateMasterCampaign, 
  useUpdateMasterCampaign, 
  useDeleteMasterCampaign 
} from '@/hooks/useMasterCampaigns';

interface MasterCampaignFormData {
  name: string;
  start_date: string;
  end_date: string;
  logo_url: string;
}

export function MasterCampaignManagement() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<string | null>(null);
  const [formData, setFormData] = useState<MasterCampaignFormData>({
    name: '',
    start_date: '',
    end_date: '',
    logo_url: '',
  });

  const { data: masterCampaigns = [], isLoading } = useMasterCampaigns();
  const createMasterCampaign = useCreateMasterCampaign();
  const updateMasterCampaign = useUpdateMasterCampaign();
  const deleteMasterCampaign = useDeleteMasterCampaign();

  const resetForm = () => {
    setFormData({
      name: '',
      start_date: '',
      end_date: '',
      logo_url: '',
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createMasterCampaign.mutateAsync({
      name: formData.name,
      start_date: formData.start_date || undefined,
      end_date: formData.end_date || undefined,
    });
    
    setCreateOpen(false);
    resetForm();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;
    
    await updateMasterCampaign.mutateAsync({
      id: editingCampaign,
      name: formData.name,
      start_date: formData.start_date || undefined,
      end_date: formData.end_date || undefined,
    });
    
    setEditOpen(false);
    setEditingCampaign(null);
    resetForm();
  };

  const handleDelete = async (masterCampaignName: string) => {
    await deleteMasterCampaign.mutateAsync(masterCampaignName);
  };

  const openEditDialog = (masterCampaignName: string) => {
    setEditingCampaign(masterCampaignName);
    setFormData({
      name: masterCampaignName,
      start_date: '',
      end_date: '',
      logo_url: '',
    });
    setEditOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Master Campaign Management</h2>
          <p className="text-muted-foreground">Create and manage master campaigns</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Master Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Master Campaign</DialogTitle>
              <DialogDescription>
                Create a new master campaign to group related campaigns together.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Master Campaign Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter master campaign name"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <ImageUpload
                value={formData.logo_url}
                onValueChange={(url) => setFormData({ ...formData, logo_url: url })}
                label="Master Campaign Logo"
                placeholder="Upload campaign logo"
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMasterCampaign.isPending}>
                  {createMasterCampaign.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Master Campaign
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Master Campaigns List */}
      {masterCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {masterCampaigns.map((campaign: any) => (
            <Card key={campaign.name}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-primary" />
                  {campaign.name}
                </CardTitle>
                <CardDescription>Master Campaign</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Active</Badge>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(campaign.name)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Master Campaign</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{campaign.name}"? This will unlink all campaigns from this master campaign. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(campaign.name)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Link2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No master campaigns yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first master campaign to start grouping related campaigns.
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Master Campaign
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Master Campaign</DialogTitle>
            <DialogDescription>
              Update the master campaign details.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Master Campaign Name *</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter master campaign name"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_start_date">Start Date</Label>
                <Input
                  id="edit_start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_end_date">End Date</Label>
                <Input
                  id="edit_end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <ImageUpload
              value={formData.logo_url}
              onValueChange={(url) => setFormData({ ...formData, logo_url: url })}
              label="Master Campaign Logo"
              placeholder="Upload campaign logo"
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditOpen(false);
                  setEditingCampaign(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMasterCampaign.isPending}>
                {updateMasterCampaign.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Master Campaign
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}