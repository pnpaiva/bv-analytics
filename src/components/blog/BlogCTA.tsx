import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TrendingUp, Users, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function BlogCTA() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Check if email already exists
      const { data: existingEmail } = await supabase
        .from('waitlist')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (existingEmail) {
        toast.info("You're already on our waitlist!");
        setEmail('');
        setIsSubmitting(false);
        return;
      }

      // Insert new email into waitlist
      const { error } = await supabase
        .from('waitlist')
        .insert({
          email: email,
          source: 'blog_cta',
          status: 'pending'
        });

      if (error) {
        throw error;
      }
      
      toast.success("Successfully joined the waitlist! We'll notify you when we launch.");
      setEmail('');
    } catch (error) {
      console.error('Waitlist signup error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="my-16 px-4">
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-primary/20">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 p-8 md:p-12 text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
            🚀 Join the Revolution
          </Badge>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Ready to Transform Your Creator Analytics?
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of agencies and talent managers who are getting early access to Beyond Views. 
            Be among the first to experience the future of creator analytics.
          </p>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center justify-center gap-3 p-4 bg-background/50 rounded-lg border border-primary/10">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium">Real-time Analytics</span>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 bg-background/50 rounded-lg border border-primary/10">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium">Multi-platform Data</span>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 bg-background/50 rounded-lg border border-primary/10">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium">Automated Reports</span>
            </div>
          </div>

          {/* Waitlist Form */}
          <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-lg mx-auto">
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-12 text-base px-4 border-2 border-primary/30 hover:border-primary/60 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-background/80"
              required
            />
            <Button 
              type="submit" 
              disabled={isSubmitting}
              size="lg"
              className="bg-primary hover:bg-primary/90 px-8 h-12 font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group w-full sm:w-auto"
            >
              {isSubmitting ? "Joining..." : "Get Early Access"}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <p className="text-sm text-muted-foreground mt-4">
            Join 10,000+ professionals already on the waitlist. No spam, just updates.
          </p>
        </div>
      </Card>
    </div>
  );
}