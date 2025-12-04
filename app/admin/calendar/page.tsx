'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiCalendar, FiClock, FiUser, FiMapPin, FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';

interface Inquiry {
  _id: string;
  caseId: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: string;
  createdAt: string;
}

interface ShootingEvent {
  _id: string;
  title: string;
  date: string;
  time: string;
  inquiryId?: string | { _id: string; name: string; email: string; phone: string };
  assignedCrew?: string[];
  bookingIds?: string[];
  crewAssignments?: {
    crewId: string;
    status: 'pending' | 'accepted' | 'declined';
    assignedAt: Date;
    respondedAt?: Date;
  }[];
  status: 'completed' | 'scheduled' | 'in-progress' | 'edited' | 'sent-to-customer' | 'cancelled';
  notes: string;
  location: string;
  duration: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  packageType: string;
}

interface Crew {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

const statusColors = {
  'scheduled': 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-yellow-100 text-yellow-800',
  'completed': 'bg-green-100 text-green-800',
  'cancelled': 'bg-red-100 text-red-800',
  'edited': 'bg-purple-100 text-purple-800',
  'sent-to-customer': 'bg-indigo-100 text-indigo-800'
};

const statusLabels = {
  'scheduled': 'Scheduled',
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
  'edited': 'Edited',
  'sent-to-customer': 'Sent to Customer'
};

export default function CalendarPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<ShootingEvent[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<ShootingEvent | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [showInquiryPanel, setShowInquiryPanel] = useState(false);
  const [crewSalaries, setCrewSalaries] = useState<Record<string, string>>({});
  const [crewPaymentStatuses, setCrewPaymentStatuses] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<{
    _id?: string;
    title: string;
    date: string;
    time: string;
    inquiryId: string;
    status: 'scheduled' | 'in-progress' | 'completed' | 'edited' | 'sent-to-customer' | 'cancelled';
    notes: string;
    location: string;
    duration: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    packageType: string;
    assignedCrew: Array<{
      crewId: string;
      salary: string;
      paymentStatus: string;
    }>;
    bookingIds?: string[];
  }>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    inquiryId: '',
    status: 'scheduled',
    notes: '',
    location: '',
    duration: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    packageType: '',
    assignedCrew: []
  });

  const [crewMembers, setCrewMembers] = useState<Crew[]>([]);
  const [availableCrew, setAvailableCrew] = useState<any[]>([]);
  const [eventBookings, setEventBookings] = useState<any[]>([]);
  const [showCrewPanel, setShowCrewPanel] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          router.push('/admin');
        } else {
          setIsClient(true);
          fetchData();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/admin');
      }
    };
    
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (isClient) {
      initializeCalendarData();
    }
  }, [currentDate, isClient]);

  const initializeCalendarData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchEvents(),
        fetchInquiries(),
        fetchCrew()
      ]);
    } catch (error) {
      console.error('Calendar initialization error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const retryFetch = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      initializeCalendarData();
    }
  };

  const fetchData = async () => {
    await Promise.all([
      fetchEvents(),
      fetchInquiries(),
      fetchCrew()
    ]);
  };

  const fetchEvents = async () => {
    try {
      console.log('Fetching shooting events...');
      // Get current month and year for API filtering
      const month = (currentDate.getMonth() + 1).toString();
      const year = currentDate.getFullYear().toString();
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`/api/shooting-events?month=${month}&year=${year}`, {
        credentials: 'include',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Events data received:', data);
        // API returns events array directly, not wrapped in { events: [] }
        setEvents(Array.isArray(data) ? data : []);
        console.log('Events state set to:', Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch events:', response.status);
        throw new Error(`Failed to fetch events: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch events';
      setError(errorMessage);
      setEvents([]); // Clear events on error
      throw error; // Re-throw to be caught by Promise.all
    }
  };

  const fetchInquiries = async () => {
    try {
      const response = await fetch('/api/admin/inquiries', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setInquiries(data.inquiries || []);
      } else {
        throw new Error(`Failed to fetch inquiries: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch inquiries';
      setError(errorMessage);
      setInquiries([]); // Clear inquiries on error
      throw error; // Re-throw to be caught by Promise.all
    }
  };

  const fetchCrew = async () => {
    try {
      console.log('Fetching crew for calendar...');
      const response = await fetch('/api/admin/crew', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Crew data received:', data);
        // API returns crew array directly, not wrapped in { crew: [] }
        setCrewMembers(Array.isArray(data) ? data : (data.crew || []));
      } else {
        throw new Error(`Failed to fetch crew: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching crew:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch crew';
      setError(errorMessage);
      setCrewMembers([]); // Clear crew on error
      throw error; // Re-throw to be caught by Promise.all
    }
  };

  const updateAvailableCrew = () => {
    console.log('Updating available crew...');
    console.log('Total crew members:', crewMembers.length);
    console.log('Current bookings:', eventBookings);
    
    // Get assigned crew IDs from bookings instead of assignedCrew array
    const assignedCrewIds = eventBookings.map((booking: any) => 
      booking.crewId._id || booking.crewId
    );
    
    console.log('Assigned crew IDs from bookings:', assignedCrewIds);
    
    const available = crewMembers.filter(crew => !assignedCrewIds.includes(crew._id));
    console.log('Available crew:', available);
    setAvailableCrew(available);
  };

  const addCrewToAssignment = async (crewId: string) => {
    try {
      console.log('Adding crew to assignment:', crewId);
      
      // For new events, add crew to assignedCrew array and create temporary booking object
      if (!(formData as any)._id) {
        console.log('New event - creating temporary booking');
        
        // Add to assignedCrew array
        setFormData({
          ...formData,
          assignedCrew: [...formData.assignedCrew, {
            crewId,
            salary: '',
            paymentStatus: 'pending'
          }]
        });
        
        // Create temporary booking object for display
        const crew = crewMembers.find(c => c._id === crewId);
        const tempBooking = {
          _id: `temp-${crewId}-${Date.now()}`, // Temporary ID
          crewId: crewId,
          eventId: null, // No event ID yet
          status: 'pending',
          assignedAt: new Date(),
          crew: crew // Include crew details for display
        };
        
        console.log('Adding temporary booking:', tempBooking);
        setEventBookings([...eventBookings, tempBooking]);
        updateAvailableCrew();
        return;
      }

      // For existing events, create actual bookings
      console.log('Existing event - creating real booking');
      const bookingData = {
        crewId: crewId,
        eventId: (formData as any)._id,
        status: 'pending',
        assignedAt: new Date()
      };

      const response = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
        credentials: 'include'
      });

      if (response.ok) {
        const newBooking = await response.json();
        console.log('Real booking created:', newBooking);
        setEventBookings([...eventBookings, newBooking.booking]);
        setFormData({
          ...formData,
          assignedCrew: [...formData.assignedCrew, {
            crewId,
            salary: '',
            paymentStatus: 'pending'
          }]
        });
        updateAvailableCrew();
      } else {
        const error = await response.json();
        console.error('Failed to create booking:', error);
        alert(`Error: ${error.error || 'Failed to add crew member'}`);
      }
    } catch (error) {
      console.error('Error adding crew:', error);
      alert('Error adding crew member. Please try again.');
    }
  };

  const removeCrewFromAssignment = async (crewId: string) => {
    try {
      console.log('Removing crew:', crewId);
      
      // For new events (no _id), just remove from assignedCrew array
      if (!(formData as any)._id) {
        console.log('New event - removing from assignedCrew array');
        setFormData({
          ...formData,
          assignedCrew: formData.assignedCrew.filter(assignment => assignment.crewId !== crewId)
        });
        updateAvailableCrew();
        return;
      }

      // For existing events, find and delete the booking
      const booking = eventBookings.find((b: any) => {
        const bookingCrewId = b.crewId._id || b.crewId;
        return bookingCrewId === crewId;
      });
      
      console.log('Found booking to delete:', booking);
      
      if (booking) {
        console.log('Deleting booking:', booking._id);
        const response = await fetch(`/api/admin/bookings/${booking._id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (response.ok) {
          console.log('Booking deleted successfully');
          // Remove from local state
          setEventBookings(eventBookings.filter((b: any) => b._id !== booking._id));
          setFormData({
            ...formData,
            assignedCrew: formData.assignedCrew.filter(assignment => assignment.crewId !== crewId)
          });
          updateAvailableCrew();
        } else {
          const error = await response.json();
          console.error('Failed to delete booking:', error);
          alert(`Error: ${error.error || 'Failed to remove crew member'}`);
        }
      } else {
        console.log('No booking found for crew:', crewId);
        // If no booking exists, just remove from assignedCrew
        setFormData({
          ...formData,
          assignedCrew: formData.assignedCrew.filter(assignment => assignment.crewId !== crewId)
        });
        updateAvailableCrew();
      }
    } catch (error) {
      console.error('Error removing crew:', error);
      alert('Error removing crew member. Please try again.');
    }
  };

  const updateCrewSalary = async (crewId: string, salary: string) => {
    try {
      console.log('Updating crew salary:', crewId, salary);
      
      // For existing events, update the booking
      if ((formData as any)._id) {
        const booking = eventBookings.find(b => (b.crewId._id || b.crewId) === crewId);
        if (booking) {
          const response = await fetch(`/api/admin/bookings/${booking._id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ salary })
          });
          
          if (response.ok) {
            // Update local state
            setEventBookings(prev => 
              prev.map(b => 
                (b.crewId._id || b.crewId) === crewId 
                  ? { ...b, salary }
                  : b
              )
            );
          } else {
            const error = await response.json();
            console.error('Error updating salary:', error);
          }
        }
      } else {
        // For new events, update the assignedCrew array
        setFormData(prev => ({
          ...prev,
          assignedCrew: prev.assignedCrew.map(assignment =>
            assignment.crewId === crewId
              ? { ...assignment, salary }
              : assignment
          )
        }));
      }
    } catch (error) {
      console.error('Error updating crew salary:', error);
    }
  };

  const updateCrewPaymentStatus = async (crewId: string, paymentStatus: string) => {
    try {
      console.log('Updating crew payment status:', crewId, paymentStatus);
      
      // For existing events, update the booking
      if ((formData as any)._id) {
        const booking = eventBookings.find(b => (b.crewId._id || b.crewId) === crewId);
        if (booking) {
          const response = await fetch(`/api/admin/bookings/${booking._id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ paymentStatus })
          });
          
          if (response.ok) {
            // Update local state
            setEventBookings(prev => 
              prev.map(b => 
                (b.crewId._id || b.crewId) === crewId 
                  ? { ...b, paymentStatus }
                  : b
              )
            );
          } else {
            const error = await response.json();
            console.error('Error updating payment status:', error);
          }
        }
      } else {
        // For new events, update the assignedCrew array
        setFormData(prev => ({
          ...prev,
          assignedCrew: prev.assignedCrew.map(assignment =>
            assignment.crewId === crewId
              ? { ...assignment, paymentStatus }
              : assignment
          )
        }));
      }
    } catch (error) {
      console.error('Error updating crew payment status:', error);
    }
  };

  const getAssignedCrewDetails = () => {
    console.log('Getting assigned crew details from bookings...');
    console.log('eventBookings:', eventBookings);
    
    // Use booking data directly instead of assignedCrew array
    return eventBookings.map((booking: any) => {
      // Handle both temporary bookings (with crew object) and real bookings (with crewId reference)
      let crewId, crewInfo;
      
      if (booking.crew) {
        // Temporary booking for new events
        crewId = booking.crewId;
        crewInfo = booking.crew;
      } else {
        // Real booking from database
        crewId = booking.crewId._id || booking.crewId;
        crewInfo = booking.crewId;
      }
      
      const crew = crewMembers.find(c => c._id === crewId);
      
      console.log(`Booking for crew ${crewId}:`, {
        crew: crew?.name || crewInfo?.name || 'Unknown',
        booking: booking,
        status: booking?.status || 'pending'
      });
      
      return {
        _id: crewId,
        name: crew?.name || crewInfo?.name || 'Unknown',
        email: crew?.email || crewInfo?.email || '',
        role: crew?.role || crewInfo?.role || '',
        status: booking?.status || 'pending',
        assignedAt: booking?.assignedAt
      };
    });
  };

  const cleanupBookings = async () => {
    if (eventBookings.length > 0 && !(formData as any)._id) {
      console.log('Cleaning up bookings for new event...');
      
      const deletePromises = eventBookings.map(async (booking: any) => {
        try {
          const response = await fetch(`/api/admin/bookings/${booking._id}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          if (response.ok) {
            console.log(`Deleted booking: ${booking._id}`);
          }
        } catch (error) {
          console.error(`Error deleting booking ${booking._id}:`, error);
        }
      });
      
      await Promise.all(deletePromises);
      console.log('All bookings cleaned up');
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setFormData({
      title: '',
      date: formatDate(date),
      time: '',
      inquiryId: '',
      status: 'scheduled',
      notes: '',
      location: '',
      duration: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      packageType: '',
      assignedCrew: [],
      bookingIds: []
    });
    setEditingEvent(null);
    setEventBookings([]);
    setShowInquiryPanel(false);
    setSelectedInquiry(null);
    setShowEventModal(true);
  };

  const handleNewShooting = () => {
    setFormData({
      title: '',
      date: formatDate(new Date()),
      time: '',
      inquiryId: '',
      status: 'scheduled',
      notes: '',
      location: '',
      duration: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      packageType: '',
      assignedCrew: []
    });
    setEditingEvent(null);
    setEventBookings([]);
    setCrewSalaries({});
    setCrewPaymentStatuses({});
    setShowInquiryPanel(false);
    setSelectedInquiry(null);
    setShowEventModal(true);
  };

  const handleEditEvent = async (event: ShootingEvent) => {
    let assignedCrewIds: string[] = [];
    
    console.log('Editing event:', event);
    console.log('Fetching bookings for event:', event._id);
    
    const response = await fetch(`/api/shooting-events/${event._id}/bookings`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const bookingData = await response.json();
      console.log('Booking data received:', bookingData);
      setEventBookings(bookingData.bookings || []);
      
      assignedCrewIds = bookingData.bookings?.map((booking: any) => {
        console.log('Processing booking:', booking);
        const crewId = booking.crewId._id || booking.crewId;
        console.log('Extracted crewId:', crewId);
        return crewId;
      }) || [];
      console.log('Assigned crew IDs from bookings:', assignedCrewIds);
      
      // Log the final bookings state
      console.log('Setting eventBookings to:', bookingData.bookings || []);
    } else {
      console.error('Failed to fetch bookings:', response.status);
      if (event.assignedCrew && Array.isArray(event.assignedCrew)) {
        console.log('Using event.assignedCrew:', event.assignedCrew);
        assignedCrewIds = event.assignedCrew.map(crew => {
          if (typeof crew === 'string') {
            return crew;
          }
          if (crew && typeof crew === 'object' && '_id' in crew) {
            return (crew as any)._id;
          }
          return String(crew);
        });
      } else if (event.crewAssignments && Array.isArray(event.crewAssignments)) {
        console.log('Using event.crewAssignments:', event.crewAssignments);
        assignedCrewIds = event.crewAssignments.map((ca: any) => String(ca.crewId));
      }
      console.log('Assigned crew IDs from fallback:', assignedCrewIds);
    }
    
    console.log('Setting form data with assignedCrew:', assignedCrewIds);
    setFormData({
      _id: event._id,
      title: event.title,
      date: new Date(event.date).toISOString().split('T')[0],
      time: event.time,
      inquiryId: (event.inquiryId && typeof event.inquiryId === 'object') ? event.inquiryId._id : event.inquiryId || '',
      status: event.status,
      notes: event.notes || '',
      location: event.location || '',
      duration: event.duration || '',
      customerName: event.customerName || '',
      customerEmail: event.customerEmail || '',
      customerPhone: event.customerPhone || '',
      packageType: event.packageType || '',
      assignedCrew: assignedCrewIds.map(crewId => ({
        crewId,
        salary: '',
        paymentStatus: 'pending'
      }))
    });
    
    setEditingEvent(event);
    
    if (event.inquiryId) {
      const inquiryId = typeof event.inquiryId === 'object' ? event.inquiryId._id : event.inquiryId;
      const inquiry = inquiries.find(i => i._id === inquiryId);
      if (inquiry) {
        setSelectedInquiry(inquiry);
        setShowInquiryPanel(true);
      }
    } else {
      setShowInquiryPanel(false);
      setSelectedInquiry(null);
    }
    
    setShowEventModal(true);
  };

  const handleEventClick = (event: ShootingEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    handleEditEvent(event);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingEvent ? `/api/shooting-events/${editingEvent._id}` : '/api/shooting-events';
      const method = editingEvent ? 'PUT' : 'POST';
      
      const apiData = editingEvent ? {
        ...formData,
        assignedCrew: formData.assignedCrew.map(assignment => assignment.crewId)
      } : {
        ...formData,
        assignedCrew: formData.assignedCrew.map(assignment => assignment.crewId),
        bookingIds: undefined
      };
      
      console.log('Sending API data:', apiData);
      console.log('URL:', url);
      console.log('Method:', method);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
        credentials: 'include'
      });
      
      if (response.ok) {
        console.log('Event created/updated successfully');
        const result = await response.json();
        console.log('Server response:', result);
        
        // For new events, create bookings for assigned crew with salary and payment status
        if (!editingEvent && formData.assignedCrew.length > 0) {
          const eventId = result._id || result.event._id;
          console.log('Creating bookings for new event:', eventId);
          
          for (const crewAssignment of formData.assignedCrew) {
            console.log('Creating booking for crewAssignment:', crewAssignment);
            try {
              const bookingData = {
                eventId,
                crewId: crewAssignment.crewId,
                salary: crewAssignment.salary,
                paymentStatus: crewAssignment.paymentStatus
              };
              console.log('Sending booking data:', bookingData);
              
              const bookingResponse = await fetch('/api/admin/bookings', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                  eventId,
                  crewId: crewAssignment.crewId,
                  salary: crewAssignment.salary,
                  paymentStatus: crewAssignment.paymentStatus
                })
              });
              
              if (bookingResponse.ok) {
                console.log('Booking created successfully for crew:', crewAssignment.crewId);
              } else {
                const bookingError = await bookingResponse.json();
                console.error('Error creating booking for crew:', crewAssignment.crewId, bookingError);
                console.error('Booking response status:', bookingResponse.status);
                console.error('Booking response headers:', Object.fromEntries(bookingResponse.headers.entries()));
              }
            } catch (bookingError) {
              console.error('Booking creation error:', bookingError);
            }
          }
        }
        
        await fetchEvents();
        await fetchCrew();
        setShowEventModal(false);
        setFormData({
          title: '',
          date: '',
          time: '',
          inquiryId: '',
          status: 'scheduled',
          notes: '',
          location: '',
          duration: '',
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          packageType: '',
          assignedCrew: [],
          bookingIds: []
        });
        setEditingEvent(null);
        setEventBookings([]);
        setCrewSalaries({});
        setCrewPaymentStatuses({});
        setShowInquiryPanel(false);
        setSelectedInquiry(null);
      } else {
        // Check if response is HTML (error page) instead of JSON
        const contentType = response.headers.get('content-type');
        let error;
        
        if (contentType && contentType.includes('text/html')) {
          // Got HTML instead of JSON - likely a 404 or server error page
          const htmlText = await response.text();
          console.error('Got HTML response instead of JSON:', htmlText.substring(0, 200));
          error = { error: 'Server returned HTML instead of JSON - API endpoint may not exist' };
        } else {
          try {
            error = await response.json();
          } catch (jsonError) {
            console.error('Failed to parse error response as JSON:', jsonError);
            const text = await response.text();
            console.error('Raw response text:', text.substring(0, 200));
            error = { error: 'Invalid JSON response from server' };
          }
        }
        
        console.error('Error response:', error);
        console.error('Response status:', response.status);
        alert(`Error: ${error.error || 'Failed to save shooting event'}${error.details ? '\nDetails: ' + error.details : ''}`);
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving shooting event. Please try again.');
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this shooting event?')) return;
    
    try {
      const response = await fetch(`/api/shooting-events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        await fetchEvents();
        setShowEventModal(false);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error deleting shooting event. Please try again.');
    }
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    console.log('Getting events for date:', dateStr);
    console.log('All events:', events);
    const filteredEvents = events.filter(event => {
      const eventDate = new Date(event.date).toISOString().split('T')[0];
      console.log(`Event "${event.title}" has date: ${event.date}, converted to: ${eventDate}`);
      return eventDate === dateStr;
    });
    console.log('Filtered events for', dateStr, ':', filteredEvents);
    return filteredEvents;
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  useEffect(() => {
    updateAvailableCrew();
  }, [formData.assignedCrew, crewMembers]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
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
        </div>
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="mr-4 text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Shooting Calendar</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200">
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

          <div className="p-1 sm:p-6">
            <div className="grid grid-cols-7 gap-0.5 sm:gap-4 mb-1 sm:mb-4">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div key={index} className="text-center text-xs sm:text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5 sm:gap-4">
              {Array.from({ length: firstDay }).map((_, index) => (
                <div key={`empty-${index}`} className="h-24 sm:h-24"></div>
              ))}

              {Array.from({ length: daysInMonth }).map((_, index) => {
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), index + 1);
                const dayEvents = getEventsForDate(date);
                const isToday = formatDate(date) === formatDate(new Date());

                return (
                  <div
                    key={index}
                    onClick={() => handleDateClick(date)}
                    className={`h-24 sm:h-24 border rounded-lg p-0.5 sm:p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isToday ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
                    }`}
                  >
                    <div className="sm:hidden h-full flex flex-col">
                      <div className="flex justify-between items-start mb-1 flex-shrink-0">
                        <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                          {index + 1}
                        </div>
                        {dayEvents.length > 0 && (
                          <div className="flex items-center">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            {dayEvents.length > 2 && (
                              <span className="text-xs text-gray-500 ml-1">{dayEvents.length}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-0.5 overflow-hidden">
                        {dayEvents.slice(0, 3).map((event, eventIndex) => (
                          <div
                            key={eventIndex}
                            onClick={(e) => handleEventClick(event, e)}
                            className={`text-xs p-0.5 rounded truncate cursor-pointer leading-tight ${statusColors[event.status]}`}
                          >
                            <div className="font-medium">{event.time}</div>
                            <div>{event.title}</div>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500">+{dayEvents.length - 3} more</div>
                        )}
                      </div>
                    </div>

                    <div className="hidden sm:block h-full">
                      <div className="text-sm font-medium mb-1">{index + 1}</div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event, eventIndex) => (
                          <div
                            key={eventIndex}
                            onClick={(e) => handleEventClick(event, e)}
                            className={`text-xs p-1 rounded truncate cursor-pointer ${statusColors[event.status]}`}
                          >
                            {event.time} - {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Events Table for Current Month */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Events for {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <p className="text-sm text-gray-500">All shooting events scheduled for this month</p>
          </div>
          
          <div className="overflow-x-auto">
            {events
              .filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.getMonth() === currentDate.getMonth() && 
                       eventDate.getFullYear() === currentDate.getFullYear();
              }).length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events
                  .filter(event => {
                    const eventDate = new Date(event.date);
                    return eventDate.getMonth() === currentDate.getMonth() && 
                           eventDate.getFullYear() === currentDate.getFullYear();
                  })
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((event) => (
                    <tr key={event._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{event.title}</div>
                          {event.packageType && (
                            <div className="text-sm text-gray-500">{event.packageType}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            <FiCalendar className="mr-1" />
                            {new Date(event.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-gray-500">
                            <FiClock className="mr-1" />
                            {event.time}
                            {event.duration && ` (${event.duration})`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {event.customerName ? (
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center">
                              <FiUser className="mr-1" />
                              {event.customerName}
                            </div>
                            {event.customerEmail && (
                              <div className="text-sm text-gray-500">{event.customerEmail}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No customer</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {event.location ? (
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center">
                              <FiMapPin className="mr-1" />
                              {event.location}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No location</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[event.status]}`}>
                          {statusLabels[event.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditEvent(event)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Event"
                          >
                            <FiEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(event._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Event"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            ) : (
              <div className="text-center py-12">
                <FiCalendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No events this month</h3>
                <p className="text-gray-500 mb-4">
                  There are no shooting events scheduled for {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </p>
                <button
                  onClick={() => {
                    setEditingEvent(null);
                    setShowEventModal(true);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                >
                  <FiPlus className="mr-2" />
                  Create First Event
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-7xl h-[90vh] sm:h-[95vh] overflow-hidden flex flex-col">
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
              {/* Main Form */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto order-1 lg:order-1">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {editingEvent ? 'Edit Shooting' : 'Add Shooting'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowEventModal(false);
                      setShowInquiryPanel(false);
                      setSelectedInquiry(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Main Fields */}
                    <div className="space-y-3 lg:col-span-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Shooting Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                            placeholder="e.g., Wedding Photography - John & Jane"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Related Inquiry
                          </label>
                          <select
                            value={formData.inquiryId}
                            onChange={(e) => {
                              setFormData({ ...formData, inquiryId: e.target.value });
                              if (e.target.value) {
                                const inquiry = inquiries.find(i => i._id === e.target.value);
                                if (inquiry) {
                                  setSelectedInquiry(inquiry);
                                  setShowInquiryPanel(true);
                                  setFormData(prev => ({
                                    ...prev,
                                    inquiryId: e.target.value,
                                    customerName: inquiry.name,
                                    customerEmail: inquiry.email
                                  }));
                                }
                              } else {
                                setShowInquiryPanel(false);
                                setSelectedInquiry(null);
                                setFormData(prev => ({
                                  ...prev,
                                  inquiryId: '',
                                  customerName: '',
                                  customerEmail: ''
                                }));
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                          >
                            <option value="">Select an inquiry (optional)</option>
                            {inquiries.map(inquiry => (
                              <option key={inquiry._id} value={inquiry._id}>
                                {inquiry.name} - {inquiry.subject}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                          >
                            {Object.entries(statusLabels).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Package Type
                          </label>
                          <input
                            type="text"
                            value={formData.packageType}
                            onChange={(e) => setFormData({ ...formData, packageType: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                            placeholder="e.g., Premium Wedding Package"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date *
                          </label>
                          <input
                            type="date"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Time *
                          </label>
                          <input
                            type="time"
                            required
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duration
                          </label>
                          <input
                            type="text"
                            value={formData.duration}
                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                            placeholder="e.g., 2 hours, Half day"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location
                          </label>
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                            placeholder="e.g., Central Park, NYC"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Customer Name
                          </label>
                          <input
                            type="text"
                            value={formData.customerName}
                            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                            placeholder="Customer name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Customer Email
                          </label>
                          <input
                            type="email"
                            value={formData.customerEmail}
                            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                            placeholder="customer@email.com"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Customer Phone
                          </label>
                          <input
                            type="tel"
                            value={formData.customerPhone}
                            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                            placeholder="(555) 123-4567"
                          />
                        </div>
                      </div>

                      {/* Notes Section */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes
                        </label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          rows={10}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm resize-none"
                          placeholder="Additional notes about the shooting..."
                        />
                      </div>
                    </div>

                    {/* Right Column - Crew Members (Full Width) */}
                    <div className="lg:col-span-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Assign Crew Members
                        </label>
                        
                        <div className="border border-gray-300 rounded-lg overflow-hidden max-h-32 overflow-y-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Crew Member
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Salary
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Payment Status
                                </th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {formData.assignedCrew.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="px-3 py-2 text-center text-sm text-gray-500">
                                    No crew members assigned
                                  </td>
                                </tr>
                              ) : (
                                formData.assignedCrew.map((crewAssignment) => {
                                  const crew = crewMembers.find(c => c._id === crewAssignment.crewId);
                                  const booking = eventBookings.find(b => (b.crewId._id || b.crewId) === crewAssignment.crewId);
                                  if (!crew) return null;
                                  const bookingStatus = booking?.status || 'pending';
                                  const salary = booking?.salary || crewAssignment.salary || '';
                                  const paymentStatus = booking?.paymentStatus || crewAssignment.paymentStatus || 'pending';
                                  return (
                                    <tr key={crewAssignment.crewId}>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                        {crew.name}
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                          bookingStatus === 'confirmed' ? 'bg-green-100 text-green-800' :
                                          bookingStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                          bookingStatus === 'declined' ? 'bg-red-100 text-red-800' :
                                          bookingStatus === 'uploaded' ? 'bg-purple-100 text-purple-800' :
                                          bookingStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                                          bookingStatus === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                          bookingStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {bookingStatus === 'in_progress' ? 'In Progress' : 
                                           bookingStatus === 'in-progress' ? 'In Progress' :
                                           bookingStatus === 'uploaded' ? 'Uploaded' :
                                           bookingStatus}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                        <div className="flex items-center">
                                          <span className="text-gray-500 mr-1">$</span>
                                          <input
                                            type="text"
                                            defaultValue={salary}
                                            onBlur={(e) => updateCrewSalary(crewAssignment.crewId, e.target.value)}
                                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-black"
                                            placeholder="0"
                                          />
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap">
                                        <select
                                          value={paymentStatus}
                                          onChange={(e) => updateCrewPaymentStatus(crewAssignment.crewId, e.target.value)}
                                          className="w-28 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-black"
                                        >
                                          <option value="pending">Pending</option>
                                          <option value="completed">Completed</option>
                                        </select>
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                          type="button"
                                          onClick={() => removeCrewFromAssignment(crew._id)}
                                          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                        >
                                          Remove
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                        
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => setShowCrewPanel(true)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                          >
                            Add Crew
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between pt-3 gap-3 border-t border-gray-200 bg-white">
                    <div>
                      {editingEvent && (
                        <button
                          type="button"
                          onClick={() => editingEvent && handleDelete(editingEvent._id)}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 w-full sm:w-auto text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                      <button
                        type="button"
                        onClick={async () => {
                          await cleanupBookings();
                          setShowEventModal(false);
                          setShowInquiryPanel(false);
                          setSelectedInquiry(null);
                        }}
                        className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 w-full sm:w-auto text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 w-full sm:w-auto text-sm"
                      >
                        {editingEvent ? 'Update' : 'Create'} Shooting
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Inquiry Panel */}
              {showInquiryPanel && selectedInquiry && (
                <div className="lg:w-96 w-full lg:border-l border-t border-gray-200 bg-gray-50 p-4 sm:p-6 overflow-y-auto lg:max-h-full max-h-64">
                  {/* Mobile Header */}
                  <div className="lg:hidden mb-4 pb-3 border-b border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900">Inquiry Details</h4>
                  </div>

                  {/* Desktop Header */}
                  <div className="hidden lg:block mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Inquiry Details</h4>
                  </div>

                  {/* Customer Info Card */}
                  <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">{selectedInquiry?.name || 'Unknown'}</h5>
                        <p className="text-sm text-gray-500">{selectedInquiry?.email || 'No email'}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="font-medium">Case ID:</span>
                      <span className="ml-1">{selectedInquiry?.caseId || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Status</span>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        selectedInquiry?.status === 'new' ? 'bg-green-100 text-green-800' :
                        selectedInquiry?.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                        selectedInquiry?.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedInquiry?.status || 'unknown'}
                      </span>
                    </div>
                  </div>

                  {/* Subject */}
                  {selectedInquiry?.subject && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-sm text-gray-900">{selectedInquiry.subject}</p>
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedInquiry?.message || 'No message'}</p>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="text-xs text-gray-500 pt-3 border-t border-gray-200">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {selectedInquiry ? `${new Date(selectedInquiry.createdAt).toLocaleDateString()} at ${new Date(selectedInquiry.createdAt).toLocaleTimeString()}` : ''}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showCrewPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Select Crew Members</h3>
              <button
                onClick={() => setShowCrewPanel(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
              {(() => {
                console.log('Crew panel opened - availableCrew length:', availableCrew.length);
                console.log('availableCrew:', availableCrew);
                return null;
              })()}
              {availableCrew.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No available crew members to add</p>
                  <p className="text-sm text-gray-400 mt-2">All crew members have been assigned</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableCrew.map((crew) => (
                    <div key={crew._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {crew.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{crew.name}</p>
                          <p className="text-xs text-gray-500">{crew.email}</p>
                          <p className="text-xs text-gray-400 capitalize">{crew.role}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => addCrewToAssignment(crew._id)}
                        className="px-3 py-1 text-sm bg-black text-white rounded hover:bg-gray-800"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
