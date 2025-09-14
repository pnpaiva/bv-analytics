import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function PublicNavigation() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/f09b0589-e884-4eae-8a49-fe79fd9c060a.png" 
              alt="Beyond Views" 
              className="w-10 h-10 rounded-lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Beyond Views</h1>
              <p className="text-sm text-muted-foreground">Analytics Platform</p>
            </div>
          </Link>
          
          {/* Navigation Actions */}
          <div className="flex items-center gap-3">
            <Link to="/blog">
              <Button 
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                Blog
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-primary hover:bg-primary/90">
                Log In to Platform
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}