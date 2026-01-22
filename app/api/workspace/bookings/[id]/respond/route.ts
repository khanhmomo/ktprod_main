import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Booking } from '@/models/Booking';
import { Crew } from '@/models/Crew';
import ShootingEvent from '@/models/ShootingEvent';

// POST /api/workspace/bookings/[id]/respond - Accept or decline a booking
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const body = await request.json();
    const { action } = body; // 'accept' or 'decline'

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Find the booking
    const booking = await Booking.findById(params.id);
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify this booking belongs to the current user
    if (booking.crewId.toString() !== (currentUser._id as any).toString()) {
      return NextResponse.json(
        { error: 'Unauthorized: This booking does not belong to you' },
        { status: 403 }
      );
    }

    // Update the booking status
    booking.status = action === 'accept' ? 'accepted' : 'declined';
    booking.respondedAt = new Date();
    await booking.save();

    console.log(`Booking ${params.id} ${action}ed by crew ${currentUser.email}`);

    // Also update the shooting event's crewAssignments for consistency
    const shootingEvent = await ShootingEvent.findById(booking.eventId);
    if (shootingEvent && shootingEvent.crewAssignments) {
      const crewAssignment = shootingEvent.crewAssignments.find(
        (ca: any) => ca.crewId.toString() === (currentUser._id as any).toString()
      );
      if (crewAssignment) {
        crewAssignment.status = action === 'accept' ? 'accepted' : 'declined';
        crewAssignment.respondedAt = new Date();
        await shootingEvent.save();
        console.log(`Updated shooting event ${booking.eventId} crew assignment`);
      }
    }

    return NextResponse.json({
      message: `Booking ${action}ed successfully`,
      booking
    });
  } catch (error: any) {
    console.error('Error responding to booking:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { 
        error: 'Failed to respond to booking',
        message: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
