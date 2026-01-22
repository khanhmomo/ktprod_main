import { NextResponse, NextRequest } from 'next/server';
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

export async function POST(request: NextRequest) {
  console.log('POST test received');
  
  try {
    console.log('Reading request body...');
    const body = await request.json();
    console.log('Request body:', body);
    
    console.log('Creating response...');
    const response = NextResponse.json({
      success: true,
      message: 'POST test successful',
      received: body
    });
    
    console.log('Response created:', response);
    return response;
    
  } catch (error) {
    console.error('POST test error:', error);
    
    try {
      return NextResponse.json({
        success: false,
        error: 'POST test failed',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    } catch (jsonError) {
      console.error('Failed to create JSON response:', jsonError);
      return new NextResponse('POST test failed', { status: 500 });
    }
  }
}
