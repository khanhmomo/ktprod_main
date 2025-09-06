import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';

export async function GET() {
  console.log('Testing database connection...');
  
  try {
    console.log('Attempting to connect to database...');
    await dbConnect();
    console.log('Successfully connected to database');
    
    // Test MongoDB connection
    const result = await dbConnect().then(() => {
      return { status: 'connected' };
    });
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      result
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Database connection failed',
        details: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.message : String(error)
          : undefined
      },
      { status: 500 }
    );
  }
}
