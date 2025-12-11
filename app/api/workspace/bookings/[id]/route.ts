import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Booking } from '@/models/Booking';

// GET /api/workspace/bookings/[id] - Get specific booking details
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

    // Find the booking and populate event details
    const booking = await Booking.findById(id)
      .populate({
        path: 'eventId',
        populate: {
          path: 'inquiryId',
          select: 'caseId name email subject'
        }
      });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Transform booking data to match expected format
    const transformedBooking = {
      _id: booking._id,
      eventId: booking.eventId?._id?.toString() || null,
      title: booking.eventId?.title || 'No Title',
      date: booking.eventId?.date || '',
      time: booking.eventId?.time || '',
      duration: booking.eventId?.duration || '',
      location: booking.eventId?.location || '',
      notes: booking.eventId?.notes || '',
      status: booking.status,
      bookingStatus: booking.status,
      bookingAssignedAt: booking.assignedAt,
      bookingRespondedAt: booking.respondedAt,
      bookingNotes: booking.notes,
      salary: booking.salary || '',
      paymentStatus: booking.paymentStatus || 'pending',
      customerName: booking.eventId?.customerName || '',
      customerEmail: booking.eventId?.customerEmail || '',
      packageType: booking.eventId?.packageType || ''
    };

    return NextResponse.json(transformedBooking);
  } catch (error) {
    console.error('Error fetching booking details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking details' },
      { status: 500 }
    );
  }
}
