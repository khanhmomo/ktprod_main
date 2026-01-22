import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Booking } from '@/models/Booking';
import { Crew } from '@/models/Crew';
import ShootingEvent from '@/models/ShootingEvent';

// GET /api/workspace/shootings/[id] - Get shooting details for crew member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if user is authenticated
    const auth = await getCurrentUser();
    if (!auth.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get current user
    const currentUser = await Crew.findOne({ email: auth.user?.email });
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find the booking for this shooting and crew member
    const booking = await Booking.findOne({ 
      eventId: id,
      crewId: currentUser._id 
    }).populate('eventId');

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const shooting = booking.eventId as any;
    
    // Transform to expected format
    const shootingDetails = {
      _id: shooting._id,
      title: shooting.title,
      date: shooting.date,
      time: shooting.time,
      duration: shooting.duration || '',
      location: shooting.location || '',
      notes: shooting.notes || '',
      customerName: shooting.customerName || '',
      customerEmail: shooting.customerEmail || '',
      status: shooting.status,
      bookingStatus: booking.status,
      bookingId: booking._id,
      salary: booking.salary || '',
      paymentStatus: booking.paymentStatus || 'pending'
    };

    console.log('Found shooting details for crew:', shootingDetails.title);

    return NextResponse.json({ shooting: shootingDetails });

  } catch (error) {
    console.error('Error fetching shooting details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shooting details' },
      { status: 500 }
    );
  }
}
