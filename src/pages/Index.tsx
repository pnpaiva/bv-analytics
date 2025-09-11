import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  Database, 
  Zap, 
  Shield, 
  Globe,
  ArrowRight,
  Instagram,
  Youtube,
  Building2,
  UserCheck,
  BarChart4,
  FileText,
  Clock,
  Play
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CreateAdminAccount } from '@/components/CreateAdminAccount';

const Index = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);


  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Temporarily commented out waitlist functionality due to type issues
      // TODO: Fix waitlist table types
      /*
      // Check if email already exists in Supabase
      const { data: existingEmail } = await supabase
        .from('waitlist')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (existingEmail) {
        toast.info('You\'re already on our waitlist!');
        setEmail('');
        setIsSubmitting(false);
        return;
      }

      // Insert new email into Supabase waitlist table
      const { error } = await supabase
        .from('waitlist')
        .insert({
          email: email,
          source: 'landing_page',
          status: 'pending'
        });
      */
      
      const error = null; // Temporary fix

      if (error) {
        throw error;
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Successfully joined the waitlist! We\'ll notify you when we launch.');
      setEmail('');
    } catch (error) {
      console.error('Waitlist signup error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: BarChart3,
      title: "Finally, All Your Data in One Place",
      description: "Imagine waking up to a single dashboard that shows you exactly how your creators are performing across YouTube, Instagram, and TikTok. No more switching between platforms, no more missing data, no more headaches.",
      gif: "https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif"
    },
    {
      icon: Users,
      title: "Know Your Creators Like Never Before",
      description: "Every creator has a story, and now you can tell it. See their growth trajectory, understand their audience, and make data-driven decisions about who to work with and when.",
      gif: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif"
    },
    {
      icon: Target,
      title: "Campaigns That Actually Work",
      description: "Stop guessing what will resonate. Our AI analyzes patterns across thousands of successful campaigns to help you create content strategies that drive real results for your clients.",
      gif: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif"
    },
    {
      icon: Building2,
      title: "Clients Who Actually Trust You",
      description: "Give your clients the transparency they crave with beautiful, real-time dashboards. Show them exactly where their investment is going and why it's working.",
      gif: "https://media.giphy.com/media/3o7TKSjR3gPFN1dkxi/giphy.gif"
    },
    {
      icon: FileText,
      title: "Reports That Write Themselves",
      description: "Remember those Sunday nights spent formatting reports? Those are over. Generate stunning, branded reports in minutes, not hours. Your clients will be impressed, and you'll have your life back.",
      gif: "https://media.giphy.com/media/3o7TKSjR3gPFN1dkxi/giphy.gif"
    },
    {
      icon: Zap,
      title: "Never Miss a Moment Again",
      description: "Get instant alerts when your creators go viral, when engagement spikes, or when campaigns hit milestones. Be the first to know, and the first to capitalize on success.",
      gif: "https://media.giphy.com/media/3o7TKSjR3gPFN1dkxi/giphy.gif"
    }
  ];

  const painPoints = [
    {
      title: "Drowning in Spreadsheets",
      description: "Every morning, you wake up to the same nightmare: 15 different tabs open, trying to piece together creator performance from YouTube, Instagram, and TikTok. Hours slip away as you manually copy-paste data, knowing there has to be a better way.",
      icon: Globe
    },
    {
      title: "Flying Blind with Campaigns",
      description: "Your campaigns are running across multiple platforms, but you're making decisions based on gut feelings and outdated metrics. You know the last campaign performed well, but you can't tell your client exactly why or how it compares to previous campaigns across all platforms.",
      icon: UserCheck
    },
    {
      title: "Reports Are Your Nightmare",
      description: "It's 11 PM on Sunday, and you're still formatting another client report. The same data, the same charts, the same hours of work that could be spent on strategy. Your clients deserve better insights, and you deserve your weekends back.",
      icon: FileText
    },
    {
      title: "Always One Step Behind",
      description: "While you're busy compiling last week's data, opportunities are slipping through your fingers. A creator's viral moment happens, but you only discover it days later. Your competitors are moving faster, and you're stuck in the past.",
      icon: Clock
    }
  ];


  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/f09b0589-e884-4eae-8a49-fe79fd9c060a.png" 
                alt="Beyond Views" 
                className="w-10 h-10 rounded-lg"
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Beyond Views</h1>
                <p className="text-sm text-muted-foreground">Analytics Platform</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-primary hover:bg-primary/90"
            >
              Log In to Platform
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
          </div>

        <div className="container mx-auto text-center max-w-6xl relative z-10">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-all duration-300">
            🚀 Coming Soon - Join the Waitlist
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent animate-fade-in leading-tight">
            The Future of Creator Analytics
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed animate-fade-in-up px-4">
            Stop juggling multiple platforms. Beyond Views unifies creator performance data across 
            <span className="font-semibold text-foreground bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent"> YouTube, Instagram, and TikTok</span> into one powerful analytics platform 
            built for agencies and talent managers.
          </p>

          {/* Waitlist Form - Positioned right after hero text */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-fade-in-up delay-200 px-4">
            <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-12 sm:h-14 text-base sm:text-lg px-4 sm:px-6 border-2 border-primary/30 hover:border-primary/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-lg hover:shadow-xl bg-background/50 backdrop-blur-sm"
                required
              />
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 px-6 sm:px-8 h-12 sm:h-14 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 w-full sm:w-auto"
              >
                {isSubmitting ? "Joining..." : "Join Waitlist"}
              </Button>
            </form>
          </div>

          {/* Hero Illustration */}
          <div className="relative mb-12 animate-fade-in-up delay-300">
            <div className="relative mx-auto max-w-4xl">
              {/* Main Dashboard Mockup */}
              <div className="relative bg-gradient-to-br from-card to-card/50 rounded-2xl p-8 shadow-2xl border border-border/50 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-4 sm:gap-6 mb-8">
                  {/* Platform Icons - Smaller and more subtle */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Youtube className="h-4 w-4 text-red-500" />
                    <span className="text-xs sm:text-sm font-medium">YouTube</span>
                  </div>
                  <div className="w-px h-4 bg-muted-foreground/30"></div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Instagram className="h-4 w-4 text-pink-500" />
                    <span className="text-xs sm:text-sm font-medium">Instagram</span>
                  </div>
                  <div className="w-px h-4 bg-muted-foreground/30"></div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    <span className="text-xs sm:text-sm font-medium">TikTok</span>
                  </div>
                </div>
                
                {/* Sneak Peek Introduction */}
                <div className="text-center mb-6">
                  <p className="text-sm sm:text-base text-muted-foreground italic">
                    Here's a sneak peek into what you'll experience with Beyond Views
                  </p>
                </div>
                
                {/* Platform Demo Video/GIF */}
                <div className="bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-2xl p-6 sm:p-8 border-2 border-primary/30 shadow-2xl">
                  <div className="aspect-video bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl overflow-hidden flex items-center justify-center border border-primary/20">
                    {/* Replace this with your actual video/GIF */}
                    <div className="text-center p-6">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center mb-4 sm:mb-6 mx-auto shadow-lg">
                        <Play className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                      </div>
                      <p className="text-muted-foreground text-sm sm:text-base font-medium">
                        Add your platform demo video/GIF here
                      </p>
                    </div>
                  </div>
              </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/20 rounded-full blur-sm animate-float"></div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-blue-500/20 rounded-full blur-sm animate-float delay-1000"></div>
            </div>
          </div>


        </div>
      </section>

      {/* Pain Points Section */}
      <section className="relative py-20 px-4 bg-slate-50 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12 sm:mb-16 px-4">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              We Know Your Daily Struggle
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              You didn't get into this business to spend your days drowning in spreadsheets and chasing down data. 
              You're here to build relationships, create amazing campaigns, and help your clients succeed. 
              Let us handle the rest.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 px-4">
            {painPoints.map((point, index) => {
              const Icon = point.icon;
              return (
                <Card 
                  key={index} 
                  className="group p-4 sm:p-6 border-2 hover:border-destructive/30 transition-all duration-500 hover:shadow-xl hover:scale-105 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="p-3 sm:p-4 bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                      <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 group-hover:text-destructive transition-colors duration-300">
                        {point.title}
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{point.description}</p>
                    </div>
                  </div>
                  
                  {/* Animated underline */}
                  <div className="mt-3 sm:mt-4 h-0.5 bg-gradient-to-r from-destructive/20 to-transparent group-hover:from-destructive/60 transition-all duration-500"></div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4 bg-slate-50 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12 sm:mb-16 px-4">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Finally, a Platform That Gets It
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              We've been where you are. We know the late nights, the client calls, the pressure to deliver results. 
              That's why we built Beyond Views - to give you back your time, your sanity, and your competitive edge.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 px-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className="group p-4 sm:p-6 hover:shadow-2xl transition-all duration-500 hover:scale-105 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border-2 hover:border-primary/30 cursor-pointer flex flex-col h-full"
                  onClick={() => setSelectedFeature(feature)}
                >
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl w-fit mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4 flex-grow">{feature.description}</p>
                  
                  {/* Click indicator - positioned at bottom */}
                  <div className="mt-auto">
                    <div className="p-2 sm:p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20 group-hover:border-primary/40 group-hover:bg-gradient-to-r group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300">
                      <div className="flex items-center justify-center gap-1 sm:gap-2 text-primary font-semibold text-xs sm:text-sm">
                        <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Click to see it in action</span>
                        <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Animated accent line */}
                  <div className="h-1 bg-gradient-to-r from-primary/20 to-transparent group-hover:from-primary/60 transition-all duration-500 rounded-full mt-3 sm:mt-4"></div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature GIF Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">{selectedFeature.title}</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedFeature(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </Button>
            </div>
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <img 
                src={selectedFeature.gif} 
                alt={selectedFeature.title}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-muted-foreground mt-4 text-center">
              See how this feature works in practice
            </p>
          </div>
        </div>
      )}




      {/* Final CTA Section */}
      <section className="py-16 sm:py-20 px-4 bg-slate-50">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Transform Your Creator Management?</h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
            Join the waitlist and be among the first to experience the future of creator analytics.
          </p>

          <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-lg mx-auto">
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-12 sm:h-14 text-base sm:text-lg px-4 sm:px-6 border-2 border-primary/30 hover:border-primary/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 shadow-lg hover:shadow-xl bg-background/50 backdrop-blur-sm"
              required
            />
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 px-6 sm:px-8 h-12 sm:h-14 text-base sm:text-lg font-semibold w-full sm:w-auto"
            >
              {isSubmitting ? "Joining..." : "Join Waitlist"} 
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
            No spam, ever. Unsubscribe at any time.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img 
                src="/lovable-uploads/f09b0589-e884-4eae-8a49-fe79fd9c060a.png" 
                alt="Beyond Views" 
                className="w-8 h-8 rounded-lg"
              />
              <div>
                <h3 className="font-bold">Beyond Views</h3>
                <p className="text-sm text-muted-foreground">Analytics Platform</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 Beyond Views. All rights reserved.
            </div>
          </div>
      </div>
      </footer>

      {/* Emergency Admin Setup */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-background border-2 border-destructive rounded-lg shadow-lg p-4 max-w-sm">
          <div className="text-sm text-destructive font-medium mb-2">Database Recovery</div>
          <CreateAdminAccount />
        </div>
      </div>
    </div>
  );
};

export default Index;