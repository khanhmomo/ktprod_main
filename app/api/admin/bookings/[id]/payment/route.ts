import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Booking } from '@/models/Booking';

// PUT /api/admin/bookings/[id]/payment - Update payment status and salary
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Updating booking payment for ID:', params.id);
    
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
    const { paymentStatus, salary } = body;
    
    console.log('Request body:', { paymentStatus, salary });

    if (paymentStatus && !['pending', 'paid'].includes(paymentStatus)) {
      console.log('Invalid payment status:', paymentStatus);
      return NextResponse.json(
        { error: 'Invalid payment status. Must be pending or paid' },
        { status: 400 }
      );
    }

    if (salary !== undefined && (typeof salary !== 'number' || salary < 0)) {
      console.log('Invalid salary:', salary);
      return NextResponse.json(
        { error: 'Invalid salary. Must be a positive number' },
        { status: 400 }
      );
    }

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

    console.log('Found booking:', booking._id);

    // Update the booking
    if (paymentStatus !== undefined) {
      booking.paymentStatus = paymentStatus;
    }
    if (salary !== undefined) {
      booking.salary = salary;
    }
    
    await booking.save();

    console.log(`Booking ${params.id} updated - paymentStatus: ${paymentStatus}, salary: ${salary}`);

    return NextResponse.json({ 
      message: 'Booking updated successfully',
      booking 
    });

  } catch (error: any) {
    console.error('Error updating booking payment:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json(
      { error: 'Failed to update booking payment' },
      { status: 500 }
    );
  }
}
