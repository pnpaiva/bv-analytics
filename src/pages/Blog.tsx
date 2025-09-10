import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePublishedBlogPosts } from '@/hooks/useBlogPosts';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default function Blog() {
  const { data: blogPosts = [], isLoading } = usePublishedBlogPosts();

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center">
          <p>Loading blog posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Our <span className="text-primary">Blog</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Insights, tips, and stories from the world of influencer marketing and creator economy.
          </p>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          {blogPosts.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-4">No Posts Yet</h2>
              <p className="text-muted-foreground">
                We're working on some great content. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow">
                  <Link to={`/blog/${post.slug}`}>
                    {post.banner_image_url && (
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img
                          src={post.banner_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(post.published_at!), 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {Math.ceil(post.content.replace(/<[^>]*>/g, '').split(' ').length / 200)} min read
                        </div>
                      </div>
                      <h2 className="text-xl font-semibold line-clamp-2 hover:text-primary transition-colors">
                        {post.title}
                      </h2>
                    </CardHeader>
                    <CardContent>
                      {post.excerpt && (
                        <p className="text-muted-foreground line-clamp-3 mb-4">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-medium flex items-center gap-1">
                          Read more <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}