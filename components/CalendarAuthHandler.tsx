'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { checkPendingCalendarEvent, addToGoogleCalendar } from '@/lib/calendar';

export default function CalendarAuthHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCalendarAuth = async () => {
      const calendarAuth = searchParams.get('calendar_auth');
      
      if (calendarAuth === 'true') {
        // Check for pending calendar event
        const pendingEvent = checkPendingCalendarEvent();
        
        if (pendingEvent) {
          try {
            // Try to add the event now that user is authenticated
            const success = await addToGoogleCalendar(pendingEvent);
            
            if (success) {
              // Show success message
              alert('Event successfully added to Google Calendar!');
            } else {
              // Show error message
              alert('Failed to add event to Google Calendar. Please try again.');
            }
          } catch (error) {
            console.error('Error adding calendar event after auth:', error);
            alert('Failed to add event to Google Calendar. Please try again.');
          }
        }
        
        // Redirect back to previous page or admin
        router.push('/admin');
      }
    };

    handleCalendarAuth();
  }, [searchParams, router]);

  // This component doesn't render anything visible
  return null;
}
