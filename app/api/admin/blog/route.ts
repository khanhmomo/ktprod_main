import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BlogPost from '@/models/BlogPost';
import { getServerSession } from 'next-auth';

export async function GET() {
  try {
    await dbConnect();
    
    // Fetch all blog posts (both draft and published) for admin
    const posts = await BlogPost.find({})
      .sort({ createdAt: -1 })
      .select('-content')
      .lean();

    // Transform _id to id for frontend consistency
    const transformedPosts = posts.map((post: any) => ({
      ...post,
      id: post._id?.toString() || '',
      _id: undefined // Remove the MongoDB _id
    }));

    return NextResponse.json({ posts: transformedPosts });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/admin/blog - Starting request');
    await dbConnect();
    console.log('Database connected successfully');
    
    const body = await request.json();
    console.log('POST request body received:', body);
    
    const { title, slug, excerpt, content, featuredImage, status, publishedAt, metaTitle, metaDescription, tags } = body;

    // Validate required fields
    if (!title || !slug || !content) {
      console.log('Validation failed - missing required fields');
      return NextResponse.json(
        { error: 'Title, slug, and content are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingPost = await BlogPost.findOne({ slug });
    console.log('Existing post check:', existingPost);
    if (existingPost) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 409 }
      );
    }

    // Create new blog post
    console.log('Creating new blog post with data:', {
      title,
      slug,
      excerpt,
      content: content?.substring(0, 100) + '...',
      featuredImage,
      status,
      publishedAt,
      metaTitle,
      metaDescription,
      tags
    });
    
    const blogPost = new BlogPost({
      title,
      slug,
      excerpt: excerpt || '',
      content,
      featuredImage: featuredImage || '',
      author: 'Admin',
      published: status === 'published',
      publishedAt: status === 'published' ? new Date(publishedAt) : null,
      metaTitle,
      metaDescription,
      tags: tags || []
    });

    console.log('Blog post object before save:', blogPost.toObject());
    console.log('Saving blog post...');
    await blogPost.save();
    console.log('Blog post saved successfully:', blogPost.toObject());

    return NextResponse.json(
      { 
        success: true, 
        message: 'Blog post created successfully',
        post: {
          id: blogPost._id,
          title: blogPost.title,
          slug: blogPost.slug,
          excerpt: blogPost.excerpt,
          status: blogPost.published ? 'published' : 'draft',
          publishedAt: blogPost.publishedAt,
          updatedAt: blogPost.updatedAt
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating blog post:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
