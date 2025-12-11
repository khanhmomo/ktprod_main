import { google } from 'googleapis';
import { getGoogleAuthURL, getGoogleTokens } from './google-auth';

interface CalendarEvent {
  title: string;
  date: string;
  time: string;
  location?: string;
  salary?: string;
  notes?: string;
}

export const getGoogleCalendarAuthURL = (returnUrl?: string) => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  const baseUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  baseUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
  baseUrl.searchParams.set('redirect_uri', process.env.GOOGLE_REDIRECT_URI!);
  baseUrl.searchParams.set('response_type', 'code');
  baseUrl.searchParams.set('scope', scopes.join(' '));
  baseUrl.searchParams.set('access_type', 'offline');
  baseUrl.searchParams.set('prompt', 'consent');
  
  if (returnUrl) {
    baseUrl.searchParams.set('state', returnUrl);
  }

  return baseUrl.toString();
};

export const addEventToGoogleCalendar = async (event: CalendarEvent, accessToken: string) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Parse date and time
    const eventDate = new Date(event.date);
    const [hours, minutes] = event.time.split(':');
    eventDate.setHours(parseInt(hours), parseInt(minutes));

    // Calculate end time (default 1 hour if no duration specified)
    const endTime = new Date(eventDate);
    endTime.setHours(endTime.getHours() + 1);

    // Create event description
    const description = `
Salary: ${event.salary || 'N/A'}
${event.notes ? `Notes: ${event.notes}` : ''}
    `.trim();

    const calendarEvent = {
      summary: event.title,
      description: description,
      location: event.location || '',
      start: {
        dateTime: eventDate.toISOString(),
        timeZone: 'America/Chicago', // You might want to make this dynamic
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'America/Chicago',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', 'minutes': 24 * 60 }, // 1 day before
          { method: 'popup', 'minutes': 30 }, // 30 minutes before
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: calendarEvent,
    });

    return response.data;
  } catch (error) {
    console.error('Error adding event to Google Calendar:', error);
    throw error;
  }
};
