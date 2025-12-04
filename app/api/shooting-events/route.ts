import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import dbConnect from '@/lib/db';
import ShootingEvent from '@/models/ShootingEvent';
import { Crew } from '@/models/Crew';
import { Booking } from '@/models/Booking';
import { sendEmail } from '@/lib/email';

// GET all shooting events or events for a specific month
export async function GET(request: NextRequest) {
  try {
    // Add caching headers to prevent browser caching issues
    const headers = new Headers({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });

    // Check if user is authenticated
    const auth = await isAuthenticated();
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers }
      );
    }

    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    
    let query = {};
    
    // If month and year are provided, filter by that month
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of month
      
      query = {
        date: {
          $gte: startDate,
          $lte: endDate
        }
      };
    }
    
    const events = await ShootingEvent.find(query)
      .populate('inquiryId', 'name email phone')
      .sort({ date: 1, time: 1 });
    
    console.log('Found events:', events.length);
    console.log('Events sample:', events[0]);
    
    return NextResponse.json(events, { headers });
  } catch (error) {
    console.error('Error fetching shooting events:', error);
    
    // Add caching headers to error responses as well
    const headers = new Headers({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    
    return NextResponse.json(
      { error: 'Failed to fetch shooting events' },
      { status: 500, headers }
    );
  }
}

// POST new shooting event
export async function POST(request: NextRequest) {
  try {
    console.log('POST shooting event - starting...');
    
    // Check if user is authenticated
    const auth = await isAuthenticated();
    if (!auth) {
      console.log('Authentication failed');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('Authentication passed');

    await dbConnect();
    console.log('Database connected');
    
    const body = await request.json();
    console.log('POST shooting event - received body:', body);
    
    const {
      title,
      date,
      time,
      inquiryId,
      notes,
      location,
      duration,
      customerName,
      customerEmail,
      customerPhone,
      packageType,
      assignedCrew
    } = body;
    
    if (!title || !date || !time) {
      console.log('Validation error - missing required fields:', { title, date, time });
      return NextResponse.json(
        { error: 'Title, date, and time are required' },
        { status: 400 }
      );
    }
    
    // Create a simple event first to test
    const eventData = {
      title,
      date: new Date(date),
      time,
      inquiryId: inquiryId || null,
      notes: notes || '',
      location: location || '',
      duration: duration || '',
      customerName: customerName || '',
      customerEmail: customerEmail || '',
      customerPhone: customerPhone || '',
      packageType: packageType || '',
      assignedCrew: assignedCrew || []
    };
    
    console.log('Creating shooting event with data:', eventData);
    
    const shootingEvent = new ShootingEvent(eventData);
    
    console.log('Shooting event object before save:', JSON.stringify(shootingEvent.toObject(), null, 2));
    
    console.log('Saving shooting event...');
    await shootingEvent.save();
    
    console.log('Shooting event saved successfully');
    console.log('Saved event object:', JSON.stringify(shootingEvent.toObject(), null, 2));
    console.log('EventId field:', shootingEvent.eventId);
    
    // Note: Bookings are now created by the frontend with salary and paymentStatus
    // This allows for proper salary and payment status handling
    
    return NextResponse.json(shootingEvent, { status: 201 });
  } catch (error) {
    console.error('Error creating shooting event:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    console.error('Error details:', errorMessage);
    console.error('Error stack:', errorStack);
    return NextResponse.json(
      { error: 'Failed to create shooting event', details: errorMessage },
      { status: 500 }
    );
  }
}
