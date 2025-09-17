import React, { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { Organization } from '@/hooks/useOrganizationManagement';
import { useOrganizationMembers, useCreateOrganizationMember, useDeleteOrganizationMember, useUserEmails } from '@/hooks/useOrganizationManagement';
import { toast } from 'sonner';

interface OrganizationUserManagementDialogProps {
  organization: Organization | null;
  isOpen: boolean;
  onClose: () => void;
}

interface CreateUserFormData {
  email: string;
  password: string;
  role: 'local_admin' | 'local_client';
}

export function OrganizationUserManagementDialog({ 
  organization, 
  isOpen, 
  onClose 
}: OrganizationUserManagementDialogProps) {
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [formData, setFormData] = useState<CreateUserFormData>({
    email: '',
    password: '',
    role: 'local_client'
  });

  const { data: members = [], isLoading, error } = useOrganizationMembers(organization?.id);
  const createMember = useCreateOrganizationMember();
  const deleteMember = useDeleteOrganizationMember();
  
  // Get user emails for display
  const userIds = members.map(m => m.user_id);
  const { data: userEmails = {} } = useUserEmails(userIds);

  // Debug logging
  React.useEffect(() => {
    console.log('OrganizationUserManagementDialog Debug:', {
      organizationId: organization?.id,
      members,
      isLoading,
      error,
      userIds,
      userEmails
    });
  }, [organization?.id, members, isLoading, error, userIds, userEmails]);
  

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!organization || !formData.email.trim() || !formData.password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await createMember.mutateAsync({
        ...formData,
        email: formData.email.trim(),
        password: formData.password.trim(),
        organizationId: organization.id
      });
      
      setFormData({ email: '', password: '', role: 'local_client' });
      setIsCreateFormOpen(false);
    } catch (error) {
      console.error('Error creating organization member:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteMember.mutateAsync(userId);
    } catch (error) {
      console.error('Error deleting organization member:', error);
    }
  };

  const handleClose = () => {
    setFormData({ email: '', password: '', role: 'local_client' });
    setIsCreateFormOpen(false);
    onClose();
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'local_admin':
        return 'default';
      case 'local_client':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'local_admin':
        return 'Local Admin';
      case 'local_client':
        return 'Local Client';
      default:
        return role;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Manage {organization?.name} Users
          </DialogTitle>
          <DialogDescription>
            Add local administrators and client accounts for this organization.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add User Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Organization Members</h3>
            <Button 
              onClick={() => setIsCreateFormOpen(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add User
            </Button>
          </div>

          {/* Create User Form */}
          {isCreateFormOpen && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
              <h4 className="font-medium">Add New User</h4>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value: 'local_admin' | 'local_client') => 
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local_admin">Local Admin</SelectItem>
                      <SelectItem value="local_client">Local Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={createMember.isPending || !formData.email.trim() || !formData.password.trim()}
                    size="sm"
                  >
                    {createMember.isPending ? 'Creating...' : 'Create User'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateFormOpen(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Users List */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-destructive">Error loading users</p>
                <p className="text-sm text-muted-foreground">{error.message}</p>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No users found</p>
                <p className="text-sm text-muted-foreground">Add users to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{userEmails[member.user_id] || `User ${member.user_id.slice(0, 8)}...`}</p>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(member.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {getRoleDisplayName(member.role)}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteUser(member.user_id)}
                        disabled={deleteMember.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
