import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectManagementMain } from '@/components/campaigns/ProjectManagementMain';
import { useUserPermissions } from '@/hooks/useUserRoles';
import { useOrganizations } from '@/hooks/useOrganizationManagement';
import { useOrganizationContext } from '@/hooks/useOrganizationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX } from 'lucide-react';
import Campaigns from './Campaigns';

export default function ProjectManagement() {
  const { organization, isMasterAdmin } = useUserPermissions();
  const { data: organizations = [] } = useOrganizations();
  const { selectedOrganizationId } = useOrganizationContext();

  // Determine the current organization to check
  const currentOrgId = isMasterAdmin ? selectedOrganizationId : organization?.id;
  const currentOrg = organizations.find(org => org.id === currentOrgId);
  
  // Check if project management is enabled for the current organization
  const isProjectManagementEnabled = currentOrg?.settings?.project_management_enabled !== false;

  if (!isProjectManagementEnabled) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto p-6">
          <Card className="max-w-md mx-auto mt-20">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <ShieldX className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Feature Not Available</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Project Management is not enabled for this organization. 
                Contact your administrator to enable this feature.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Project Management</h1>
            <p className="text-muted-foreground">
              Manage campaigns, track creator progress, and monitor project timelines
            </p>
          </div>
        </div>

        <ProjectManagementMain />
      </div>
    </div>
  );
}