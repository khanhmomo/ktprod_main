import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Film from '@/models/Film';

export async function GET() {
  try {
    await dbConnect();
    
    // Get all films using the model
    const films = await Film.find({}).lean();
    
    // Get model schema paths
    const schemaPaths = Film.schema.paths;
    
    return NextResponse.json({
      status: 'success',
      filmsCount: films.length,
      films,
      schema: {
        paths: Object.keys(schemaPaths),
        pathDetails: Object.entries(schemaPaths).reduce((acc, [key, value]) => ({
          ...acc,
          [key]: {
            instance: value.instance,
            isRequired: value.isRequired,
            defaultValue: value.defaultValue,
            options: value.options
          }
        }), {})
      }
    });
  } catch (error) {
    console.error('Debug films error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
