import { NextRequest, NextResponse } from 'next/server';

// This endpoint helps initialize the Socket.IO server
// Call this when the app starts to ensure Socket.IO is ready

export async function GET(request: NextRequest) {
  try {
    // Make a request to the Socket.IO handler to initialize it
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/socket/io`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return NextResponse.json({ 
        success: true, 
        message: 'Socket.IO initialization triggered' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to initialize Socket.IO' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error initializing Socket.IO:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error initializing Socket.IO' 
    }, { status: 500 });
  }
}
