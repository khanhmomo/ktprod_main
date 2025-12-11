'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiCalendar, FiClock, FiMapPin, FiUser, FiArrowLeft, FiCamera, FiCheckCircle, FiUpload, FiLoader, FiDollarSign, FiCreditCard, FiExternalLink } from 'react-icons/fi';

interface ShootingEvent {
  _id: string;
  title: string;
  date: string;
  time: string;
  duration?: string;
  location?: string;
  notes?: string;
  customerName?: string;
  customerEmail?: string;
  status: string;
  bookingStatus: string;
  bookingId: string;
  salary?: string;
  paymentStatus?: 'pending' | 'completed';
}

export default function ShootingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [shooting, setShooting] = useState<ShootingEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('');

  const statusOptions = [
    { value: 'accepted', label: 'Accepted', icon: FiCheckCircle, color: 'green' },
    { value: 'in_progress', label: 'In Progress', icon: FiLoader, color: 'blue' },
    { value: 'completed', label: 'Completed', icon: FiCheckCircle, color: 'green' },
    { value: 'uploaded', label: 'Uploaded', icon: FiUpload, color: 'indigo' }
  ];

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  useEffect(() => {
    fetchShootingDetails();
  }, [params.id]);

  const fetchShootingDetails = async () => {
    try {
      const response = await fetch(`/api/workspace/shootings/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setShooting(data.shooting);
        setCurrentStatus(data.shooting.bookingStatus || 'accepted');
      } else {
        console.error('Failed to fetch shooting details');
      }
    } catch (error) {
      console.error('Error fetching shooting details:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      console.log('Updating status to:', newStatus, 'for booking:', shooting?.bookingId);
      
      const response = await fetch(`/api/workspace/bookings/${shooting?.bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Status updated successfully:', data);
        console.log('Setting current status to:', newStatus);
        setCurrentStatus(newStatus);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to update status:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleGoogleCalendar = async () => {
    try {
      const response = await fetch(`/api/workspace/bookings/${shooting?.bookingId}/google-calendar`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.needsAuth) {
        // User needs to grant calendar access
        window.location.href = data.authUrl;
        return;
      }

      if (data.message === 'Token refreshed, please try again') {
        // Token was refreshed, try again automatically
        setTimeout(() => {
          handleGoogleCalendar();
        }, 1000);
        return;
      }

      if (data.success) {
        alert('Event added to your Google Calendar successfully!');
      } else {
        alert(data.error || 'Failed to add to Google Calendar');
      }
    } catch (error) {
      console.error('Error adding to Google Calendar:', error);
      alert('Failed to add to Google Calendar');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!shooting) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Shooting not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiArrowLeft className="mr-2" />
          Back to Calendar
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{shooting.title}</h1>
      </div>

      {/* Shooting Details */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Shooting Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center text-gray-600">
              <FiCalendar className="mr-2" />
              {new Date(shooting.date).toLocaleDateString()}
            </div>
            <div className="flex items-center text-gray-600">
              <FiClock className="mr-2" />
              {shooting.time}
              {shooting.duration && ` (${shooting.duration})`}
            </div>
            {shooting.location && (
              <div className="flex items-center text-gray-600">
                <FiMapPin className="mr-2" />
                {shooting.location}
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            {shooting.customerName && (
              <div className="flex items-center text-gray-600">
                <FiUser className="mr-2" />
                <span className="font-medium">Customer:</span>
                <span className="ml-1">{shooting.customerName}</span>
              </div>
            )}
            {shooting.salary && (
              <div className="flex items-center text-gray-600">
                <FiDollarSign className="mr-2 text-green-600" />
                <span className="font-medium text-green-600">Salary:</span>
                <span className="ml-1 text-green-700 font-semibold">${shooting.salary}</span>
              </div>
            )}
            {shooting.paymentStatus && (
              <div className="flex items-center text-gray-600">
                <FiCreditCard className="mr-2 text-blue-600" />
                <span className="font-medium text-blue-600">Payment:</span>
                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  shooting.paymentStatus === 'completed' 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                }`}>
                  {shooting.paymentStatus.charAt(0).toUpperCase() + shooting.paymentStatus.slice(1)}
                </span>
              </div>
            )}
            <div className="flex items-center text-gray-600">
              <FiCamera className="mr-2" />
              Status: <span className="ml-2 font-medium">{formatStatus(currentStatus)}</span>
            </div>
          </div>
        </div>

        {/* Google Calendar Button */}
        <div className="mt-4">
          <button
            onClick={handleGoogleCalendar}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FiExternalLink className="mr-2" />
            Add to Google Calendar
          </button>
        </div>

        {shooting.notes && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
            <p className="text-gray-600">{shooting.notes}</p>
          </div>
        )}
      </div>

      {/* Status Update */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Update Status</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statusOptions.map((option) => {
            const Icon = option.icon;
            const isActive = currentStatus === option.value;
            
            return (
              <button
                key={option.value}
                onClick={() => updateStatus(option.value)}
                disabled={updating || isActive}
                className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                  isActive
                    ? option.color === 'green' ? 'border-green-500 bg-green-50 text-green-700' :
                    option.color === 'blue' ? 'border-blue-500 bg-blue-50 text-blue-700' :
                    option.color === 'indigo' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' :
                    'border-gray-200 bg-gray-50 text-gray-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Icon className={`text-2xl mb-2 ${
                  isActive 
                    ? option.color === 'green' ? 'text-green-600' :
                    option.color === 'blue' ? 'text-blue-600' :
                    option.color === 'indigo' ? 'text-indigo-600' :
                    'text-gray-600'
                    : 'text-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  isActive 
                    ? option.color === 'green' ? 'text-green-700' :
                    option.color === 'blue' ? 'text-blue-700' :
                    option.color === 'indigo' ? 'text-indigo-700' :
                    'text-gray-700'
                    : 'text-gray-600'
                }`}>
                  {option.label}
                </span>
                {isActive && (
                  <div className={`mt-2 px-2 py-1 text-white text-xs rounded-full ${
                    option.color === 'green' ? 'bg-green-500' :
                    option.color === 'blue' ? 'bg-blue-500' :
                    option.color === 'indigo' ? 'bg-indigo-500' :
                    'bg-gray-500'
                  }`}>
                    Current
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {updating && (
          <div className="mt-4 text-center text-gray-600">
            Updating status...
          </div>
        )}
      </div>
    </div>
  );
}
