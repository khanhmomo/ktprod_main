import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, description, location, date, time, duration } = await request.json();

    // Get Google access token from cookies
    const accessToken = request.cookies.get('google_access_token')?.value;

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

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarEvent)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Calendar API error:', errorData);
      
      // If token expired, try to refresh
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Token expired', requiresReauth: true },
          { status: 401 }
        );
      }
      
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
