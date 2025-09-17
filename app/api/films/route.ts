import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Film from '@/models/Film';

export async function GET() {
  try {
    await dbConnect();
    
    // Get all films with raw data logging
    const films = await Film.find({})
      .select('title description youtubeId thumbnail createdAt')
      .sort({ createdAt: -1 })
      .lean();
    
    console.log('Raw films from database:', JSON.stringify(films, null, 2));
    
    // Process films to ensure they have thumbnails
    const processedFilms = films.map(film => {
      // Convert to plain object
      const filmObj = { ...film } as any;
      
      // Ensure thumbnail exists
      if (!filmObj.thumbnail && filmObj.youtubeId) {
        filmObj.thumbnail = `https://img.youtube.com/vi/${filmObj.youtubeId}/hqdefault.jpg`;
      } else if (!filmObj.thumbnail) {
        filmObj.thumbnail = '/placeholder-video.svg';
      }
      
      // Convert _id to string
      if (filmObj._id) {
        filmObj._id = filmObj._id.toString();
      }
      
      return filmObj;
    });
    
    console.log('Returning films with thumbnails:', processedFilms);
    return NextResponse.json(processedFilms);
  } catch (error) {
    console.error('Error fetching films:', error);
    return NextResponse.json(
      { error: 'Failed to fetch films' },
      { status: 500 }
    );
  }
}
