'use client';

import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiFilter, FiMail, FiCheck, FiClock, FiX, FiMessageSquare, FiUser, FiCalendar, FiTrash2, FiWifi, FiWifiOff } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';

interface Inquiry {
  _id: string;
  caseId: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  source: 'email' | 'live_chat';
  repliedAt?: string;
  replyNote?: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Stats {
  total: number;
  unread: number;
  read: number;
  replied: number;
  email: number;
  live_chat: number;
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [replyNote, setReplyNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newInquiryNotification, setNewInquiryNotification] = useState<Inquiry | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInquiry, setNewInquiry] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    source: 'email' as 'email' | 'live_chat' | 'phone' | 'in_person' | 'other'
  });
  const socketRef = useRef<Socket | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [stats, setStats] = useState<Stats>({
    total: 0,
    unread: 0,
    read: 0,
    replied: 0,
    email: 0,
    live_chat: 0
  });

  // Initialize WebSocket connection
  useEffect(() => {
    console.log('🔌 Initializing WebSocket connection...');
    
    const socketInstance = io({
      path: '/api/socket/io',
      addTrailingSlash: false,
      transports: ['polling', 'websocket'], // Try polling first, then websocket
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('✅ Connected to WebSocket server:', socketInstance.id);
      setIsConnected(true);
      // Join admin room
      console.log('👤 Attempting to join admin room...');
      socketInstance.emit('join-admin', { timestamp: Date.now() });
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Disconnected from WebSocket server:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error: any) => {
      console.error('🚫 WebSocket connection error:', error);
      console.error('🚫 Error details:', error.message, (error as any).description, (error as any).context, (error as any).type);
      setIsConnected(false);
    });

    socketInstance.io.on('error', (error) => {
      console.error('🚫 Socket.IO engine error:', error);
    });

    socketInstance.io.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt:', attemptNumber);
    });

    socketInstance.io.on('reconnect', (attemptNumber) => {
      console.log('✅ Reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
    });

    socketInstance.on('joined-admin', (data) => {
      console.log('✅ Successfully joined admin room:', data);
    });

    socketInstance.on('pong', (data) => {
      console.log('🏓 Pong received:', data);
    });

    // Listen for new inquiries
    socketInstance.on('new-inquiry', (data) => {
      console.log('🔔 Real-time new-inquiry event received:', data);
      
      // Validate data structure
      if (!data || !data.inquiry || !data.stats) {
        console.error('❌ Invalid new-inquiry data:', data);
        return;
      }
      
      console.log('📊 Updating stats:', data.stats);
      // Update stats
      setStats(data.stats);
      
      // Add new inquiry to the list (if it matches current filters)
      if (statusFilter === 'all' || statusFilter === 'unread') {
        console.log('📝 Adding new inquiry to list:', data.inquiry.caseId);
        setInquiries(prev => [data.inquiry, ...prev].slice(0, pagination.limit));
      }
      
      // Show notification
      setNewInquiryNotification(data.inquiry);
      setShowNotification(true);
      
      console.log('🔔 Showing notification for:', data.inquiry.caseId);
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    });

    // Listen for inquiry updates
    socketInstance.on('inquiry-updated', (data) => {
      console.log('🔄 Real-time inquiry-updated event received:', data);
      
      // Validate data structure
      if (!data || !data.inquiry || !data.stats) {
        console.error('❌ Invalid inquiry-updated data:', data);
        return;
      }
      
      console.log('📊 Updating stats:', data.stats);
      // Update stats
      setStats(data.stats);
      
      console.log('📝 Updating inquiry in list:', data.inquiry.caseId);
      // Update inquiry in the list
      setInquiries(prev => prev.map(inquiry => 
        inquiry._id === data.inquiry._id ? data.inquiry : inquiry
      ));
      
      // Update selected inquiry if it's the same one
      if (selectedInquiry && selectedInquiry._id === data.inquiry._id) {
        console.log('🎯 Updating selected inquiry:', data.inquiry.caseId);
        setSelectedInquiry(data.inquiry);
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [statusFilter, pagination.limit, selectedInquiry]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(sourceFilter !== 'all' && { source: sourceFilter }),
                ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/inquiries?${params}`);
      if (response.ok) {
        const data = await response.json();
        setInquiries(data.inquiries);
        setPagination(data.pagination);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter, sourceFilter, pagination.page, searchTerm]);

  const createInquiry = async () => {
    try {
      setUpdating(true);
      
      const response = await fetch('/api/admin/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newInquiry.name.trim(),
          email: newInquiry.email.trim(),
          subject: newInquiry.subject.trim(),
          message: newInquiry.message.trim(),
          source: newInquiry.source
        }),
      });

      if (response.ok) {
        const inquiry = await response.json();
        alert(`Inquiry created successfully!\nCase ID: ${inquiry.caseId}`);
        
        // Reset form and close modal
        setNewInquiry({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
          source: 'email'
        });
        setShowCreateModal(false);
        
        // Refresh inquiries list
        fetchInquiries();
      } else {
        const error = await response.json();
        alert(`Failed to create inquiry: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating inquiry:', error);
      alert('Failed to create inquiry. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const updateInquiryStatus = async (inquiryId: string, status: string, note?: string) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          replyNote: note || replyNote
        }),
      });

      if (response.ok) {
        await fetchInquiries();
        if (selectedInquiry?._id === inquiryId) {
          setSelectedInquiry(null);
          setReplyNote('');
        }
      }
    } catch (error) {
      console.error('Error updating inquiry:', error);
    } finally {
      setUpdating(false);
    }
  };

  const deleteInquiry = async (inquiryId: string) => {
    if (!confirm('Are you sure you want to delete this inquiry?')) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchInquiries();
        if (selectedInquiry?._id === inquiryId) {
          setSelectedInquiry(null);
        }
      }
    } catch (error) {
      console.error('Error deleting inquiry:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'email': return 'Email';
      case 'live_chat': return 'Live Chat';
      case 'phone': return 'Phone';
      case 'in_person': return 'In Person';
      case 'other': return 'Other';
      default: return 'Email';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'email': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'live_chat': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'phone': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_person': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'other': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-red-100 text-red-800 border-red-200';
      case 'read': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'replied': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6">

      {/* New Inquiry Notification Toast */}
      <AnimatePresence>
        {showNotification && newInquiryNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="fixed top-20 right-4 z-50 w-96 bg-white border border-gray-200 rounded-lg shadow-lg p-4"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiMail className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-gray-900">New Inquiry Received!</h3>
                <p className="mt-1 text-sm text-gray-600">
                  <strong>{newInquiryNotification.name}</strong> sent a message
                  {newInquiryNotification.subject && ` about "${newInquiryNotification.subject}"`}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Case #{newInquiryNotification.caseId} • Just now
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => setShowNotification(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  setSelectedInquiry(newInquiryNotification);
                  setShowNotification(false);
                }}
                className="flex-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                View Inquiry
              </button>
              <button
                onClick={() => setShowNotification(false)}
                className="flex-1 px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Inquiries</h1>
            <p className="text-gray-600">Manage and respond to customer messages</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <FiMail className="h-4 w-4" />
              Create Inquiry
            </button>
            <div className={`flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors ${
              isConnected 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {isConnected ? (
                <>
                  <FiWifi className="h-4 w-4 mr-2" />
                  Connected
                </>
              ) : (
                <>
                  <FiWifiOff className="h-4 w-4 mr-2" />
                  Disconnected
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FiMail className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unread</p>
              <p className="text-2xl font-bold text-red-600">{stats.unread}</p>
            </div>
            <FiMail className="h-8 w-8 text-red-400" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Read</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.read}</p>
            </div>
            <FiMail className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Replied</p>
              <p className="text-2xl font-bold text-green-600">{stats.replied}</p>
            </div>
            <FiCheck className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Email</p>
              <p className="text-2xl font-bold text-blue-600">{stats.email}</p>
            </div>
            <FiMail className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Live Chat</p>
              <p className="text-2xl font-bold text-purple-600">{stats.live_chat}</p>
            </div>
            <FiMessageSquare className="h-8 w-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, subject, message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Sources</option>
            <option value="email">Email</option>
            <option value="live_chat">Live Chat</option>
            <option value="phone">Phone</option>
            <option value="in_person">In Person</option>
            <option value="other">Other</option>
          </select>
                  </div>
      </div>

      {/* Inquiries List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading inquiries...</p>
              </div>
            ) : inquiries.length === 0 ? (
              <div className="p-8 text-center">
                <FiMail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No inquiries found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {inquiries.map((inquiry, index) => (
                  <motion.div
                    key={inquiry._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedInquiry?._id === inquiry._id ? 'bg-blue-50' : ''
                    } ${newInquiryNotification?._id === inquiry._id ? 'bg-green-50 border-l-4 border-green-500' : ''}`}
                    onClick={() => setSelectedInquiry(inquiry)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {newInquiryNotification?._id === inquiry._id && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 animate-pulse">
                              NEW
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(inquiry.status)}`}>
                            {inquiry.status}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSourceColor(inquiry.source)}`}>
                            {getSourceLabel(inquiry.source)}
                          </span>
                          <span className="text-sm text-gray-500">#{inquiry.caseId}</span>
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {inquiry.subject || 'No Subject'}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">{inquiry.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {inquiry.email} • {formatDate(inquiry.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center ml-4">
                        <FiMessageSquare className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={!pagination.hasNext}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Inquiry Details */}
        <div className="lg:col-span-1">
          {selectedInquiry ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Inquiry Details</h2>
                <button
                  onClick={() => deleteInquiry(selectedInquiry._id)}
                  disabled={updating}
                  className="text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  <FiTrash2 className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 bg-white rounded-lg border border-gray-200 p-6 overflow-hidden flex flex-col">
                {selectedInquiry ? (
                  <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Inquiry Details</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Case ID</p>
                          <p className="text-gray-900">#{selectedInquiry.caseId}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">From</p>
                          <p className="text-gray-900">{selectedInquiry.name} ({selectedInquiry.email})</p>
                        </div>
                        {selectedInquiry.subject && (
                          <div>
                            <p className="text-sm font-medium text-gray-600">Subject</p>
                            <p className="text-gray-900">{selectedInquiry.subject}</p>
                          </div>
                        )}
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-medium text-gray-600 mb-2">Message</p>
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 h-64 overflow-y-auto">
                            <p className="text-gray-900 whitespace-pre-wrap break-words">{selectedInquiry.message}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Received</p>
                          <p className="text-gray-900">{formatDate(selectedInquiry.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                    {selectedInquiry.repliedAt && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Replied</p>
                        <p className="text-gray-900">{formatDate(selectedInquiry.repliedAt)}</p>
                      </div>
                    )}
                    {selectedInquiry.replyNote && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Reply Note</p>
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 max-h-32 overflow-y-auto">
                          <p className="text-gray-900 whitespace-pre-wrap break-words">{selectedInquiry.replyNote}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Status Actions */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-500 mb-3">Mark as:</p>
                  <div className="flex gap-2">
                    {selectedInquiry.status !== 'unread' && (
                      <button
                        onClick={() => updateInquiryStatus(selectedInquiry._id, 'unread')}
                        disabled={updating}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm disabled:opacity-50"
                      >
                        Unread
                      </button>
                    )}
                    {selectedInquiry.status !== 'read' && (
                      <button
                        onClick={() => updateInquiryStatus(selectedInquiry._id, 'read')}
                        disabled={updating}
                        className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md text-sm disabled:opacity-50"
                      >
                        Read
                      </button>
                    )}
                    {selectedInquiry.status !== 'replied' && (
                      <button
                        onClick={() => updateInquiryStatus(selectedInquiry._id, 'replied')}
                        disabled={updating}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm disabled:opacity-50"
                      >
                        Replied
                      </button>
                    )}
                  </div>
                </div>

                {/* Reply Note */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-500 mb-2">Add Reply Note:</p>
                  <textarea
                    value={replyNote}
                    onChange={(e) => setReplyNote(e.target.value)}
                    placeholder="Add notes about your reply..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                  <button
                    onClick={() => updateInquiryStatus(selectedInquiry._id, selectedInquiry.status, replyNote)}
                    disabled={updating || !replyNote.trim()}
                    className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Save Note'}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <FiMessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select an inquiry to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Inquiry Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Create New Inquiry</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newInquiry.name}
                    onChange={(e) => setNewInquiry({...newInquiry, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Customer name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={newInquiry.email}
                    onChange={(e) => setNewInquiry({...newInquiry, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="customer@email.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newInquiry.phone}
                    onChange={(e) => setNewInquiry({...newInquiry, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="(123) 456-7890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source *</label>
                  <select
                    value={newInquiry.source}
                    onChange={(e) => setNewInquiry({...newInquiry, source: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="email">Email</option>
                    <option value="live_chat">Live Chat</option>
                    <option value="phone">Phone Call</option>
                    <option value="in_person">In Person</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={newInquiry.subject}
                  onChange={(e) => setNewInquiry({...newInquiry, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief subject or topic"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  value={newInquiry.message}
                  onChange={(e) => setNewInquiry({...newInquiry, message: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Detailed description of the inquiry..."
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createInquiry}
                disabled={updating || !newInquiry.name.trim() || !newInquiry.email.trim() || !newInquiry.message.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {updating ? 'Creating...' : 'Create Inquiry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
