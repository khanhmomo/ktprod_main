import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  try {
    const { title, description, location, date, time, duration } = await request.json();

    // Get Google tokens from cookies
    const accessToken = request.cookies.get('google_access_token')?.value;
    const refreshToken = request.cookies.get('google_refresh_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google authentication required' },
        { status: 401 }
      );
    }

    // Parse date and time
    const eventDate = new Date(date);
    const [hours, minutes] = time.split(':');
    eventDate.setHours(parseInt(hours), parseInt(minutes));

    // Calculate end time
    const endTime = new Date(eventDate);
    if (duration) {
      const durationMatch = duration.match(/(\d+)\s*(hour|minute|hours|minutes)/i);
      if (durationMatch) {
        const [, amount, unit] = durationMatch;
        if (unit.startsWith('hour')) {
          endTime.setHours(endTime.getHours() + parseInt(amount));
        } else if (unit.startsWith('minute')) {
          endTime.setMinutes(endTime.getMinutes() + parseInt(amount));
        }
      }
    } else {
      endTime.setHours(endTime.getHours() + 1);
    }

    // Format dates for Google Calendar API
    const formatDateForAPI = (date: Date) => {
      return date.toISOString();
    };

    const startTime = formatDateForAPI(eventDate);
    const formattedEndTime = formatDateForAPI(endTime);

    // Create event in Google Calendar
    const calendarEvent = {
      summary: title,
      description: description,
      location: location,
      start: {
        dateTime: startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: formattedEndTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      reminders: {
        useDefault: true
      }
    };

    let currentAccessToken = accessToken;
    let response = await makeCalendarRequest(currentAccessToken, calendarEvent);

    // If token expired and we have refresh token, try to refresh
    if (!response.ok && response.status === 401 && refreshToken) {
      try {
        const newTokens = await refreshAccessToken(refreshToken);
        currentAccessToken = newTokens.access_token;
        
        // Retry with new token
        response = await makeCalendarRequest(currentAccessToken, calendarEvent);
        
        if (response.ok) {
          // Update the access token cookie
          const responseData = await response.json();
          const httpResponse = NextResponse.json({
            success: true,
            event: responseData,
            message: 'Event added to Google Calendar successfully'
          });
          
          httpResponse.cookies.set('google_access_token', currentAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
          });
          
          return httpResponse;
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Calendar API error:', errorData);
      
      return NextResponse.json(
        { error: 'Failed to create calendar event', details: errorData },
        { status: response.status }
      );
    }

    const eventData = await response.json();
    
    return NextResponse.json({
      success: true,
      event: eventData,
      message: 'Event added to Google Calendar successfully'
    });

  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function makeCalendarRequest(accessToken: string, calendarEvent: any) {
  return fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(calendarEvent)
  });
}

async function refreshAccessToken(refreshToken: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const tokens = await response.json();
  return tokens;
}
