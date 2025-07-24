import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Mail, Calendar, Clock, Shield } from 'lucide-react';
import { useCreateUserAccount, useClientAccounts, useIsAdmin } from '@/hooks/useUserRoles';
import { format } from 'date-fns';
import { toast } from 'sonner';
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
import { AppRole } from '@/hooks/useUserRoles';

export default function AdminDashboard() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    role: 'client' as AppRole,
  });
  
  const isAdmin = useIsAdmin();
  const { data: clientAccounts = [], isLoading } = useClientAccounts();
  const createUserMutation = useCreateUserAccount();
  
  // Quick create admin account function
  const createAdminAccount = async () => {
    try {
      await createUserMutation.mutateAsync({
        email: 'admin@beyond-views.com',
        password: 'Nense123nense!',
        role: 'admin',
      });
      toast.success('Admin account created successfully! You can now sign in with admin@beyond-views.com');
    } catch (error) {
      console.error('Error creating admin account:', error);
    }
  };
  
  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="text-center py-8">
              <div className="space-y-4">
                <h3 className="text-lg font-medium mb-2">Access Denied</h3>
                <p className="text-muted-foreground">
                  You don't have permission to access the admin dashboard.
                </p>
                <div className="mt-6">
                  <Button onClick={createAdminAccount} className="mr-4">
                    <Shield className="w-4 h-4 mr-2" />
                    Create Admin Account
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    This will create admin@beyond-views.com for administrative access
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  const handleCreateUser = async () => {
    if (!newUserData.email || !newUserData.password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (newUserData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      await createUserMutation.mutateAsync({
        email: newUserData.email,
        password: newUserData.password,
        role: newUserData.role,
      });
      
      setNewUserData({ email: '', password: '', role: 'client' });
      setIsCreateDialogOpen(false);
    } catch (error) {
      // Error is already handled in the mutation
    }
  };
  
  const allAccounts = clientAccounts.filter(account => account.role === 'client');
  const adminAccounts = clientAccounts.filter(account => account.role === 'admin');
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading admin dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage user accounts and system settings
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={createAdminAccount} variant="outline">
              <Shield className="w-4 h-4 mr-2" />
              Create Admin Account
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create User Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User Account</DialogTitle>
                  <DialogDescription>
                    Create a new user account with specified role and access level.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={newUserData.password}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={newUserData.role} onValueChange={(value: AppRole) => setNewUserData(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateUser}
                    disabled={createUserMutation.isPending}
                  >
                    {createUserMutation.isPending ? 'Creating...' : 'Create Account'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allAccounts.length}</div>
              <p className="text-xs text-muted-foreground">
                Active client accounts
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Accounts</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminAccounts.length}</div>
              <p className="text-xs text-muted-foreground">
                Administrative accounts
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Signups</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clientAccounts.filter(account => {
                  const createdAt = new Date(account.created_at);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return createdAt > weekAgo;
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                In the last 7 days
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clientAccounts.filter(account => {
                  if (!account.user?.last_sign_in_at) return false;
                  const lastSignIn = new Date(account.user.last_sign_in_at);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return lastSignIn > today;
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Signed in today
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* User Accounts List */}
        <div className="space-y-6">
          {/* Admin Accounts */}
          {adminAccounts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Admin Accounts
                </CardTitle>
                <CardDescription>
                  Administrative accounts with full system access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adminAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-primary/5"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                          <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{account.user?.email}</h4>
                          <p className="text-sm text-muted-foreground">
                            Created {format(new Date(account.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="default">Admin</Badge>
                        {account.user?.last_sign_in_at && (
                          <span className="text-sm text-muted-foreground">
                            Last active: {format(new Date(account.user.last_sign_in_at), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Client Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Client Accounts
              </CardTitle>
              <CardDescription>
                Client accounts with isolated data access
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allAccounts.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No client accounts yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first client account to get started.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Client
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {allAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{account.user?.email}</h4>
                          <p className="text-sm text-muted-foreground">
                            Created {format(new Date(account.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">Client</Badge>
                        {account.user?.last_sign_in_at && (
                          <span className="text-sm text-muted-foreground">
                            Last active: {format(new Date(account.user.last_sign_in_at), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}