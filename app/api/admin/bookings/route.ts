import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Booking } from '@/models/Booking';
import nodemailer from 'nodemailer';
import { Crew } from '@/models/Crew';
import ShootingEvent from '@/models/ShootingEvent';

// Gmail SMTP configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD, // Use App Password for better security
  },
});

// POST /api/admin/bookings - Create a new booking
export async function POST(request: NextRequest) {
  try {
    console.log('Creating new booking...');
    
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
    const { crewId, eventId, status, assignedAt, salary, paymentStatus } = body;
    
    console.log('Request body:', { crewId, eventId, status, assignedAt, salary, paymentStatus });

    if (!crewId || !eventId) {
      console.log('Missing required fields:', { crewId, eventId });
      return NextResponse.json(
        { error: 'crewId and eventId are required' },
        { status: 400 }
      );
    }

    console.log('Checking for existing booking...');
    // Check if booking already exists - skip for UUID events for now
    let existingBooking = null;
    if (eventId && eventId.length === 24) {
      // Only check for existing bookings for MongoDB ObjectId format
      existingBooking = await Booking.findOne({ crewId, eventId });
    }
    
    if (existingBooking) {
      console.log('Booking already exists:', existingBooking._id);
      return NextResponse.json(
        { error: 'Booking already exists for this crew member and event' },
        { status: 400 }
      );
    }

    console.log('Creating new booking...');
    // Create new booking
    const bookingData = {
      crewId,
      eventId,
      status: status || 'pending',
      assignedAt: assignedAt || new Date(),
      salary: salary || '',
      paymentStatus: paymentStatus || 'pending'
    };
    
    console.log('Booking data to save:', bookingData);
    
    const booking = new Booking(bookingData);

    await booking.save();

    console.log(`Booking created: ${booking._id} for crew ${crewId}, event ${eventId}`);
    console.log('Saved booking object:', JSON.stringify(booking.toObject(), null, 2));

    // Get crew and event details for email
    const crew = await Crew.findById(crewId);
    const event = await ShootingEvent.findById(eventId);

    if (crew && crew.email) {
      try {
        // Send booking invitation email to crew member
        await transporter.sendMail({
          from: `"The Wild Studio | Bookings" <${process.env.GMAIL_EMAIL}>`,
          to: crew.email,
          subject: `New Booking Invitation: ${event?.title || 'Shooting Event'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>New Booking Invitation</h2>
              
              <p>Dear ${crew.name},</p>
              
              <p>You have been invited to a new booking assignment:</p>
              
              <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Event:</strong> ${event?.title || 'Shooting Event'}</p>
                <p><strong>Date:</strong> ${event?.date || 'TBD'}</p>
                <p><strong>Time:</strong> ${event?.time || 'TBD'}</p>
                <p><strong>Location:</strong> ${event?.location || 'TBD'}</p>
                <p><strong>Duration:</strong> ${event?.duration || 'TBD'}</p>
                ${salary ? `<p><strong>Salary:</strong> $${salary}</p>` : ''}
                ${event?.customerName ? `<p><strong>Customer:</strong> ${event.customerName}</p>` : ''}
              </div>
              
              <p>Please log in to your workspace to accept or decline this booking.</p>
              
              <div style="margin: 30px 0;">
                <a href="https://thewildstudio.org/workspace/bookings" 
                   style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  View Bookings
                </a>
              </div>
              
              <p>Best regards,<br>The Wild Studio Team</p>
            </div>
          `,
        });
        
        console.log(`Booking invitation email sent to ${crew.email}`);
      } catch (emailError) {
        console.error('Error sending booking invitation email:', emailError);
        // Don't fail the booking creation if email fails
      }
    } else {
      console.log(`Crew not found or no email address for crew ID: ${crewId}`);
    }

    return NextResponse.json({ 
      message: 'Booking created successfully',
      booking 
    });

  } catch (error: any) {
    console.error('Error creating booking:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', Object.keys(error.errors));
      console.error('Validation error details:', error.errors);
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: Object.keys(error.errors).map(key => ({
            field: key,
            message: error.errors[key].message
          }))
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create booking',
        message: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
