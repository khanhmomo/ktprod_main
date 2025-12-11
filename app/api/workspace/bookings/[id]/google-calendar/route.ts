import { NextRequest, NextResponse } from 'next/server';
import { addEventToGoogleCalendar, getGoogleCalendarAuthURL } from '@/lib/google-calendar';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Booking } from '@/models/Booking';
import { getGoogleTokens } from '@/lib/google-auth';

export async function POST(
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
    
    // Check if user has Google Calendar access token in session
    let sessionToken = request.cookies.get('google_access_token')?.value;
    
    // If no separate token, try to get a new one using refresh token or re-auth
    if (!sessionToken) {
      const refreshToken = request.cookies.get('google_refresh_token')?.value;
      
      if (refreshToken) {
        try {
          // Try to refresh the token
          const oauth2Client = new (await import('googleapis')).google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
          );
          oauth2Client.setCredentials({ refresh_token: refreshToken });
          
          const { credentials } = await oauth2Client.refreshAccessToken();
          sessionToken = credentials.access_token || '';
          
          if (!sessionToken) {
            throw new Error('Failed to obtain access token from refresh');
          }
          
          // Store the new access token
          const response = NextResponse.json({
            needsAuth: false,
            success: true,
            message: 'Token refreshed, please try again'
          });
          
          response.cookies.set('google_access_token', sessionToken!, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
          });
          
          return response;
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
        }
      }
      
      // Return auth URL for user to grant calendar access
      const currentUrl = request.headers.get('referer') || `${process.env.NEXTAUTH_URL}/workspace/shootings/${id}`;
      return NextResponse.json({
        needsAuth: true,
        authUrl: getGoogleCalendarAuthURL(currentUrl),
        bookingId: id
      });
    }

    // Add event to Google Calendar
    const calendarEvent = {
      title: `TheWild | ${booking.eventId?.title || 'No Title'}`,
      date: booking.eventId?.date || '',
      time: booking.eventId?.time || '',
      location: booking.eventId?.location || '',
      salary: booking.salary || '',
      notes: booking.notes || booking.eventId?.notes || ''
    };

    console.log('Adding to Google Calendar:', calendarEvent);
    console.log('Using access token:', sessionToken ? 'Present' : 'Missing');

    const result = await addEventToGoogleCalendar(calendarEvent, sessionToken);
    
    console.log('Google Calendar result:', result);
    
    return NextResponse.json({
      success: true,
      event: result
    });

  } catch (error) {
    console.error('Error adding to Google Calendar:', error);
    return NextResponse.json(
      { error: 'Failed to add event to Google Calendar' },
      { status: 500 }
    );
  }
}
