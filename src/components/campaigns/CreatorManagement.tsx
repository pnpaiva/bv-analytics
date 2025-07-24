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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Edit, Trash2, Loader2, User } from 'lucide-react';
import { useCreators } from '@/hooks/useCreators';
import { useCreateCreator, useUpdateCreator, useDeleteCreator } from '@/hooks/useManageCreators';

interface CreatorFormData {
  name: string;
  avatar_url: string;
  youtube_handle: string;
  instagram_handle: string;
  tiktok_handle: string;
}

export function CreatorManagement() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingCreator, setEditingCreator] = useState<any>(null);
  const [formData, setFormData] = useState<CreatorFormData>({
    name: '',
    avatar_url: '',
    youtube_handle: '',
    instagram_handle: '',
    tiktok_handle: '',
  });

  const { data: creators = [], isLoading } = useCreators();
  const createCreator = useCreateCreator();
  const updateCreator = useUpdateCreator();
  const deleteCreator = useDeleteCreator();

  const resetForm = () => {
    setFormData({
      name: '',
      avatar_url: '',
      youtube_handle: '',
      instagram_handle: '',
      tiktok_handle: '',
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const platform_handles: Record<string, string> = {};
    if (formData.youtube_handle) platform_handles.youtube = formData.youtube_handle;
    if (formData.instagram_handle) platform_handles.instagram = formData.instagram_handle;
    if (formData.tiktok_handle) platform_handles.tiktok = formData.tiktok_handle;
    
    await createCreator.mutateAsync({
      name: formData.name,
      avatar_url: formData.avatar_url || undefined,
      platform_handles: Object.keys(platform_handles).length > 0 ? platform_handles : undefined,
    });
    
    setCreateOpen(false);
    resetForm();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCreator) return;
    
    const platform_handles: Record<string, string> = {};
    if (formData.youtube_handle) platform_handles.youtube = formData.youtube_handle;
    if (formData.instagram_handle) platform_handles.instagram = formData.instagram_handle;
    if (formData.tiktok_handle) platform_handles.tiktok = formData.tiktok_handle;
    
    await updateCreator.mutateAsync({
      id: editingCreator.id,
      name: formData.name,
      avatar_url: formData.avatar_url || undefined,
      platform_handles: Object.keys(platform_handles).length > 0 ? platform_handles : undefined,
    });
    
    setEditOpen(false);
    setEditingCreator(null);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteCreator.mutateAsync(id);
  };

  const openEditDialog = (creator: any) => {
    setEditingCreator(creator);
    setFormData({
      name: creator.name,
      avatar_url: creator.avatar_url || '',
      youtube_handle: creator.platform_handles?.youtube || '',
      instagram_handle: creator.platform_handles?.instagram || '',
      tiktok_handle: creator.platform_handles?.tiktok || '',
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
          <h2 className="text-2xl font-bold">Creator Management</h2>
          <p className="text-muted-foreground">Manage your creators and their platform handles</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Creator
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Creator</DialogTitle>
              <DialogDescription>
                Add a new creator to your roster with their platform handles.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Creator Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter creator name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Input
                  id="avatar_url"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              
              <div className="space-y-4">
                <Label>Platform Handles</Label>
                
                <div className="space-y-2">
                  <Label htmlFor="youtube_handle" className="text-sm">YouTube Handle</Label>
                  <Input
                    id="youtube_handle"
                    value={formData.youtube_handle}
                    onChange={(e) => setFormData({ ...formData, youtube_handle: e.target.value })}
                    placeholder="@creatorname"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="instagram_handle" className="text-sm">Instagram Handle</Label>
                  <Input
                    id="instagram_handle"
                    value={formData.instagram_handle}
                    onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
                    placeholder="@creatorname"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tiktok_handle" className="text-sm">TikTok Handle</Label>
                  <Input
                    id="tiktok_handle"
                    value={formData.tiktok_handle}
                    onChange={(e) => setFormData({ ...formData, tiktok_handle: e.target.value })}
                    placeholder="@creatorname"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCreator.isPending}>
                  {createCreator.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Creator
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Creators List */}
      {creators.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creators.map((creator) => (
            <Card key={creator.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={creator.avatar_url} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  {creator.name}
                </CardTitle>
                <CardDescription>
                  {creator.platform_handles && Object.keys(creator.platform_handles).length > 0 
                    ? `Active on ${Object.keys(creator.platform_handles).join(', ')}`
                    : 'No platform handles set'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {creator.platform_handles?.youtube && (
                    <Badge variant="outline">YouTube: {creator.platform_handles.youtube}</Badge>
                  )}
                  {creator.platform_handles?.instagram && (
                    <Badge variant="outline">Instagram: {creator.platform_handles.instagram}</Badge>
                  )}
                  {creator.platform_handles?.tiktok && (
                    <Badge variant="outline">TikTok: {creator.platform_handles.tiktok}</Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(creator)}
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
                        <AlertDialogTitle>Delete Creator</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{creator.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(creator.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No creators yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first creator to start creating campaigns.
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Creator
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Creator</DialogTitle>
            <DialogDescription>
              Update the creator's information and platform handles.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Creator Name *</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter creator name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit_avatar_url">Avatar URL</Label>
              <Input
                id="edit_avatar_url"
                value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            
            <div className="space-y-4">
              <Label>Platform Handles</Label>
              
              <div className="space-y-2">
                <Label htmlFor="edit_youtube_handle" className="text-sm">YouTube Handle</Label>
                <Input
                  id="edit_youtube_handle"
                  value={formData.youtube_handle}
                  onChange={(e) => setFormData({ ...formData, youtube_handle: e.target.value })}
                  placeholder="@creatorname"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_instagram_handle" className="text-sm">Instagram Handle</Label>
                <Input
                  id="edit_instagram_handle"
                  value={formData.instagram_handle}
                  onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
                  placeholder="@creatorname"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_tiktok_handle" className="text-sm">TikTok Handle</Label>
                <Input
                  id="edit_tiktok_handle"
                  value={formData.tiktok_handle}
                  onChange={(e) => setFormData({ ...formData, tiktok_handle: e.target.value })}
                  placeholder="@creatorname"
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditOpen(false);
                  setEditingCreator(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateCreator.isPending}>
                {updateCreator.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Creator
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}