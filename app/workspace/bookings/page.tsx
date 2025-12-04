'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCalendar, FiClock, FiMapPin, FiCheck, FiX, FiDownload } from 'react-icons/fi';
import { addToDeviceCalendar } from '@/lib/calendar';

interface Booking {
  _id: string;
  eventId?: string; // Add eventId for navigation
  title: string;
  date: string;
  time: string;
  duration?: string;
  location?: string;
  notes?: string;
  status: string;
  bookingStatus: 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'uploaded';
  customerName?: string;
  customerEmail?: string;
  bookingAssignedAt: string;
  bookingRespondedAt?: string;
  bookingNotes?: string;
  packageType?: string;
  salary?: string;
  paymentStatus?: 'pending' | 'completed';
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'uploaded'>('all');
  const router = useRouter();

  const handleBookingClick = (booking: Booking) => {
    if (booking.eventId) {
      router.push(`/workspace/shootings/${booking.eventId}`);
    }
  };

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First fetch user to ensure authentication
      const userResponse = await fetch('/api/auth/me');
      if (!userResponse.ok) {
        throw new Error('Failed to authenticate user');
      }
      const userData = await userResponse.json();
      setUser(userData);
      
      // Then fetch bookings
      await fetchBookings();
    } catch (error) {
      console.error('Initialization error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      setLoading(false);
    }
  };

  const retryFetch = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      initializeData();
    }
  };

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

  const fetchBookings = async () => {
    try {
      console.log('Fetching bookings from workspace...');
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/workspace/bookings', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Raw API response:', data);
        console.log('Bookings received:', data.bookings);
        console.log('Bookings count:', data.bookings?.length);
        
        // Check if bookings have the expected structure
        if (data.bookings && data.bookings.length > 0) {
          console.log('Sample booking structure:', Object.keys(data.bookings[0]));
          console.log('Sample booking data:', data.bookings[0]);
        }
        
        setBookings(data.bookings || []);
        setError(null);
      } else {
        console.error('Failed to fetch bookings:', response.status);
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error(`Failed to fetch bookings: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch bookings';
      setError(errorMessage);
      setBookings([]); // Clear bookings on error
    } finally {
      setLoading(false);
    }
  };

  const handleBookingResponse = async (bookingId: string, action: 'accept' | 'decline') => {
    try {
      const response = await fetch(`/api/workspace/bookings/${bookingId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        fetchBookings(); // Refresh bookings
      } else {
        const errorData = await response.json();
        console.error('Failed to respond to booking:', errorData);
        console.error('Response status:', response.status);
      }
    } catch (error) {
      console.error('Error responding to booking:', error);
    }
  };

  const handleCalendarDownload = async (bookingId: string) => {
    try {
      // Get booking details for calendar
      const response = await fetch(`/api/workspace/bookings/${bookingId}/calendar?t=${Date.now()}`);
      
      if (response.ok) {
        const bookingData = await response.json();
        
        // Create calendar event object
        const calendarEvent = {
          title: bookingData.title || 'Shooting Event',
          description: `
Customer: ${bookingData.customerName || 'N/A'}
Location: ${bookingData.location || 'N/A'}
Duration: ${bookingData.duration || '1 hour'}
Salary: $${bookingData.salary || '0'}
          `.trim(),
          location: bookingData.location || '',
          date: bookingData.date,
          time: bookingData.time,
          duration: bookingData.duration || '1 hour'
        };

        // Try to add directly to device calendar first
        const addedToDevice = await addToDeviceCalendar(calendarEvent);
        
        if (addedToDevice) {
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
          if (isIOS) {
            alert('Calendar file downloaded! Please open the Files app, find the .ics file, and tap "Add to Calendar" to add this event.');
          } else {
            alert('Event added to your device calendar!');
          }
          console.log('Calendar event processed for device');
        } else {
          // Fallback to download .ics file
          const icsResponse = await fetch(`/api/workspace/bookings/${bookingId}/calendar/download?t=${Date.now()}`);
          const blob = await icsResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          
          // Get filename from response headers or create default
          const contentDisposition = icsResponse.headers.get('content-disposition');
          let filename = 'booking.ics';
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch) {
              filename = filenameMatch[1];
            }
          }
          
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          alert('Calendar file downloaded. Please import it to your calendar app.');
          console.log('Calendar file downloaded as fallback');
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to get calendar data:', errorData);
        alert(errorData.error || 'Failed to add to calendar');
      }
    } catch (error) {
      console.error('Error adding to calendar:', error);
      alert('Failed to add to calendar');
    }
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

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const filteredBookings = bookings.filter(booking => {
    // With the new Booking structure, all bookings are for the current user
    // So we just need to filter by status
    
    if (filter === 'all') return true;
    return booking.bookingStatus === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-600 mb-4">Error: {error}</div>
        {retryCount < 3 && (
          <button
            onClick={retryFetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry (Attempt {retryCount + 1}/3)
          </button>
        )}
        {retryCount >= 3 && (
          <div className="text-gray-500">Maximum retry attempts reached. Please refresh the page.</div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-600">Manage your shooting assignments</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        {/* Desktop: Horizontal tabs */}
        <div className="hidden sm:flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {(['all', 'pending', 'accepted', 'declined', 'in_progress', 'completed', 'uploaded'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              {status !== 'all' && (
                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-200">
                  {bookings.filter(b => b.bookingStatus === status).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Mobile: Dropdown */}
        <div className="sm:hidden">
          <label htmlFor="filter-select" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Status
          </label>
          <select
            id="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
          >
            {(['all', 'pending', 'accepted', 'declined', 'in_progress', 'completed', 'uploaded'] as const).map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                {status !== 'all' && ` (${bookings.filter(b => b.bookingStatus === status).length})`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No bookings found</p>
          </div>
        ) : (
          filteredBookings.map((booking) => {
            // With new Booking structure, we don't need to find assignment
            // The booking itself contains the status
            
            return (
              <div 
                key={booking._id} 
                className={`bg-white rounded-lg shadow p-6 ${booking.eventId ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                onClick={() => booking.eventId && handleBookingClick(booking)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{booking.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <FiCalendar className="mr-1" />
                        {new Date(booking.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <FiClock className="mr-1" />
                        {booking.time}
                      </div>
                      {booking.duration && (
                        <div className="flex items-center">
                          <FiClock className="mr-1" />
                          {booking.duration}
                        </div>
                      )}
                      {booking.location && (
                        <div className="flex items-center">
                          <FiMapPin className="mr-1" />
                          {booking.location}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.bookingStatus)}`}>
                      {formatStatus(booking.bookingStatus)}
                    </span>
                    <div className={`w-3 h-3 rounded-full ${getAssignmentStatusColor(booking.bookingStatus || 'pending')}`}></div>
                  </div>
                </div>

                {booking.customerName && (
                  <div className="mb-4 text-sm text-gray-600">
                    <p><strong>Customer:</strong> {booking.customerName}</p>
                  </div>
                )}

                {booking.salary && (
                  <div className="mb-4 text-sm text-gray-600">
                    <p><strong>Salary:</strong> ${booking.salary}</p>
                  </div>
                )}

                {booking.paymentStatus && (
                  <div className="mb-4 text-sm text-gray-600">
                    <p><strong>Payment Status:</strong> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        booking.paymentStatus === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                      </span>
                    </p>
                  </div>
                )}

                {booking.bookingStatus === 'pending' && (
                  <div className="flex flex-col space-y-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleBookingResponse(booking._id, 'accept'); }}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <FiCheck className="mr-2" />
                        Accept
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleBookingResponse(booking._id, 'decline'); }}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <FiX className="mr-2" />
                        Decline
                      </button>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCalendarDownload(booking._id); }}
                      className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      <FiDownload className="mr-2" />
                      Add to Calendar
                    </button>
                  </div>
                )}

                {booking.bookingStatus === 'accepted' && (
                  <div className="flex flex-col space-y-2">
                    <span className="text-green-600 font-medium">✓ Accepted</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCalendarDownload(booking._id); }}
                      className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      <FiDownload className="mr-2" />
                      Add to Calendar
                    </button>
                  </div>
                )}

                {booking.bookingStatus === 'declined' && (
                  <div className="flex flex-col space-y-2">
                    <span className="text-red-600 font-medium">✗ Declined</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCalendarDownload(booking._id); }}
                      className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                    >
                      <FiDownload className="mr-2" />
                      Add to Calendar
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
