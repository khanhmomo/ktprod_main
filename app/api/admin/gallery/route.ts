import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import GalleryImage from '@/models/GalleryImage';
import { isAuthenticated } from '@/lib/server-auth';

export async function GET() {
  try {
    await dbConnect();
    
    // Check if user is authenticated
    const authCheck = await isAuthenticated();
    if (!authCheck) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const images = await GalleryImage.find({})
      .sort({ order: 1, createdAt: -1 })
      .lean();
    
    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gallery images' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const authCheck = await isAuthenticated();
    if (!authCheck) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const data = await request.json();
    
    // Basic validation
    if (!data.url) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // Get the highest order number
    const lastImage = await GalleryImage.findOne().sort('-order').lean();
    const nextOrder = (lastImage?.order || 0) + 1;
    
    const image = new GalleryImage({
      url: data.url,
      alt: data.alt || '',
      category: data.category || 'other',
      order: data.order !== undefined ? data.order : nextOrder,
      isActive: data.isActive !== undefined ? data.isActive : true
    });
    
    await image.save();
    
    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error('Error adding gallery image:', error);
    return NextResponse.json(
      { error: 'Failed to add gallery image' },
      { status: 500 }
    );
  }
}
