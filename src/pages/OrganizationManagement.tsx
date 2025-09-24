import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, Users, Settings, Trash2, Edit, TrendingUp, Eye, DollarSign, Activity, Shield } from 'lucide-react';
import { useOrganizations, useCreateOrganization, useUpdateOrganization, useDeleteOrganization, Organization } from '@/hooks/useOrganizationManagement';
import { useUserPermissions } from '@/hooks/useUserRoles';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useAllOrganizationsAnalytics } from '@/hooks/useOrganizationAnalytics';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EditOrganizationDialog } from '@/components/organization/EditOrganizationDialog';
import { OrganizationUserManagementDialog } from '@/components/organization/OrganizationUserManagementDialog';
import { toast } from 'sonner';

interface CreateOrgFormData {
  name: string;
  slug: string;
}

const OrganizationManagement = () => {
  const { isMasterAdmin } = useUserPermissions();
  const { data: organizations = [], isLoading } = useOrganizations();
  const { data: organizationsAnalytics = {} } = useAllOrganizationsAnalytics();
  const createOrganization = useCreateOrganization();
  const updateOrganization = useUpdateOrganization();
  const deleteOrganization = useDeleteOrganization();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUserManagementDialogOpen, setIsUserManagementDialogOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [formData, setFormData] = useState<CreateOrgFormData>({
    name: '',
    slug: ''
  });

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setFormData({ name, slug });
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await createOrganization.mutateAsync({
        name: formData.name.trim(),
        slug: formData.slug.trim(),
      });
      
      setIsCreateDialogOpen(false);
      setFormData({ name: '', slug: '' });
    } catch (error) {
      console.error('Error creating organization:', error);
    }
  };

  const handleEditOrganization = (organization: Organization) => {
    setSelectedOrganization(organization);
    setIsEditDialogOpen(true);
  };

  const handleManageUsers = (organization: Organization) => {
    setSelectedOrganization(organization);
    setIsUserManagementDialogOpen(true);
  };

  const handleUpdateOrganization = async (data: { id: string; name: string; slug: string; project_management_enabled: boolean }) => {
    await updateOrganization.mutateAsync(data);
  };

  const handleDeleteOrganization = async (organization: Organization) => {
    if (!confirm(`Are you sure you want to delete "${organization.name}"? This action cannot be undone and will remove all associated data.`)) {
      return;
    }

    try {
      await deleteOrganization.mutateAsync(organization.id);
    } catch (error) {
      console.error('Error deleting organization:', error);
    }
  };

  const handleCloseDialogs = () => {
    setIsEditDialogOpen(false);
    setIsUserManagementDialogOpen(false);
    setSelectedOrganization(null);
  };

  if (!isMasterAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
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
              Organization Management
            </h1>
            <p className="text-muted-foreground">
              Manage organizations and their administrators
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Organization
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateOrganization}>
                <DialogHeader>
                  <DialogTitle>Create New Organization</DialogTitle>
                  <DialogDescription>
                    Create a new organization to manage teams and clients separately.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter organization name"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
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
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createOrganization.isPending}
                  >
                    {createOrganization.isPending ? 'Creating...' : 'Create Organization'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Organizations List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Organizations
            </CardTitle>
            <CardDescription>
              All organizations in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading organizations...</p>
              </div>
            ) : organizations.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No organizations found</p>
                <p className="text-sm text-muted-foreground">Create your first organization to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Analytics</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => {
                    const analytics = organizationsAnalytics[org.id];
                    
                    return (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{org.name}</div>
                          <div className="text-sm text-muted-foreground">
                            <code className="bg-muted px-1 py-0.5 rounded text-xs">
                              {org.slug}
                            </code>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                         {analytics ? (
                           <div className="grid grid-cols-2 gap-2 text-xs">
                             <div className="flex items-center gap-1">
                               <Activity className="w-3 h-3 text-blue-500" />
                               <span>{analytics.totalCampaigns} campaigns</span>
                             </div>
                             <div className="flex items-center gap-1">
                               <Eye className="w-3 h-3 text-green-500" />
                               <span>{analytics.totalViews.toLocaleString()} views</span>
                             </div>
                             <div className="flex items-center gap-1">
                               <TrendingUp className="w-3 h-3 text-purple-500" />
                               <span>{analytics.avgEngagementRate.toFixed(1)}% eng.</span>
                             </div>
                             <div className="flex flex-col gap-1">
                               <div className="flex items-center gap-1">
                                 <DollarSign className="w-3 h-3 text-green-600" />
                                 <span>F: ${(analytics.totalFixedDealValue || 0).toLocaleString()}</span>
                               </div>
                               <div className="flex items-center gap-1">
                                 <DollarSign className="w-3 h-3 text-orange-500" />
                                 <span>V: ${(analytics.totalVariableDealValue || 0).toLocaleString()}</span>
                               </div>
                             </div>
                           </div>
                         ) : (
                           <div className="text-xs text-muted-foreground">Loading...</div>
                         )}
                      </TableCell>
                      <TableCell>
                        {analytics ? (
                          <div className="text-xs">
                            <div>{analytics.totalUsers} total</div>
                            <div className="text-muted-foreground">
                              {analytics.totalCreators} creators • {analytics.totalClients} clients
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">Loading...</div>
                        )}
                       </TableCell>
                       <TableCell>
                         <div className="flex items-center gap-2">
                           <div className="flex items-center gap-1">
                             <Shield className="w-3 h-3" />
                             <span className="text-xs">
                               {org.settings?.project_management_enabled !== false ? 'PM' : 'No PM'}
                             </span>
                           </div>
                         </div>
                       </TableCell>
                       <TableCell>
                         {new Date(org.created_at).toLocaleDateString()}
                       </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Active</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditOrganization(org)}
                            title="Edit Organization"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleManageUsers(org)}
                            title="Manage Users"
                          >
                            <Users className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteOrganization(org)}
                            title="Delete Organization"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Organization Dialog */}
      <EditOrganizationDialog
        organization={selectedOrganization}
        isOpen={isEditDialogOpen}
        onClose={handleCloseDialogs}
        onSave={handleUpdateOrganization}
      />

      {/* Organization User Management Dialog */}
      <OrganizationUserManagementDialog
        organization={selectedOrganization}
        isOpen={isUserManagementDialogOpen}
        onClose={handleCloseDialogs}
      />
    </div>
  );
};

export default OrganizationManagement;