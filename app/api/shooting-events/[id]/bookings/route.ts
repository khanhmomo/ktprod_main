import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Booking } from '@/models/Booking';

// GET /api/shooting-events/[id]/bookings - Get bookings for a specific event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated
    const auth = await isAuthenticated();
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const { id } = await params;
    
    // Get all bookings for this event
    const bookings = await Booking.find({ eventId: id })
      .populate('crewId', 'name email role')
      .sort({ assignedAt: -1 });

    console.log(`Found ${bookings.length} bookings for event ${id}`);

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error fetching event bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
