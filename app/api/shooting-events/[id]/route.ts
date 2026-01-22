import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import dbConnect from '@/lib/db';
import ShootingEvent from '@/models/ShootingEvent';
import { Crew } from '@/models/Crew';
import { Booking } from '@/models/Booking';
import { sendEmail } from '@/lib/email';

// PUT update shooting event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    
    const { id } = params;
    const body = await request.json();
    
    console.log('PUT shooting event - received body:', body);
    console.log('PUT assignedCrew:', body.assignedCrew);
    
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
      assignedCrew,
      status
    } = body;
    
    // Create update data object
    const updateData = {
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
      assignedCrew: assignedCrew || [],
      status: status || 'scheduled',
      updatedAt: new Date()
    };
    
    console.log('Updating shooting event with data:', updateData);
    console.log('UpdateData assignedCrew:', updateData.assignedCrew);
    
    const shootingEvent = await ShootingEvent.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('inquiryId', 'name email phone');
    
    if (!shootingEvent) {
      return NextResponse.json(
        { error: 'Shooting event not found' },
        { status: 404 }
      );
    }
    
    console.log('Shooting event updated successfully');
    
    return NextResponse.json(shootingEvent);
  } catch (error) {
    console.error('Error updating shooting event:', error);
    return NextResponse.json(
      { error: 'Failed to update shooting event' },
      { status: 500 }
    );
  }
}

// DELETE shooting event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    
    const { id } = params;
    
    // First, delete all bookings associated with this event
    const deletedBookings = await Booking.deleteMany({ eventId: id });
    console.log(`Deleted ${deletedBookings.deletedCount} bookings for event ${id}`);
    
    // Then delete the shooting event
    const shootingEvent = await ShootingEvent.findByIdAndDelete(id);
    
    if (!shootingEvent) {
      return NextResponse.json(
        { error: 'Shooting event not found' },
        { status: 404 }
      );
    }
    
    console.log(`Deleted shooting event ${id} and ${deletedBookings.deletedCount} related bookings`);
    
    return NextResponse.json({ 
      message: 'Shooting event deleted successfully',
      deletedBookingsCount: deletedBookings.deletedCount
    });
  } catch (error) {
    console.error('Error deleting shooting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete shooting event' },
      { status: 500 }
    );
  }
}
