import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Booking } from '@/models/Booking';

// POST /api/admin/bookings - Create a new booking
export async function POST(request: NextRequest) {
  try {
    console.log('Creating new booking...');
    
    // Check if user is authenticated and is admin
    const auth = await isAuthenticated();
    if (!auth) {
      console.log('Not authenticated');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { crewId, eventId, status, assignedAt, salary, paymentStatus } = body;
    
    console.log('Request body:', { crewId, eventId, status, assignedAt, salary, paymentStatus });

    if (!crewId || !eventId) {
      console.log('Missing required fields:', { crewId, eventId });
      return NextResponse.json(
        { error: 'crewId and eventId are required' },
        { status: 400 }
      );
    }

    console.log('Checking for existing booking...');
    // Check if booking already exists - skip for UUID events for now
    let existingBooking = null;
    if (eventId && eventId.length === 24) {
      // Only check for existing bookings for MongoDB ObjectId format
      existingBooking = await Booking.findOne({ crewId, eventId });
    }
    
    if (existingBooking) {
      console.log('Booking already exists:', existingBooking._id);
      return NextResponse.json(
        { error: 'Booking already exists for this crew member and event' },
        { status: 400 }
      );
    }

    console.log('Creating new booking...');
    // Create new booking
    const bookingData = {
      crewId,
      eventId,
      status: status || 'pending',
      assignedAt: assignedAt || new Date(),
      salary: salary || '',
      paymentStatus: paymentStatus || 'pending'
    };
    
    console.log('Booking data to save:', bookingData);
    
    const booking = new Booking(bookingData);

    await booking.save();

    console.log(`Booking created: ${booking._id} for crew ${crewId}, event ${eventId}`);
    console.log('Saved booking object:', JSON.stringify(booking.toObject(), null, 2));

    return NextResponse.json({ 
      message: 'Booking created successfully',
      booking 
    });

  } catch (error: any) {
    console.error('Error creating booking:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', Object.keys(error.errors));
      console.error('Validation error details:', error.errors);
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: Object.keys(error.errors).map(key => ({
            field: key,
            message: error.errors[key].message
          }))
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create booking',
        message: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
