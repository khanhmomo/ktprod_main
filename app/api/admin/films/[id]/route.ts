import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Film from '@/models/Film';

// GET /api/admin/films/[id] - Get a single film
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated
    const auth = await isAuthenticated();
    if (!auth) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    await dbConnect();
    const film = await Film.findById(id).lean();

    if (!film) {
      return NextResponse.json(
        { message: 'Film not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(film);
  } catch (error) {
    console.error('Error fetching film:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/films/[id] - Update a film
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated
    const auth = await isAuthenticated();
    if (!auth) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { title, description, youtubeId, thumbnail } = await request.json();

    await dbConnect();
    
    // Find and update the film
    const film = await Film.findByIdAndUpdate(
      id,
      {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(youtubeId && { 
          youtubeId,
          // Update thumbnail if youtubeId changes
          thumbnail: thumbnail || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
        }),
        ...(thumbnail && { thumbnail }),
      },
      { new: true, runValidators: true }
    );

    if (!film) {
      return NextResponse.json(
        { message: 'Film not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(film);
  } catch (error) {
    console.error('Error updating film:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/films/[id] - Delete a film
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated
    const auth = await isAuthenticated();
    if (!auth) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    await dbConnect();
    
    // Find and delete the film
    const film = await Film.findByIdAndDelete(id);

    if (!film) {
      return NextResponse.json(
        { message: 'Film not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Film deleted successfully' });
  } catch (error) {
    console.error('Error deleting film:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
