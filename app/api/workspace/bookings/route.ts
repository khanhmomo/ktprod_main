import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db';
import ShootingEvent from '@/models/ShootingEvent';
import { Crew } from '@/models/Crew';
import { Booking } from '@/models/Booking';

// GET /api/workspace/bookings - Get bookings for current crew member
export async function GET(request: NextRequest) {
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

    // Get all bookings for this crew member using the new Booking collection
    console.log('Logged ID:', currentUser._id);
    console.log('Looking for bookings for crew:', currentUser._id);
    console.log('Crew email:', currentUser.email);
    console.log('Crew ID type:', typeof (currentUser._id as any));
    console.log('Crew ID value:', (currentUser._id as any).toString());
    
    // First, let's see what bookings exist in the database
    const allBookings = await Booking.find({});
    console.log('All bookings in database:', allBookings.length);
    allBookings.forEach((booking, index) => {
      console.log(`Booking ${index}:`, {
        crewId: booking.crewId,
        crewIdType: typeof booking.crewId,
        crewIdValue: booking.crewId.toString(),
        eventId: booking.eventId,
        status: booking.status
      });
    });
    
    // Try without populate first to see if basic query works
    const basicBookings = await Booking.find({ crewId: currentUser._id });
    console.log('booking count (basic):', basicBookings.length);
    
    // Now use populate with ObjectId reference
    const bookings = await Booking.find({ crewId: currentUser._id })
      .populate({
        path: 'eventId',
        populate: {
          path: 'inquiryId',
          select: 'caseId name email subject'
        }
      })
      .sort({ assignedAt: -1 });

    console.log('booking count (populated):', bookings.length);
    
    // Transform bookings with event data
    const transformedBookings = bookings.map(booking => {
      const transformed = {
        _id: booking._id,
        eventId: booking.eventId?._id?.toString() || null, // Add eventId for navigation
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
      console.log('Transformed booking:', transformed);
      return transformed;
    });

    console.log('Final transformed bookings:', transformedBookings.length);

    return NextResponse.json({ bookings: transformedBookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
