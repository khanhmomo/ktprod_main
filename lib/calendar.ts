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

// Add event directly to device calendar
export async function addToDeviceCalendar(event: CalendarEvent): Promise<boolean> {
  try {
    // Parse date and time
    const eventDate = new Date(event.date);
    const [hours, minutes] = event.time.split(':');
    eventDate.setHours(parseInt(hours), parseInt(minutes));

    // Calculate end time
    const endTime = new Date(eventDate);
    if (event.duration) {
      const durationMatch = event.duration.match(/(\d+)\s*(hour|minute|hours|minutes)/i);
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

    // Check if Web Calendar API is supported
    if ('calendar' in navigator && 'Calendar' in window) {
      // Use Web Calendar API (Chrome/Edge on Android)
      const calendar = await (navigator as any).calendar.create();
      
      const calendarEvent = {
        title: event.title,
        description: event.description,
        location: event.location,
        start: eventDate,
        end: endTime,
      };

      await calendar.createEvent(calendarEvent);
      return true;
    }
    
    // Fallback: Try to use platform-specific calendar apps
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      // iOS: Use data URL to open in Calendar app
      const icsContent = generateICSFile(event);
      const encodedData = encodeURIComponent(icsContent);
      const dataUrl = `data:text/calendar;charset=utf-8,${encodedData}`;
      
      // Open in new window to trigger iOS Calendar
      window.open(dataUrl, '_blank');
      return true;
    }

    if (isAndroid) {
      // Android: Try to use Google Calendar intent
      const startDate = eventDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const endDate = endTime.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
      
      window.open(googleCalendarUrl, '_blank');
      return true;
    }

    // Fallback to download
    return false;

  } catch (error) {
    console.error('Error adding to device calendar:', error);
    return false;
  }
}
