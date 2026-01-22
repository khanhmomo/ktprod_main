import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Booking } from '@/models/Booking';

// PATCH /api/admin/bookings/[id] - Update a booking
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and is admin
    const auth = await isAuthenticated();
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { salary, paymentStatus } = body;
    
    console.log('Updating booking:', params.id, 'with:', { salary, paymentStatus });

    // Find and update the booking
    const booking = await Booking.findByIdAndUpdate(
      params.id,
      { 
        ...(salary !== undefined && { salary }),
        ...(paymentStatus !== undefined && { paymentStatus })
      },
      { new: true }
    );
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    console.log(`Booking ${params.id} updated successfully`);

    return NextResponse.json({ 
      message: 'Booking updated successfully',
      booking
    });

  } catch (error: any) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/bookings/[id] - Delete a booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and is admin
    const auth = await isAuthenticated();
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Find and delete the booking
    const booking = await Booking.findByIdAndDelete(params.id);
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    console.log(`Booking ${params.id} deleted successfully`);

    return NextResponse.json({ 
      message: 'Booking deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { error: 'Failed to delete booking' },
      { status: 500 }
    );
  }
}
