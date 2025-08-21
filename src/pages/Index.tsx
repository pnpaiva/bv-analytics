import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Users, Shield, Target, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <img src="/lovable-uploads/4add0e07-79ba-4808-834f-029555e0d6f7.png" alt="BV Analytics" className="h-12 w-12 mr-4" />
            <h1 className="text-4xl font-bold">BV Analytics</h1>
          </div>
          <div className="bg-card border rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Internal Analytics Platform</h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-3xl mx-auto">
              Welcome to Beyond Views Analytics - our comprehensive internal tool for managing influencer marketing campaigns. 
              This platform allows you to track performance across YouTube, Instagram, and TikTok, manage creator relationships, 
              and generate detailed analytics reports for our clients.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto mb-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">What You Can Do:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Create and manage marketing campaigns
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Organize creator rosters and client relationships
                  </li>
                  <li className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Track real-time analytics across all platforms
                  </li>
                  <li className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    Generate comprehensive performance reports
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Access Levels:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span><strong>Admin:</strong> Full system access and user management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span><strong>Client:</strong> View assigned campaigns and analytics</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="text-lg px-8 py-6"
          >
            Log In to Platform
          </Button>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 rounded-lg border bg-card">
            <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Campaign Management</h3>
            <p className="text-muted-foreground">
              Create, organize, and track influencer marketing campaigns with detailed analytics and performance metrics.
            </p>
          </div>
          
          <div className="text-center p-6 rounded-lg border bg-card">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Creator & Client Management</h3>
            <p className="text-muted-foreground">
              Maintain comprehensive databases of creators and clients with detailed performance history and contact information.
            </p>
          </div>
          
          <div className="text-center p-6 rounded-lg border bg-card">
            <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Analytics & Reporting</h3>
            <p className="text-muted-foreground">
              Generate comprehensive reports with real-time data visualization and performance insights across all platforms.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Index;
