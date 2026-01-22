import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BlogPost from '@/models/BlogPost';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const { id } = params;

    const blogPost = await BlogPost.findById(id);

    if (!blogPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    console.log('Raw blog post from DB:', blogPost.toObject());

    // Transform the post to match frontend expectations
    const transformedPost = {
      id: blogPost._id.toString(),
      title: blogPost.title,
      slug: blogPost.slug,
      excerpt: blogPost.excerpt,
      content: blogPost.content,
      featuredImage: blogPost.featuredImage,
      status: blogPost.published ? 'published' : 'draft',
      publishedAt: blogPost.publishedAt,
      updatedAt: blogPost.updatedAt,
      metaTitle: blogPost.metaTitle,
      metaDescription: blogPost.metaDescription,
      tags: blogPost.tags
    };

    console.log('Transformed post:', transformedPost);

    return NextResponse.json({ post: transformedPost });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const { id } = params;
    const body = await request.json();
    console.log('PUT request body received:', body);
    
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      status,
      publishedAt,
      metaTitle,
      metaDescription,
      tags
    } = body;

    // Check if this is a status-only update (for toggle functionality)
    const isStatusOnlyUpdate = body.hasOwnProperty('status') && 
      !body.hasOwnProperty('title') && 
      !body.hasOwnProperty('slug') && 
      !body.hasOwnProperty('content');

    if (isStatusOnlyUpdate) {
      // Only update status and publishedAt
      try {
        const mongoose = require('mongoose');
        const db = mongoose.connection.db;
        const collection = db.collection('blogposts');
        
        const result = await collection.updateOne(
          { _id: new mongoose.Types.ObjectId(id) },
          { 
            $set: {
              published: status === 'published',
              publishedAt: status === 'published' ? new Date(publishedAt) : null,
              updatedAt: new Date()
            }
          }
        );

        if (result.matchedCount === 0) {
          return NextResponse.json(
            { error: 'Blog post not found' },
            { status: 404 }
          );
        }

        // Fetch the updated document
        const updatedPost = await BlogPost.findById(id);
        
        return NextResponse.json(
          { 
            success: true, 
            message: `Blog post ${status === 'published' ? 'published' : 'unpublished'} successfully`,
            post: {
              id: updatedPost._id,
              title: updatedPost.title,
              slug: updatedPost.slug,
              excerpt: updatedPost.excerpt,
              status: updatedPost.published ? 'published' : 'draft',
              publishedAt: updatedPost.publishedAt,
              updatedAt: updatedPost.updatedAt
            }
          }
        );
      } catch (error) {
        console.error('Error updating status:', error);
        return NextResponse.json(
          { error: 'Failed to update status' },
          { status: 500 }
        );
      }
    }

    // Validate required fields for full update
    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Title, slug, and content are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists (excluding current post)
    const existingPost = await BlogPost.findOne({ slug, _id: { $ne: id } });
    if (existingPost) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 409 }
      );
    }

    // Update blog post
    const updateData = {
      title,
      slug,
      excerpt: excerpt || '',
      content,
      featuredImage: featuredImage || '',
      published: status === 'published',
      publishedAt: status === 'published' ? new Date(publishedAt) : null,
      metaTitle,
      metaDescription,
      tags: tags || [],
    };

    console.log('Update data being saved to DB:', updateData);

    console.log('Attempting to update post with ID:', id);
    
    // Try multiple approaches to update the document
    let blogPost;
    
    try {
      // Approach 1: Try normal update first
      blogPost = await BlogPost.findOneAndUpdate(
        { _id: id },
        { 
          $set: updateData
        },
        { 
          new: true, 
          runValidators: false, 
          strict: false,
          upsert: false 
        }
      );
      console.log('Approach 1 result:', blogPost?.toObject());
    } catch (error) {
      console.log('Approach 1 failed:', error);
    }

    // If still missing date/location, try direct MongoDB collection update
    if (!blogPost || !blogPost.date || !blogPost.location) {
      console.log('Trying direct MongoDB collection update');
      try {
        const mongoose = require('mongoose');
        const db = mongoose.connection.db;
        const collection = db.collection('blogposts');
        
        const result = await collection.updateOne(
          { _id: new mongoose.Types.ObjectId(id) },
          { 
            $set: updateData
          },
          { upsert: false }
        );
        
        console.log('Direct MongoDB update result:', result);
        
        // Fetch the document again
        blogPost = await BlogPost.findById(id);
        console.log('After direct update:', blogPost?.toObject());
      } catch (error) {
        console.log('Direct MongoDB update failed:', error);
      }
    }

    console.log('Update result:', blogPost?.toObject());

    if (!blogPost) {
      console.log('Blog post not found after update');
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    console.log('Blog post updated successfully');

    return NextResponse.json(
      { 
        success: true, 
        message: 'Blog post updated successfully',
        post: {
          id: blogPost._id,
          title: blogPost.title,
          slug: blogPost.slug,
          excerpt: blogPost.excerpt,
          status: blogPost.published ? 'published' : 'draft',
          publishedAt: blogPost.publishedAt,
          updatedAt: blogPost.updatedAt
        }
      }
    );
  } catch (error) {
    console.error('Error updating blog post:', error);
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const { id } = params;

    const blogPost = await BlogPost.findByIdAndDelete(id);

    if (!blogPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Blog post deleted successfully'
      }
    );
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    );
  }
}
