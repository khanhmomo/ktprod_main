import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Film from '@/models/Film';

export async function GET() {
  try {
    await dbConnect();
    
    // Test film data
    const testFilm = {
      title: 'Test Film ' + Date.now(),
      description: 'This is a test film',
      youtubeId: 'dQw4w9WgXcQ', // Rick Astley - Never Gonna Give You Up
    };
    
    // Create and save the test film
    const film = new Film({
      ...testFilm,
      thumbnail: `https://img.youtube.com/vi/${testFilm.youtubeId}/hqdefault.jpg`,
    });
    
    const savedFilm = await film.save();
    
    return NextResponse.json({
      success: true,
      message: 'Test film created successfully',
      film: savedFilm,
      filmCount: await Film.countDocuments()
    });
    
  } catch (error) {
    console.error('Error creating test film:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        ...(process.env.NODE_ENV === 'development' && { stack: error instanceof Error ? error.stack : undefined })
      },
      { status: 500 }
    );
  }
}
