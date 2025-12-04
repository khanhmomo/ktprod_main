import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Booking } from '@/models/Booking';
import { Crew } from '@/models/Crew';
import ShootingEvent from '@/models/ShootingEvent';

// GET /api/workspace/calendar - Get accepted bookings for crew calendar
export async function GET(request: NextRequest) {
  try {
    console.log('Fetching crew calendar...');
    
    // Check if user is authenticated
    const auth = await getCurrentUser();
    if (!auth.success) {
      console.log('Not authenticated:', auth);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('User authenticated, connecting to DB...');
    await dbConnect();

    console.log('Finding current user...');
    // Get current user
    const currentUser = await Crew.findOne({ email: auth.user?.email });
    if (!currentUser) {
      console.log('User not found for email:', auth.user?.email);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('Found user:', currentUser.email, 'ID:', currentUser._id);

    // Get all bookings for this crew member except pending
    console.log('Fetching non-pending bookings for crew:', currentUser._id);
    
    // Try without populate first
    const allBookings = await Booking.find({ 
      crewId: currentUser._id,
      status: { $ne: 'pending' } // Exclude pending bookings
    });
    
    console.log(`Found ${allBookings.length} non-pending bookings (no populate)`);
    
    // Now try with simple populate
    const bookingsWithEvent = await Booking.find({ 
      crewId: currentUser._id,
      status: { $ne: 'pending' } // Exclude pending bookings
    }).populate('eventId');
    
    console.log(`Found ${bookingsWithEvent.length} non-pending bookings (with eventId populate)`);

    // Transform to calendar event format
    const calendarEvents = bookingsWithEvent.map((booking: any) => {
      const eventDate = booking.eventId?.date;
      console.log('Processing booking:', booking._id, 'event date:', eventDate, 'type:', typeof eventDate);
      
      return {
        _id: booking.eventId?._id || booking._id,
        title: booking.eventId?.title || 'No Title',
        date: eventDate ? new Date(eventDate).toISOString().split('T')[0] : null,
        time: booking.eventId?.time,
        duration: booking.eventId?.duration || '',
        location: booking.eventId?.location || '',
        notes: booking.eventId?.notes || '',
        customerName: booking.eventId?.customerName || '',
        customerEmail: booking.eventId?.customerEmail || '',
        status: booking.eventId?.status || 'scheduled', // Use event status
        bookingId: booking._id,
        bookingStatus: booking.status,
        bookingRespondedAt: booking.respondedAt
      };
    }).filter(event => event.date !== null); // Filter out events with no date

    console.log('Transformed calendar events:', calendarEvents.length);
    console.log('Sample event:', calendarEvents[0]);

    return NextResponse.json({ events: calendarEvents });

  } catch (error) {
    console.error('Error fetching crew calendar:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar' },
      { status: 500 }
    );
  }
}
