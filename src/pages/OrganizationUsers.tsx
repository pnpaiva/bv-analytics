import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, UserPlus, Users, Trash2, Edit, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useUserPermissions, useCreateUserAccount, useClientAccounts, AppRole } from '@/hooks/useUserRoles';
import { useDeleteOrganizationMember } from '@/hooks/useOrganizationManagement';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
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
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

interface CreateUserFormData {
  email: string;
  password: string;
  role: AppRole;
  isViewOnly: boolean;
}

const OrganizationUsers = () => {
  const { isLocalAdmin, isMasterAdmin, canManageUsers, organization } = useUserPermissions();
  const { data: users = [], isLoading } = useClientAccounts();
  const createUser = useCreateUserAccount();
  const deleteOrganizationMember = useDeleteOrganizationMember();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState<CreateUserFormData>({
    email: '',
    password: '',
    role: 'local_client',
    isViewOnly: false
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await createUser.mutateAsync({
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        isViewOnly: formData.isViewOnly,
      });
      
      setIsCreateDialogOpen(false);
      setFormData({
        email: '',
        password: '',
        role: 'local_client',
        isViewOnly: false
      });
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  // Generate a random password
  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData({ ...formData, password });
  };

  const handleDeleteUser = (user: any) => {
    // Local admins cannot delete master admins
    if (isLocalAdmin && user.role === 'master_admin') {
      toast.error('You cannot delete master administrators');
      return;
    }
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await deleteOrganizationMember.mutateAsync(selectedUser.user_id);
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleEditUser = (user: any) => {
    // For now, we'll just show a message that editing is not yet implemented
    toast.error('User editing is not yet implemented');
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'master_admin': return 'Master Admin';
      case 'local_admin': return 'Local Admin';
      case 'local_client': return 'Local Client';
      case 'admin': return 'Admin';
      case 'client': return 'Client';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'master_admin': return 'destructive';
      case 'local_admin': return 'default';
      case 'local_client': return 'secondary';
      default: return 'outline';
    }
  };

  if (!canManageUsers) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to manage users.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {isMasterAdmin ? 'Global User Management' : 'Organization Users'}
            </h1>
            <p className="text-muted-foreground">
              {isMasterAdmin 
                ? 'Manage users across all organizations' 
                : `Manage users in ${organization?.name || 'your organization'}`
              }
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <form onSubmit={handleCreateUser}>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user to {isMasterAdmin ? 'the system' : 'your organization'}.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generatePassword}
                      >
                        Generate
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value: AppRole) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {isMasterAdmin && (
                          <>
                            <SelectItem value="master_admin">Master Admin</SelectItem>
                            <SelectItem value="local_admin">Local Admin</SelectItem>
                          </>
                        )}
                        {isLocalAdmin && (
                          <SelectItem value="local_admin">Local Admin</SelectItem>
                        )}
                        <SelectItem value="local_client">Local Client</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.role === 'local_client' && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isViewOnly"
                        checked={formData.isViewOnly}
                        onChange={(e) => setFormData({ ...formData, isViewOnly: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="isViewOnly" className="text-sm">
                        View-only access (cannot create or edit)
                      </Label>
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createUser.isPending}
                  >
                    {createUser.isPending ? 'Creating...' : 'Create User'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users
            </CardTitle>
            <CardDescription>
              {isMasterAdmin ? 'All users in the system' : 'Users in your organization'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No users found</p>
                <p className="text-sm text-muted-foreground">Add your first user to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    {isMasterAdmin && <TableHead>Organization</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.user?.email || user.user_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                        {user.is_view_only && (
                          <Badge variant="outline" className="ml-1">View Only</Badge>
                        )}
                      </TableCell>
                      {isMasterAdmin && (
                        <TableCell>
                          {user.organization?.name || 'N/A'}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant="secondary">Active</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-destructive"
                            onClick={() => handleDeleteUser(user)}
                            disabled={isLocalAdmin && user.role === 'master_admin'}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Delete User
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{selectedUser?.user?.email}</strong>? 
                This action cannot be undone and will remove the user from the organization.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteUser}
                className="bg-destructive hover:bg-destructive/90"
                disabled={deleteOrganizationMember.isPending}
              >
                {deleteOrganizationMember.isPending ? 'Deleting...' : 'Delete User'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default OrganizationUsers;