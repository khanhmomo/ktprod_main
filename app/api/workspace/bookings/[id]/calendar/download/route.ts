import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Booking } from '@/models/Booking';
import { Crew } from '@/models/Crew';
import ShootingEvent from '@/models/ShootingEvent';
import { generateICSFile } from '@/lib/calendar';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated and get user data
    const auth = await getCurrentUser();
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    const { id } = await params;

    // Get booking details
    const booking = await Booking.findById(id).populate('eventId');
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Get crew details
    const crew = await Crew.findById(booking.crewId);
    if (!crew) {
      return NextResponse.json(
        { error: 'Crew not found' },
        { status: 404 }
      );
    }

    // Check if user owns this booking
    if ((crew._id as any).toString() !== auth.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const event = booking.eventId as any;
    
    // Create calendar event
    const calendarEvent = {
      title: `TheWild | ${event?.title || 'Shooting Event'}`,
      description: `
Customer: ${event?.customerName || 'N/A'}
Location: ${event?.location || 'N/A'}
Duration: ${event?.duration || '1 hour'}
Salary: $${booking.salary || '0'}
      `.trim(),
      location: event?.location || '',
      date: event?.date || booking.assignedAt.toISOString().split('T')[0],
      time: event?.time || '09:00',
      duration: event?.duration || '1 hour'
    };

    // Generate ICS content
    const icsContent = generateICSFile(calendarEvent);
    
    // Return as file download
    const filename = `${calendarEvent.title.replace(/[^a-zA-Z0-9]/g, '_')}_${calendarEvent.date}.ics`;

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar;charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error generating calendar file:', error);
    return NextResponse.json(
      { error: 'Failed to generate calendar file' },
      { status: 500 }
    );
  }
}
