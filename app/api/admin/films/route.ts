import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Film from '@/models/Film';

// GET /api/admin/films - Get all films
export async function GET() {
  try {
    // Check if user is authenticated
    const auth = await isAuthenticated();
    if (!auth) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const films = await Film.find({}).sort({ createdAt: -1 });
    return NextResponse.json(films);
  } catch (error) {
    console.error('Error fetching films:', error);
    return NextResponse.json(
      { error: 'Failed to fetch films' },
      { status: 500 }
    );
  }
}

// POST /api/admin/films - Create a new film
export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const auth = await isAuthenticated();
    if (!auth) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { title, description, youtubeId } = await request.json();

    // Validate required fields
    if (!title || !youtubeId) {
      return NextResponse.json(
        { message: 'Title and YouTube ID are required' },
        { status: 400 }
      );
    }
    
    // Extract YouTube ID from URL if needed
    let videoId = youtubeId;
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = youtubeId.match(youtubeRegex);
    if (match && match[1]) {
      videoId = match[1];
    }
    
    // Generate thumbnail URL
    const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    await dbConnect();
    
    // Create and save new film
    const film = new Film({
      title,
      description: description || '',
      youtubeId: videoId,
      thumbnail,
    });

    // Save the film to the database
    const savedFilm = await film.save();
    
    console.log('Film saved successfully:', savedFilm);
    return NextResponse.json(savedFilm, { status: 201 });
  } catch (error) {
    console.error('Error creating film:', error);
    
    // More detailed error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        message: 'Failed to create film',
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { details: errorDetails })
      },
      { status: 500 }
    );
  }
}
