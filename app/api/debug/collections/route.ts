import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await dbConnect();
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    // Get count of films
    const filmsCount = await mongoose.connection.db.collection('films').countDocuments();
    
    // Get a sample film
    const sampleFilm = await mongoose.connection.db.collection('films').findOne({});
    
    return NextResponse.json({
      status: 'success',
      collections: collections.map(c => c.name),
      filmsCount,
      sampleFilm,
      connection: {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        models: Object.keys(mongoose.connection.models)
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error.message,
        connection: {
          readyState: mongoose.connection?.readyState,
          host: mongoose.connection?.host,
          name: mongoose.connection?.name
        }
      },
      { status: 500 }
    );
  }
}
