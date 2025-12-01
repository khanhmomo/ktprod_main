'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import BlogPostForm from '@/components/admin/BlogPostForm';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  status: 'draft' | 'published';
  publishedAt: string;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[];
};

export default function EditBlogPostPage() {
  const { id } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/admin/blog/${id}`);
        if (response.ok) {
          const data = await response.json();
          setPost(data.post);
        } else {
          console.error('Failed to fetch post');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Post not found</h2>
          <p className="mt-2 text-gray-600">The requested blog post could not be found.</p>
        </div>
      </div>
    );
  }

  return <BlogPostForm initialData={post} isEditing={true} />;
}
