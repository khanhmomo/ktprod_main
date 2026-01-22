import { NextRequest, NextResponse } from 'next/server';
import Album from '@/models/Album';
import dbConnect from '@/lib/db';

// PUT reorder albums
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { albums } = body;
    
    if (!albums || !Array.isArray(albums)) {
      return NextResponse.json(
        { error: 'Albums array is required' },
        { status: 400 }
      );
    }
    
    // Validate that each album has id and order
    for (const album of albums) {
      if (!album.id || typeof album.order !== 'number') {
        return NextResponse.json(
          { error: 'Each album must have id and order' },
          { status: 400 }
        );
      }
    }
    
    // Update all albums with new order
    const updatePromises = albums.map(({ id, order }) =>
      Album.findByIdAndUpdate(id, { order }, { new: true })
    );
    
    const updatedAlbums = await Promise.all(updatePromises);
    
    return NextResponse.json({
      success: true,
      message: 'Albums reordered successfully',
      albums: updatedAlbums.map(album => ({
        id: album._id.toString(),
        title: album.title,
        category: album.category,
        order: album.order
      }))
    });
  } catch (error) {
    console.error('Error reordering albums:', error);
    return NextResponse.json(
      { error: 'Failed to reorder albums' },
      { status: 500 }
    );
  }
}
