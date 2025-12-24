interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  duration?: string;
}

export function generateICSFile(event: CalendarEvent): string {
  // Parse date and time
  const eventDate = new Date(event.date);
  const [hours, minutes] = event.time.split(':');
  eventDate.setHours(parseInt(hours), parseInt(minutes));

  // Calculate end time
  const eventEndTime = new Date(eventDate);
  if (event.duration) {
    const durationMatch = event.duration.match(/(\d+)\s*(hour|minute|hours|minutes)/i);
    if (durationMatch) {
      const [, amount, unit] = durationMatch;
      if (unit.startsWith('hour')) {
        eventEndTime.setHours(eventEndTime.getHours() + parseInt(amount));
      } else if (unit.startsWith('minute')) {
        eventEndTime.setMinutes(eventEndTime.getMinutes() + parseInt(amount));
      }
    }
  } else {
    eventEndTime.setHours(eventEndTime.getHours() + 1); // Default 1 hour
  }

  // Format dates for ICS
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const startTime = formatDate(eventDate);
  const endTime = formatDate(eventEndTime);

  // Generate UID
  const uid = `${event.title}-${event.date}-${event.time}@thewildstudio.org`;

  // Escape text for ICS
  const escapeText = (text: string) => {
    return text.replace(/,/g, '\\,').replace(/\n/g, '\\n').replace(/;/g, '\\;');
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Wild Studio//Booking Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${startTime}`,
    `DTEND:${endTime}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `LOCATION:${escapeText(event.location)}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return icsContent;
}

export function downloadCalendarFile(event: CalendarEvent, filename?: string) {
  const icsContent = generateICSFile(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Google Calendar API integration with OAuth2
export async function addToGoogleCalendar(event: CalendarEvent): Promise<boolean> {
  try {
    // Try to use our API endpoint first
    const response = await fetch('/api/calendar/add-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Event created via API:', result);
      return true;
    } else {
      const error = await response.json();
      
      // If requires reauth, try OAuth flow
      if (error.requiresReauth) {
        return await initiateGoogleCalendarAuth(event);
      }
      
      console.error('Calendar API error:', error);
      return false;
    }
  } catch (error) {
    console.error('Error adding to Google Calendar:', error);
    return false;
  }
}

// Initiate Google Calendar OAuth2 flow
async function initiateGoogleCalendarAuth(event: CalendarEvent): Promise<boolean> {
  try {
    // Store event data for after auth
    sessionStorage.setItem('pendingCalendarEvent', JSON.stringify(event));
    
    // Redirect to Google OAuth2 with proper scopes - use existing auth flow
    const redirectUrl = `${window.location.origin}/admin/login?calendar_auth=true`;
    
    window.location.href = redirectUrl;
    return true; // Will return after redirect
  } catch (error) {
    console.error('Error initiating Google Calendar auth:', error);
    return false;
  }
}

// Check for pending calendar event after OAuth callback
export function checkPendingCalendarEvent(): CalendarEvent | null {
  const pendingEvent = sessionStorage.getItem('pendingCalendarEvent');
  if (pendingEvent) {
    sessionStorage.removeItem('pendingCalendarEvent');
    return JSON.parse(pendingEvent);
  }
  return null;
}

// Add event directly to device calendar - Google Calendar API only
export async function addToDeviceCalendar(event: CalendarEvent): Promise<boolean> {
  try {
    // Only use Google Calendar API
    return await addToGoogleCalendar(event);
  } catch (error) {
    console.error('Error adding to Google Calendar:', error);
    return false;
  }
}
