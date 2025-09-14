import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePublishedBlogPosts } from '@/hooks/useBlogPosts';
import { Calendar, Clock, ArrowRight, BookOpen, TrendingUp, Users } from 'lucide-react';
import { format } from 'date-fns';
import { PublicNavigation } from '@/components/PublicNavigation';

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

  const featuredPost = blogPosts[0];
  const otherPosts = blogPosts.slice(1);

  return (
    <>
      <PublicNavigation />
      <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5"></div>
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="flex justify-center mb-6">
            <Badge variant="outline" className="px-4 py-2 text-sm font-medium">
              <BookOpen className="w-4 h-4 mr-2" />
              Latest Insights
            </Badge>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-primary/80 bg-clip-text text-transparent">
            Beyond Views <span className="text-primary">Blog</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Discover the latest trends, insights, and strategies in influencer marketing and the creator economy.
          </p>
          
          {/* Stats */}
          <div className="flex justify-center gap-8 mt-12">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-2 mx-auto">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <p className="text-2xl font-bold">{blogPosts.length}</p>
              <p className="text-sm text-muted-foreground">Articles</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-2 mx-auto">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <p className="text-2xl font-bold">10K+</p>
              <p className="text-sm text-muted-foreground">Readers</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-2 mx-auto">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <p className="text-2xl font-bold">Weekly</p>
              <p className="text-sm text-muted-foreground">Updates</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="py-12 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Featured Article</h2>
            <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/50">
              <Link to={`/blog/${featuredPost.slug}`}>
                <div className="md:flex">
                  {featuredPost.banner_image_url && (
                    <div className="md:w-1/2 aspect-video md:aspect-square overflow-hidden">
                      <img
                        src={featuredPost.banner_image_url}
                        alt={featuredPost.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="md:w-1/2 p-8">
                    <Badge className="mb-4">Featured</Badge>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(featuredPost.published_at!), 'MMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {Math.ceil(featuredPost.content.replace(/<[^>]*>/g, '').split(' ').length / 200)} min read
                      </div>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-4 hover:text-primary transition-colors">
                      {featuredPost.title}
                    </h2>
                    {featuredPost.excerpt && (
                      <p className="text-muted-foreground mb-6 line-clamp-3">
                        {featuredPost.excerpt}
                      </p>
                    )}
                    <Button className="group">
                      Read Full Article 
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </Link>
            </Card>
          </div>
        </section>
      )}

      {/* Blog Posts Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          {blogPosts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold mb-4">No Posts Yet</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                We're working on some amazing content for you. Check back soon for the latest insights and trends!
              </p>
            </div>
          ) : (
            <>
              {otherPosts.length > 0 && (
                <>
                  <h2 className="text-3xl font-bold mb-8 text-center">Latest Articles</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {otherPosts.map((post) => (
                      <Card key={post.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/50 overflow-hidden">
                        <Link to={`/blog/${post.slug}`} className="block h-full">
                          {post.banner_image_url && (
                            <div className="aspect-video overflow-hidden">
                              <img
                                src={post.banner_image_url}
                                alt={post.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                          )}
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(post.published_at!), 'MMM d, yyyy')}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {Math.ceil(post.content.replace(/<[^>]*>/g, '').split(' ').length / 200)} min read
                              </div>
                            </div>
                            <h2 className="text-xl font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                              {post.title}
                            </h2>
                          </CardHeader>
                          <CardContent className="pt-0">
                            {post.excerpt && (
                              <p className="text-muted-foreground line-clamp-3 mb-4">
                                {post.excerpt}
                              </p>
                            )}
                            <span className="text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                              Read more <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                          </CardContent>
                        </Link>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>
      </div>
    </>
  );
}