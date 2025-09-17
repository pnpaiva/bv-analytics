import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Organization } from '@/hooks/useOrganizationManagement';
import { toast } from 'sonner';

interface EditOrganizationDialogProps {
  organization: Organization | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { id: string; name: string; slug: string }) => Promise<void>;
}

export function EditOrganizationDialog({ 
  organization, 
  isOpen, 
  onClose, 
  onSave 
}: EditOrganizationDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Update form data when organization changes
  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
        slug: organization.slug
      });
    }
  }, [organization]);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setFormData({ name, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!organization || !formData.name.trim() || !formData.slug.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        id: organization.id,
        name: formData.name.trim(),
        slug: formData.slug.trim()
      });
      onClose();
    } catch (error) {
      console.error('Error updating organization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', slug: '' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              Update the organization details below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Organization Name</Label>
              <Input
                id="edit-name"
                placeholder="Enter organization name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-slug">URL Slug</Label>
              <Input
                id="edit-slug"
                placeholder="organization-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                This will be used in URLs and must be unique
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.name.trim() || !formData.slug.trim()}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
