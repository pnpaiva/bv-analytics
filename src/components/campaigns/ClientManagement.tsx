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
import { Plus, Edit, Trash2, Loader2, Building } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useCreateClient, useUpdateClient, useDeleteClient } from '@/hooks/useManageClients';

interface ClientFormData {
  name: string;
}

export function ClientManagement() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
  });

  const { data: clients = [], isLoading } = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const resetForm = () => {
    setFormData({
      name: '',
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createClient.mutateAsync({
      name: formData.name,
    });
    
    setCreateOpen(false);
    resetForm();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    
    await updateClient.mutateAsync({
      id: editingClient.id,
      name: formData.name,
    });
    
    setEditOpen(false);
    setEditingClient(null);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteClient.mutateAsync(id);
  };

  const openEditDialog = (client: any) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
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
          <h2 className="text-2xl font-bold">Client Management</h2>
          <p className="text-muted-foreground">Manage your clients and organizations</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Add a new client to your roster.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Client Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter client name"
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createClient.isPending}>
                  {createClient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Client
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Clients List */}
      {clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Card key={client.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-primary" />
                  {client.name}
                </CardTitle>
                <CardDescription>Client</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(client)}
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
                        <AlertDialogTitle>Delete Client</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{client.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(client.id)}>
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
            <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No clients yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first client to start organizing your campaigns.
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update the client's information.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Client Name *</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter client name"
                required
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditOpen(false);
                  setEditingClient(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateClient.isPending}>
                {updateClient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Client
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}