import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Gallery from '@/models/Gallery';
import { isAuthenticated } from '@/lib/server-auth';

interface GalleryQuery {
  isPublished?: boolean;
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    
    // Check if user is authenticated for admin access
    const authCheck = await isAuthenticated();
    const isAdmin = !!authCheck;
    
    const query: GalleryQuery = {};
    
    // If not admin or not requesting all, only return published galleries
    if (!all || !isAdmin) {
      query.isPublished = true;
    }
    
    const galleries = await Gallery.find(query)
      .sort({ order: 1, createdAt: -1 })
      .select('-metadata -__v')
      .lean();
    
    return NextResponse.json(galleries);
  } catch (error) {
    console.error('Error fetching galleries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch galleries' },
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
    if (!data.title || !data.coverImage) {
      return NextResponse.json(
        { error: 'Title and cover image are required' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // Create slug from title
    const slug = data.slug || data.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-');
    
    // Check if slug exists
    const existingGallery = await Gallery.findOne({ slug });
    if (existingGallery) {
      return NextResponse.json(
        { error: 'A gallery with this slug already exists' },
        { status: 400 }
      );
    }
    
    const gallery = new Gallery({
      ...data,
      slug,
      isPublished: data.isPublished || false,
      order: data.order || 0,
      images: data.images || []
    });
    
    await gallery.save();
    
    return NextResponse.json(gallery, { status: 201 });
  } catch (error) {
    console.error('Error creating gallery:', error);
    return NextResponse.json(
      { error: 'Failed to create gallery' },
      { status: 500 }
    );
  }
}
