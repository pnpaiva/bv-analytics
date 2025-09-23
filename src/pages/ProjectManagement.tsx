import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectManagementMain } from '@/components/campaigns/ProjectManagementMain';
import Campaigns from './Campaigns';

export default function ProjectManagement() {
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

        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="projects">Project Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaign Support</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-4">
            <ProjectManagementMain />
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <Campaigns />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}