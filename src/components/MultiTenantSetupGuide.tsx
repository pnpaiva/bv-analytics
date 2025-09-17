import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Users, 
  Shield, 
  CheckCircle,
  ArrowRight,
  Crown,
  Settings,
  UserPlus
} from 'lucide-react';
import { useUserPermissions } from '@/hooks/useUserRoles';
import { Link } from 'react-router-dom';

export function MultiTenantSetupGuide() {
  const { isMasterAdmin, isLocalAdmin, isLocalClient, organization } = useUserPermissions();

  const features = [
    {
      icon: Building2,
      title: 'Organization Isolation',
      description: 'Each organization has its own data, users, and campaigns - completely isolated from others.'
    },
    {
      icon: Shield,
      title: 'Role-Based Access',
      description: 'Three-tier hierarchy: Master Admin → Local Admin → Local Client with appropriate permissions.'
    },
    {
      icon: Users,
      title: 'User Management',
      description: 'Local admins can manage their organization users, while master admins control everything.'
    }
  ];

  const roleGuide = {
    master_admin: {
      icon: Crown,
      title: 'Master Administrator',
      description: 'You have full system access across all organizations.',
      capabilities: [
        'Create and manage organizations',
        'Assign local administrators',
        'View all data across organizations',
        'System-wide configuration'
      ],
      nextSteps: [
        { action: 'Create Organizations', link: '/organizations', icon: Building2 },
        { action: 'Manage Users', link: '/organization-users', icon: UserPlus }
      ]
    },
    local_admin: {
      icon: Settings,
      title: 'Local Administrator',
      description: `You manage ${organization?.name || 'your organization'}.`,
      capabilities: [
        'Manage users in your organization',
        'View all campaigns in your organization',
        'Create and edit campaigns',
        'Assign campaigns to clients'
      ],
      nextSteps: [
        { action: 'Add Team Members', link: '/organization-users', icon: UserPlus },
        { action: 'View Dashboard', link: '/admin', icon: Settings }
      ]
    },
    local_client: {
      icon: Users,
      title: 'Client',
      description: 'You have access to campaigns assigned to you.',
      capabilities: [
        'View assigned campaigns',
        'Access campaign analytics',
        'Export reports for your campaigns',
        'View creator profiles'
      ],
      nextSteps: [
        { action: 'View My Campaigns', link: '/campaigns', icon: Shield },
        { action: 'Analytics Dashboard', link: '/analytics', icon: Shield }
      ]
    }
  };

  const currentRole = isMasterAdmin ? 'master_admin' : isLocalAdmin ? 'local_admin' : 'local_client';
  const roleData = roleGuide[currentRole];

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <roleData.icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Welcome to the Multi-Tenant System</CardTitle>
              <CardDescription>
                You're logged in as: <Badge className="ml-1">{roleData.title}</Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{roleData.description}</p>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            {roleData.nextSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Link key={index} to={step.link}>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {step.action}
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <Icon className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Role Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Your Capabilities
          </CardTitle>
          <CardDescription>
            What you can do with your current role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roleData.capabilities.map((capability, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">{capability}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}