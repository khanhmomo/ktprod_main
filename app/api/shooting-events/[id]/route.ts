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
      assignedCrew
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
    
    // Handle crew assignments and email notifications
    if (assignedCrew && assignedCrew.length > 0) {
      console.log('Updating crew assignments and sending notifications...');
      
      try {
        // Update crew assignments
        shootingEvent.crewAssignments = assignedCrew.map((crewId: string) => ({
          crewId,
          status: 'pending',
          assignedAt: new Date()
        }));
        
        // Also set the assignedCrew field for easy access
        shootingEvent.assignedCrew = assignedCrew;
        
        // Save the updated event with crew assignments
        await shootingEvent.save();
        
        // Get crew member details for email notifications
        const crewMembers = await Crew.find({ _id: { $in: assignedCrew } });
        
        for (const crew of crewMembers) {
          console.log(`Sending email to crew: ${crew.name} (${crew.email})`);
          
          const emailContent = `
            Updated Booking with TheWild Studio
            
            Event: ${title}
            Date: ${date}
            Time: ${time}
            Location: ${location}
            Duration: ${duration}
            Customer: ${customerName}
            Email: ${customerEmail}
            Phone: ${customerPhone}
            Package: ${packageType}
            
            Notes: ${notes}
            
            This booking has been assigned to you. Please check your calendar.
          `;
          
          console.log(`Email content for ${crew.email}:`, emailContent);
          
          // Send the email (disabled for now)
          // await sendEmail({
          //   to: crew.email,
          //   subject: 'Updated booking with TheWild Studio',
          //   text: emailContent
          // });
          console.log('Email sending disabled - would send to:', crew.email);
        }
        
        console.log(`Email notifications sent to ${crewMembers.length} crew members`);
      } catch (crewError) {
        console.error('Error handling crew assignments:', crewError);
        // Don't fail the request if crew handling fails
      }
    }
    
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
