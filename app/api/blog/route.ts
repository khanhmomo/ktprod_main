import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BlogPost from '@/models/BlogPost';

export async function GET() {
  try {
    console.log('GET /api/blog - Starting request');
    await dbConnect();
    console.log('Database connected successfully');
    
    // Fetch only published posts, sorted by publishedAt in descending order
    const posts = await BlogPost.find({ published: true })
      .sort({ publishedAt: -1 })
      .select('-content -__v')
      .lean();
    
    console.log('Found published posts:', posts.length);
    console.log('Posts:', posts.map(p => ({ id: p._id, title: p.title, published: p.published, publishedAt: p.publishedAt })));

    // Transform _id to id for frontend consistency
    const transformedPosts = posts.map((post: any) => ({
      ...post,
      id: post._id?.toString() || '',
      _id: undefined // Remove the MongoDB _id
    }));

    console.log('Transformed posts:', transformedPosts.map(p => ({ id: p.id, title: p.title })));

    return NextResponse.json({ success: true, data: transformedPosts });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}
