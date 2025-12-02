import Image from 'next/image';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import dbConnect from '@/lib/db';
import BlogPost from '@/models/BlogPost';

async function getBlogPost(slug: string) {
  try {
    await dbConnect();
    
    const post = await BlogPost.findOne({ slug, published: true });
    
    if (!post) {
      return null;
    }

    // Transform the post to match expected format
    return {
      id: post._id.toString(),
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      featuredImage: post.featuredImage,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      tags: post.tags
    };
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

// Calculate read time
const calculateReadTime = (content: string) => {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
};

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen pt-24">
      {/* Hero Section with Featured Image */}
      {post.featuredImage && (
        <div className="relative h-96 w-full">
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white px-4">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
              <div className="flex items-center justify-center space-x-4 text-sm">
                <span>{calculateReadTime(post.content)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {!post.featuredImage && (
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                <span>{calculateReadTime(post.content)}</span>
              </div>
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map((tag: string) => (
                <span key={tag} className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Blog Content */}
          <div 
            className="prose prose-lg max-w-none [&_img]:rounded-2xl"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Back to Blog */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <a 
              href="/blog"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Blog
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
