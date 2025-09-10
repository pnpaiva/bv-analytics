import React from 'react';
import { BlogPostForm } from './BlogPostForm';
import { useCreateBlogPost, useUpdateBlogPost, BlogPost } from '@/hooks/useBlogPosts';

interface BlogPostFormWrapperProps {
  initialData?: BlogPost;
  onSave: () => void;
  onCancel: () => void;
}

export function BlogPostFormWrapper({ initialData, onSave, onCancel }: BlogPostFormWrapperProps) {
  const createBlogPost = useCreateBlogPost();
  const updateBlogPost = useUpdateBlogPost();

  const handleSave = async (data: Omit<BlogPost, 'id' | 'author_id' | 'created_at' | 'updated_at'>) => {
    try {
      if (initialData?.id) {
        await updateBlogPost.mutateAsync({ id: initialData.id, ...data });
      } else {
        await createBlogPost.mutateAsync(data);
      }
      onSave();
    } catch (error) {
      console.error('Error saving blog post:', error);
    }
  };

  return (
    <BlogPostForm
      initialData={initialData}
      onSave={handleSave}
      onCancel={onCancel}
      isLoading={createBlogPost.isPending || updateBlogPost.isPending}
    />
  );
}