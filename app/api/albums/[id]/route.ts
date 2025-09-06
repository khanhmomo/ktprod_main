import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Album from '@/models/Album';

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
    const album = await Album.findById(id);
    
    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(album);
  } catch (error) {
    console.error('Error fetching album:', error);
    return NextResponse.json(
      { error: 'Failed to fetch album' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteParams
) {
  const { id } = context.params;
  try {
    await dbConnect();
    const data = await request.json();
    
    console.log(`Updating album ${id} with data:`, JSON.stringify(data, null, 2));
    
    // Check if album exists first
    const existingAlbum = await Album.findById(id);
    if (!existingAlbum) {
      console.error(`Album not found: ${id}`);
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }
    
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
    
    // Prepare update data
    const updateData = {
      title: data.title,
      description: data.description || '',
      coverImage: data.coverImage || (data.images[0]?.url || ''),
      images: data.images.map((img: { url: string; alt?: string }) => ({
        url: img.url,
        alt: img.alt || ''
      })),
      date: data.date || new Date(),
      location: data.location || '',
      isPublished: Boolean(data.isPublished),
      updatedAt: new Date()
    };
    
    const album = await Album.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!album) {
      console.error(`Failed to update album: ${id}`);
      return NextResponse.json(
        { error: 'Failed to update album' },
        { status: 500 }
      );
    }
    
    console.log(`Successfully updated album: ${id}`);
    return NextResponse.json(album);
  } catch (error) {
    console.error('Error updating album:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to update album: ${errorMessage}` },
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
    await dbConnect();
    const album = await Album.findByIdAndDelete(id);
    
    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Album deleted successfully' });
  } catch (error) {
    console.error('Error deleting album:', error);
    return NextResponse.json(
      { error: 'Failed to delete album' },
      { status: 500 }
    );
  }
}
