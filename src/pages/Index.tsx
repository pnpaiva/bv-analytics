import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Users, Zap } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/campaigns');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <BarChart3 className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-4xl font-bold">Campaign Analytics Platform</h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Track, analyze, and optimize your influencer marketing campaigns across YouTube, Instagram, and TikTok with real-time analytics and insights.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="text-lg px-8 py-6"
          >
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 rounded-lg border bg-card">
            <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Real-time Analytics</h3>
            <p className="text-muted-foreground">
              Get instant insights into your campaign performance with live data from all major social platforms.
            </p>
          </div>
          
          <div className="text-center p-6 rounded-lg border bg-card">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Multi-Platform Support</h3>
            <p className="text-muted-foreground">
              Track campaigns across YouTube, Instagram, and TikTok from a single, unified dashboard.
            </p>
          </div>
          
          <div className="text-center p-6 rounded-lg border bg-card">
            <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Advanced Insights</h3>
            <p className="text-muted-foreground">
              Discover engagement patterns, ROI metrics, and actionable insights to optimize your campaigns.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-primary/5 rounded-lg p-8 border">
          <h2 className="text-2xl font-bold mb-4">Ready to supercharge your campaigns?</h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of marketers who trust our platform for their influencer marketing analytics.
          </p>
          <Button 
            onClick={() => navigate('/auth')}
            className="mr-4"
          >
            Sign Up Free
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/auth')}
          >
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
