import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import BlogPostsClient from '@/app/blog/BlogPostsClient';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  publishedAt: string;
  tags?: string[];
}

export default function BlogPage() {
  
  // Calculate read time based on word count (average reading speed: 200 words per minute)
  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  return (
    <div className="bg-white -mt-8">
      <section className="relative pt-4 pb-16 bg-gray-50 overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 mt-8">The Wild Blog</h1>
          <div className="w-20 h-1 bg-black mx-auto mb-6"></div>
          <p className="text-gray-600 max-w-2xl mx-auto mb-12">
            Stories, tips, and insights from our photography adventures and experiences.
          </p>
        </div>
      </section>
      
      <div className="container mx-auto px-4 py-12">
        <BlogPostsClient />
      </div>
    </div>
  );
}
