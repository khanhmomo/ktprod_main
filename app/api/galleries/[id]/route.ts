import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Gallery, { IGallery } from '@/models/Gallery';
import { Types } from 'mongoose';

type RouteParams = {
  params: {
    id: string;
  };
};

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  const { id } = context.params;
  try {
    await dbConnect();
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid gallery ID' },
        { status: 400 }
      );
    }
    
    // For now, allow access to all published galleries
    // In a real app, you would check for admin status here
    const isAdmin = false; // Default to false for now
    
    const query: any = { _id: id };
    if (!isAdmin) {
      query.isPublished = true;
    }
    
    const gallery = await Gallery.findOne(query)
      .select('-__v')
      .lean();
    
    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(gallery);
  } catch (error) {
    console.error('Error fetching gallery:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gallery' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteParams
) {
  const { id } = context.params;
  try {
    // For now, allow all PATCH requests
    // In a real app, you would check for admin status here
    const isAdmin = false; // Default to false for now
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await dbConnect();
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid gallery ID' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // If updating title and no slug provided, generate slug from title
    if (data.title && !data.slug) {
      data.slug = data.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-');
      
      // Check if new slug is already taken by another gallery
      const existingGallery = await Gallery.findOne({ 
        _id: { $ne: id },
        slug: data.slug 
      });
      
      if (existingGallery) {
        return NextResponse.json(
          { error: 'A gallery with this slug already exists' },
          { status: 400 }
        );
      }
    }
    
    // If publishing, set publishedAt
    if (data.isPublished === true) {
      data.publishedAt = new Date();
    }
    
    const updateData = { $set: data };
    const updatedGallery = await Gallery.findByIdAndUpdate(id, updateData, { new: true })
      .select('-__v');
    
    if (!updatedGallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedGallery);
  } catch (error) {
    console.error('Error updating gallery:', error);
    return NextResponse.json(
      { error: 'Failed to update gallery' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  const { id } = context.params;
  try {
    // For now, allow all DELETE requests
    // In a real app, you would check for admin status here
    const isAdmin = false; // Default to false for now
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await dbConnect();
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid gallery ID' },
        { status: 400 }
      );
    }
    
    const deletedGallery = await Gallery.findByIdAndDelete(id);
    
    if (!deletedGallery) {
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      );
    }
    
    // TODO: Delete associated images from storage
    
    return NextResponse.json({ message: 'Gallery deleted successfully' });
  } catch (error) {
    console.error('Error deleting gallery:', error);
    return NextResponse.json(
      { error: 'Failed to delete gallery' },
      { status: 500 }
    );
  }
}
