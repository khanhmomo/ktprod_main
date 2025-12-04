'use client';

import { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiClock, FiMapPin, FiUser, FiPackage, FiUsers } from 'react-icons/fi';

interface ShootingEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId?: string;
  onEventSaved?: () => void;
}

interface FormData {
  _id?: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  packageType: string;
  notes: string;
  inquiryId: string;
  status: string;
  assignedCrew: string[];
}

interface Crew {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Inquiry {
  _id: string;
  caseId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
}

const statusLabels: { [key: string]: string } = {
  'scheduled': 'Scheduled',
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'cancelled': 'Cancelled'
};

export default function ShootingEventModal({ isOpen, onClose, eventId, onEventSaved }: ShootingEventModalProps) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    date: '',
    time: '',
    duration: '',
    location: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    packageType: '',
    notes: '',
    inquiryId: '',
    status: 'scheduled',
    assignedCrew: []
  });

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [crewMembers, setCrewMembers] = useState<Crew[]>([]);
  const [availableCrew, setAvailableCrew] = useState<Crew[]>([]);
  const [showCrewPanel, setShowCrewPanel] = useState(false);
  const [showInquiryPanel, setShowInquiryPanel] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(false);
  const [eventBookings, setEventBookings] = useState<any[]>([]);
  const [showFreelanceForm, setShowFreelanceForm] = useState(false);
  const [freelanceCrew, setFreelanceCrew] = useState({
    name: '',
    email: '',
    phone: '',
    specialties: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchInquiries();
      fetchCrew();
      if (eventId) {
        fetchEventDetails(eventId);
      }
    }
  }, [isOpen, eventId]);

  // Additional effect to handle inquiry selection when inquiries are loaded
  useEffect(() => {
    if (isOpen && eventId && formData.inquiryId && inquiries.length > 0) {
      const inquiry = inquiries.find(i => i._id === formData.inquiryId);
      if (inquiry && !selectedInquiry) {
        setSelectedInquiry(inquiry);
        setShowInquiryPanel(true);
      }
    }
  }, [isOpen, eventId, formData.inquiryId, inquiries, selectedInquiry]);

  const fetchInquiries = async () => {
    try {
      const response = await fetch('/api/inquiries');
      if (response.ok) {
        const data = await response.json();
        setInquiries(data.inquiries || []);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    }
  };

  const fetchCrew = async () => {
    try {
      const response = await fetch('/api/admin/crew', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCrewMembers(Array.isArray(data) ? data : (data.crew || []));
      }
    } catch (error) {
      console.error('Error fetching crew:', error);
    }
  };

  const fetchEventDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/shooting-events/${id}`);
      if (response.ok) {
        const event = await response.json();
        
        // Fetch bookings for this event
        const bookingsResponse = await fetch(`/api/shooting-events/${id}/bookings`);
        let assignedCrewIds: string[] = [];
        
        if (bookingsResponse.ok) {
          const bookingData = await bookingsResponse.json();
          setEventBookings(bookingData.bookings || []);
          assignedCrewIds = bookingData.bookings?.map((booking: any) => {
            const crewId = booking.crewId._id || booking.crewId;
            return crewId;
          }) || [];
        }

        // Set form data first
        setFormData({
          _id: event._id,
          title: event.title,
          date: formatDate(new Date(event.date)),
          time: event.time,
          duration: event.duration || '',
          location: event.location || '',
          customerName: event.customerName || '',
          customerEmail: event.customerEmail || '',
          customerPhone: event.customerPhone || '',
          packageType: event.packageType || '',
          notes: event.notes || '',
          inquiryId: (event.inquiryId && typeof event.inquiryId === 'object') ? event.inquiryId._id : event.inquiryId || '',
          status: event.status,
          assignedCrew: assignedCrewIds
        });

        // Set selected inquiry if exists (after inquiries are loaded)
        if (event.inquiryId) {
          const inquiryId = typeof event.inquiryId === 'object' ? event.inquiryId._id : event.inquiryId;
          
          // If inquiries are already loaded, set the inquiry immediately
          if (inquiries.length > 0) {
            const inquiry = inquiries.find(i => i._id === inquiryId);
            if (inquiry) {
              setSelectedInquiry(inquiry);
              setShowInquiryPanel(true);
            }
          } else {
            // Otherwise, wait a bit and try again
            setTimeout(() => {
              const inquiry = inquiries.find(i => i._id === inquiryId);
              if (inquiry) {
                setSelectedInquiry(inquiry);
                setShowInquiryPanel(true);
              }
            }, 100);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = eventId ? `/api/shooting-events/${eventId}` : '/api/shooting-events';
      const method = eventId ? 'PUT' : 'POST';
      
      const apiData = eventId ? formData : {
        ...formData,
        bookingIds: undefined
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
        credentials: 'include'
      });

      if (response.ok) {
        onEventSaved?.();
        onClose();
        resetForm();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to save event'}`);
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      date: '',
      time: '',
      duration: '',
      location: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      packageType: '',
      notes: '',
      inquiryId: '',
      status: 'scheduled',
      assignedCrew: []
    });
    setSelectedInquiry(null);
    setShowInquiryPanel(false);
    setEventBookings([]);
  };

  const updateAvailableCrew = () => {
    const assignedCrewIds = eventBookings.map((booking: any) => 
      booking.crewId._id || booking.crewId
    );
    const available = crewMembers.filter(crew => !assignedCrewIds.includes(crew._id));
    setAvailableCrew(available);
  };

  const addCrewToAssignment = async (crewId: string) => {
    try {
      if (!eventId) {
        setFormData({
          ...formData,
          assignedCrew: [...formData.assignedCrew, crewId]
        });
        updateAvailableCrew();
        return;
      }

      const bookingData = {
        crewId: crewId,
        eventId: eventId,
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
        setEventBookings([...eventBookings, newBooking.booking]);
        setFormData({
          ...formData,
          assignedCrew: [...formData.assignedCrew, crewId]
        });
        updateAvailableCrew();
      }
    } catch (error) {
      console.error('Error adding crew:', error);
      alert('Error adding crew member. Please try again.');
    }
  };

  const addFreelanceCrew = async () => {
    try {
      if (!freelanceCrew.name || !freelanceCrew.email) {
        alert('Please fill in name and email for freelance crew');
        return;
      }

      const bookingData = {
        eventId: eventId,
        freelanceCrew: {
          name: freelanceCrew.name,
          email: freelanceCrew.email,
          phone: freelanceCrew.phone,
          specialties: freelanceCrew.specialties.split(',').map(s => s.trim()).filter(s => s)
        },
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
        setEventBookings([...eventBookings, newBooking.booking]);
        setShowFreelanceForm(false);
        setFreelanceCrew({ name: '', email: '', phone: '', specialties: '' });
        alert('Freelance crew added successfully!');
      } else {
        const error = await response.json();
        alert('Failed to add freelance crew: ' + error.error);
      }
    } catch (error) {
      console.error('Error adding freelance crew:', error);
      alert('Failed to add freelance crew');
    }
  };

  const removeCrewFromAssignment = async (crewId: string) => {
    try {
      if (!eventId) {
        setFormData({
          ...formData,
          assignedCrew: formData.assignedCrew.filter(id => id !== crewId)
        });
        updateAvailableCrew();
        return;
      }

      const booking = eventBookings.find((b: any) => {
        const bookingCrewId = b.crewId._id || b.crewId;
        return bookingCrewId === crewId;
      });
      
      if (booking) {
        const response = await fetch(`/api/admin/bookings/${booking._id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (response.ok) {
          setEventBookings(eventBookings.filter((b: any) => b._id !== booking._id));
          setFormData({
            ...formData,
            assignedCrew: formData.assignedCrew.filter(id => id !== crewId)
          });
          updateAvailableCrew();
        }
      }
    } catch (error) {
      console.error('Error removing crew:', error);
      alert('Error removing crew member. Please try again.');
    }
  };

  const getAssignedCrewDetails = () => {
    return eventBookings.map((booking: any) => {
      let crewId, crewInfo;
      
      if (booking.crew) {
        crewId = booking.crewId;
        crewInfo = booking.crew;
      } else {
        crewId = booking.crewId._id || booking.crewId;
        crewInfo = booking.crewId;
      }
      
      const crew = crewMembers.find(c => c._id === crewId);
      
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

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Main Form */}
          <div className="flex-1 p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {eventId ? 'Edit Shooting' : 'Add Shooting'}
              </h3>
              <button
                onClick={() => {
                  onClose();
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
                <div className="space-y-3">
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
                        placeholder="Phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm resize-none"
                      placeholder="Additional notes about the shooting..."
                    />
                  </div>
                </div>

                {/* Right Column - Crew Assignment */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-semibold">Crew Assignment</h4>
                      <button
                        type="button"
                        onClick={() => setShowCrewPanel(true)}
                        className="px-3 py-1 bg-black text-white rounded-lg hover:bg-gray-800 text-sm"
                      >
                        Add Crew
                      </button>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      {getAssignedCrewDetails().length === 0 ? (
                        <p className="text-gray-500 text-center py-4 text-sm">No crew members assigned</p>
                      ) : (
                        <div className="space-y-2">
                          {getAssignedCrewDetails().map((crew) => (
                            <div key={crew._id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                              <div>
                                <p className="font-medium text-sm">{crew.name}</p>
                                <p className="text-xs text-gray-500">{crew.role}</p>
                                <p className="text-xs text-gray-400">{crew.email}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  crew.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                  crew.status === 'declined' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {crew.status}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeCrewFromAssignment(crew._id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <FiX />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setShowInquiryPanel(false);
                    setSelectedInquiry(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm"
                >
                  {loading ? 'Saving...' : (eventId ? 'Update Shooting' : 'Add Shooting')}
                </button>
              </div>
            </form>
          </div>

          {/* Right Panel - Inquiry Details */}
          {showInquiryPanel && selectedInquiry && (
            <div className="w-80 border-l bg-gray-50 p-4">
              <h4 className="text-md font-semibold mb-4">Inquiry Details</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-700">Case ID</p>
                  <p className="text-sm">{selectedInquiry.caseId}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700">Name</p>
                  <p className="text-sm">{selectedInquiry.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700">Email</p>
                  <p className="text-sm">{selectedInquiry.email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700">Subject</p>
                  <p className="text-sm">{selectedInquiry.subject}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700">Message</p>
                  <p className="text-sm text-gray-600">{selectedInquiry.message}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Crew Selection Modal */}
      {showCrewPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold">Select Crew Members</h3>
              <button
                onClick={() => setShowCrewPanel(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {/* Freelance Crew Option */}
              <div className="mb-4">
                <button
                  onClick={() => setShowFreelanceForm(!showFreelanceForm)}
                  className="w-full p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="text-center">
                    <FiUser className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <p className="font-medium text-blue-600">Add Freelance Crew</p>
                    <p className="text-xs text-gray-500">Invite a new crew member by email</p>
                  </div>
                </button>
              </div>

              {/* Freelance Form */}
              {showFreelanceForm && (
                <div className="mb-4 p-4 border border-blue-300 rounded-lg bg-blue-50">
                  <h4 className="font-medium mb-3">Freelance Crew Details</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={freelanceCrew.name}
                        onChange={(e) => setFreelanceCrew({...freelanceCrew, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="John Photographer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        value={freelanceCrew.email}
                        onChange={(e) => setFreelanceCrew({...freelanceCrew, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={freelanceCrew.phone}
                        onChange={(e) => setFreelanceCrew({...freelanceCrew, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="555-1234"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Specialties</label>
                      <input
                        type="text"
                        value={freelanceCrew.specialties}
                        onChange={(e) => setFreelanceCrew({...freelanceCrew, specialties: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Photography, Portrait, Wedding"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={addFreelanceCrew}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Add Freelance
                      </button>
                      <button
                        onClick={() => {
                          setShowFreelanceForm(false);
                          setFreelanceCrew({ name: '', email: '', phone: '', specialties: '' });
                        }}
                        className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Divider */}
              {showFreelanceForm && (
                <div className="mb-4 flex items-center">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="px-3 text-xs text-gray-500">OR</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>
              )}

              {/* Existing Crew */}
              {availableCrew.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No available crew members</p>
              ) : (
                <div className="space-y-3">
                  {availableCrew.map((crew) => (
                    <div key={crew._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{crew.name}</p>
                        <p className="text-sm text-gray-500">{crew.role}</p>
                        <p className="text-xs text-gray-400">{crew.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          addCrewToAssignment(crew._id);
                          setShowCrewPanel(false);
                        }}
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm"
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
