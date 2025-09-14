import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useBlogPost } from '@/hooks/useBlogPosts';
import { Calendar, Clock, ArrowLeft, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { BlogCTA } from '@/components/blog/BlogCTA';
import { PublicNavigation } from '@/components/PublicNavigation';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = useBlogPost(slug!);

  // Update document title and meta tags
  useEffect(() => {
    if (post) {
      document.title = post.meta_title || post.title;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', post.meta_description || post.excerpt || '');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = post.meta_description || post.excerpt || '';
        document.head.appendChild(meta);
      }

      // Update meta keywords
      if (post.meta_keywords) {
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        if (metaKeywords) {
          metaKeywords.setAttribute('content', post.meta_keywords);
        } else {
          const meta = document.createElement('meta');
          meta.name = 'keywords';
          meta.content = post.meta_keywords;
          document.head.appendChild(meta);
        }
      }

      // Update Open Graph tags
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', post.title);
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:title');
        meta.content = post.title;
        document.head.appendChild(meta);
      }

      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.setAttribute('content', post.meta_description || post.excerpt || '');
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'og:description');
        meta.content = post.meta_description || post.excerpt || '';
        document.head.appendChild(meta);
      }

      if (post.banner_image_url) {
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage) {
          ogImage.setAttribute('content', post.banner_image_url);
        } else {
          const meta = document.createElement('meta');
          meta.setAttribute('property', 'og:image');
          meta.content = post.banner_image_url;
          document.head.appendChild(meta);
        }
      }
    }

    return () => {
      // Reset title on unmount
      document.title = 'Influencer Analytics Platform';
    };
  }, [post]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p>Loading blog post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The blog post you're looking for doesn't exist.
          </p>
          <Link to="/blog">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const readingTime = Math.ceil(post.content.replace(/<[^>]*>/g, '').split(' ').length / 200);

  return (
    <>
      <PublicNavigation />
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="py-8 px-4 border-b">
        <div className="container mx-auto">
          <Link to="/blog">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </header>

      {/* Banner Image */}
      {post.banner_image_url && (
        <div className="aspect-[21/9] overflow-hidden">
          <img
            src={post.banner_image_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Article */}
      <article className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              {post.title}
            </h1>
            
            {post.excerpt && (
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                {post.excerpt}
              </p>
            )}

            <div className="flex items-center justify-between border-b pb-6">
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(post.published_at!), 'MMMM d, yyyy')}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {readingTime} min read
                </div>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </header>

          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
            style={{
              color: 'hsl(var(--foreground))',
            }}
          />
          
          {/* CTA Section */}
          <BlogCTA />
        </div>
      </article>

      {/* Navigation */}
      <div className="py-12 px-4 border-t bg-muted/50">
        <div className="container mx-auto max-w-4xl text-center">
          <Link to="/blog">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to All Posts
            </Button>
          </Link>
        </div>
      </div>

      <style>{`
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
          color: hsl(var(--foreground));
        }
        .prose p, .prose li, .prose span {
          color: hsl(var(--foreground));
        }
        .prose a {
          color: hsl(var(--primary));
        }
        .prose a:hover {
          color: hsl(var(--primary));
          opacity: 0.8;
        }
        .prose blockquote {
          border-left-color: hsl(var(--primary));
          color: hsl(var(--muted-foreground));
        }
        .prose code {
          background-color: hsl(var(--muted));
          color: hsl(var(--foreground));
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
        }
        .prose pre {
          background-color: hsl(var(--muted));
          color: hsl(var(--foreground));
        }
        .prose img {
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
      `}</style>
      </div>
    </>
  );
}