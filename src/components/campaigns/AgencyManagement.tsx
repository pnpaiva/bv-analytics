import React, { useState } from 'react';
import { useAgencies, useCreateAgency, useUpdateAgency, useDeleteAgency, Agency, CreateAgencyData } from '@/hooks/useAgencies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Building2, Mail, Phone, Globe, Edit, Trash2, Users } from 'lucide-react';
import { format } from 'date-fns';

interface AgencyFormData extends CreateAgencyData {}

export function AgencyManagement() {
  const { data: agencies = [], isLoading } = useAgencies();
  const createAgency = useCreateAgency();
  const updateAgency = useUpdateAgency();
  const deleteAgency = useDeleteAgency();
  
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [formData, setFormData] = useState<AgencyFormData>({
    name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      website: '',
      notes: '',
    });
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) return;
    
    await createAgency.mutateAsync(formData);
    setCreateOpen(false);
    resetForm();
  };

  const handleEdit = async () => {
    if (!editingAgency || !formData.name.trim()) return;
    
    await updateAgency.mutateAsync({
      id: editingAgency.id,
      ...formData,
    });
    setEditOpen(false);
    setEditingAgency(null);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteAgency.mutateAsync(id);
  };

  const openEditDialog = (agency: Agency) => {
    setEditingAgency(agency);
    setFormData({
      name: agency.name,
      contact_name: agency.contact_name || '',
      contact_email: agency.contact_email || '',
      contact_phone: agency.contact_phone || '',
      website: agency.website || '',
      notes: agency.notes || '',
    });
    setEditOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Agency Management</h2>
          <p className="text-muted-foreground">
            Manage your agency contacts and relationships
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Agency
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Agency</DialogTitle>
              <DialogDescription>
                Create a new agency contact with their details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Agency Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Creative Media Agency"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact_name">Contact Person</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                  placeholder="e.g., John Smith"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="e.g., john@agency.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                  placeholder="e.g., +1 (555) 123-4567"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="e.g., https://agency.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this agency..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCreateOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!formData.name.trim() || createAgency.isPending}
              >
                {createAgency.isPending ? 'Creating...' : 'Create Agency'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Agencies List */}
      {agencies.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No agencies yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by adding your first agency contact.
            </p>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Agency
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agencies.map((agency) => (
            <Card key={agency.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">{agency.name}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(agency)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Agency</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{agency.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(agency.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {agency.contact_name && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{agency.contact_name}</span>
                  </div>
                )}
                {agency.contact_email && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={`mailto:${agency.contact_email}`} 
                      className="text-primary hover:underline"
                    >
                      {agency.contact_email}
                    </a>
                  </div>
                )}
                {agency.contact_phone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={`tel:${agency.contact_phone}`} 
                      className="text-primary hover:underline"
                    >
                      {agency.contact_phone}
                    </a>
                  </div>
                )}
                {agency.website && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={agency.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {agency.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {agency.notes && (
                  <div className="text-sm text-muted-foreground mt-3 pt-3 border-t">
                    <p className="line-clamp-2">{agency.notes}</p>
                  </div>
                )}
                <div className="text-xs text-muted-foreground pt-2">
                  Added {format(new Date(agency.created_at), 'MMM d, yyyy')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Agency</DialogTitle>
            <DialogDescription>
              Update the agency details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Agency Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Creative Media Agency"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-contact_name">Contact Person</Label>
              <Input
                id="edit-contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                placeholder="e.g., John Smith"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-contact_email">Contact Email</Label>
              <Input
                id="edit-contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                placeholder="e.g., john@agency.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-contact_phone">Contact Phone</Label>
              <Input
                id="edit-contact_phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                placeholder="e.g., +1 (555) 123-4567"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-website">Website</Label>
              <Input
                id="edit-website"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="e.g., https://agency.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this agency..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditOpen(false);
                setEditingAgency(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!formData.name.trim() || updateAgency.isPending}
            >
              {updateAgency.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}