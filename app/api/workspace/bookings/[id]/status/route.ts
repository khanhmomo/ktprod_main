import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Booking } from '@/models/Booking';
import { Crew } from '@/models/Crew';

// PUT /api/workspace/bookings/[id]/status - Update booking status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Updating booking status for ID:', params.id);
    
    // Check if user is authenticated
    const auth = await getCurrentUser();
    if (!auth.success) {
      console.log('Not authenticated:', auth);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Connecting to database...');
    await dbConnect();
    console.log('Database connected successfully');

    const body = await request.json();
    const { status } = body;
    
    console.log('Request body:', { status });

    if (!status || !['accepted', 'in_progress', 'completed', 'uploaded'].includes(status)) {
      console.log('Invalid status:', status);
      return NextResponse.json(
        { error: 'Invalid status. Must be accepted, in_progress, completed, or uploaded' },
        { status: 400 }
      );
    }

    console.log('Finding user...');
    // Get current user
    const currentUser = await Crew.findOne({ email: auth.user?.email });
    if (!currentUser) {
      console.log('User not found for email:', auth.user?.email);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('Found user:', currentUser.email);

    console.log('Finding booking...');
    // Find the booking
    const booking = await Booking.findById(params.id);
    if (!booking) {
      console.log('Booking not found for ID:', params.id);
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    console.log('Found booking:', booking._id, 'current status:', booking.status);

    // Verify this booking belongs to the current user
    if (booking.crewId.toString() !== (currentUser._id as any).toString()) {
      console.log('Unauthorized - booking belongs to:', booking.crewId, 'user ID:', currentUser._id);
      return NextResponse.json(
        { error: 'Unauthorized: This booking does not belong to you' },
        { status: 403 }
      );
    }

    console.log('Authorization verified, updating status...');

    // Update the booking status - bypass validation temporarily
    const result = await Booking.updateOne(
      { _id: params.id, crewId: currentUser._id },
      { status: status }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Booking not found or unauthorized' },
        { status: 404 }
      );
    }

    console.log(`Booking ${params.id} status updated to ${status} by crew ${currentUser.email}`);

    return NextResponse.json({ 
      message: 'Status updated successfully',
      status: status
    });

  } catch (error: any) {
    console.error('Error updating booking status:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json(
      { error: 'Failed to update booking status' },
      { status: 500 }
    );
  }
}
