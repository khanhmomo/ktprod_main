import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Album from '@/models/Album';

interface ImageObject {
  url: string;
  alt?: string;
}

export async function GET(request: Request) {
  console.log('GET /api/albums called');
  
  try {
    console.log('Connecting to database...');
    await dbConnect();
    console.log('Database connected');
    
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    
    console.log('Fetching albums with all=', all);
    
    // If all=true is specified, return all albums (for admin)
    // Otherwise, only return published albums (for public access)
    const query = all ? {} : { isPublished: true };
    
    console.log('Query:', JSON.stringify(query, null, 2));
    
    const albums = await Album.find(query).sort({ createdAt: -1 });
    console.log(`Found ${albums.length} albums`);
    
    return NextResponse.json(albums);
  } catch (error) {
    console.error('Error in GET /api/albums:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch albums',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const data = await request.json();
    
    console.log('Creating new album with data:', JSON.stringify(data, null, 2));
    
    // Validate required fields
    if (!data.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(data.images) || data.images.length === 0) {
      return NextResponse.json(
        { error: 'At least one image is required' },
        { status: 400 }
      );
    }
    
    // Generate a URL-friendly slug from the title
    const slug = data.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove all non-word chars except spaces and hyphens
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .replace(/--+/g, '-');     // Replace multiple hyphens with a single one

    const album = new Album({
      title: data.title,
      slug,
      description: data.description || '',
      coverImage: data.coverImage || (data.images[0]?.url || ''),
      images: data.images.map((img: ImageObject) => ({
        url: img.url,
        alt: img.alt || ''
      })),
      date: data.date || new Date(),
      location: data.location || '',
      isPublished: Boolean(data.isPublished),
    });
    
    const savedAlbum = await album.save();
    console.log('Album created successfully:', savedAlbum._id);
    
    return NextResponse.json(savedAlbum, { status: 201 });
  } catch (error) {
    console.error('Error creating album:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create album: ${errorMessage}` },
      { status: 500 }
    );
  }
}
