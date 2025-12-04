'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCalendar, FiClock, FiMapPin } from 'react-icons/fi';

interface ShootingEvent {
  _id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  status: string;
  customerName?: string;
  customerEmail?: string;
  bookingId?: string;
  bookingStatus?: string;
  bookingRespondedAt?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function WorkspacePage() {
  const [events, setEvents] = useState<ShootingEvent[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
    fetchEvents();
  }, [currentDate]);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      console.log('Fetching crew calendar events...');
      const response = await fetch('/api/workspace/calendar');
      if (response.ok) {
        const data = await response.json();
        console.log('Crew calendar events:', data.events);
        setEvents(data.events || []);
      } else {
        console.error('Failed to fetch calendar events:', response.status);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    console.log('Looking for events on date:', dateStr);
    console.log('Available events:', events.map(e => ({ id: e._id, date: e.date, title: e.title })));
    
    return events.filter(event => {
      // Try multiple date format comparisons
      const eventDate = event.date;
      console.log('Comparing:', dateStr, 'with event date:', eventDate);
      
      // Try exact match first
      if (eventDate === dateStr) return true;
      
      // Try parsing both dates and comparing
      try {
        const parsedEventDate = new Date(eventDate).toISOString().split('T')[0];
        if (parsedEventDate === dateStr) return true;
      } catch (e) {
        // Ignore parsing errors
      }
      
      return false;
    });
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'edited': return 'bg-purple-100 text-purple-800';
      case 'sent-to-customer': return 'bg-indigo-100 text-indigo-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssignmentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'accepted': return 'bg-green-500';
      case 'declined': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    );
  }

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = getFirstDayOfMonth(currentDate);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Schedule</h1>
        <p className="text-gray-600">View your assigned shooting events</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        {/* Calendar Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-4 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-4">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDay }).map((_, index) => (
              <div key={`empty-${index}`} className="h-24"></div>
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), index + 1);
              const dayEvents = getEventsForDate(date);

              return (
                <div
                  key={index}
                  className="h-24 border rounded-lg p-2 border-gray-200"
                >
                  <div className="text-sm font-medium mb-1">{index + 1}</div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event._id}
                        onClick={() => router.push(`/workspace/shootings/${event._id}`)}
                        className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${getStatusColor(event.status)}`}
                      >
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full ${getAssignmentStatusColor('accepted')} mr-1`}></div>
                          {event.time} - {event.title}
                        </div>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
