'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, User, Phone, Mail, Clock, CheckCircle, XCircle, Users, Send } from 'lucide-react';
import { format } from 'date-fns';

interface Chat {
  _id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: 'active' | 'assigned' | 'closed';
  assignedTo: {
    _id: string;
    name: string;
    email: string;
  } | null;
  assignedBy: {
    _id: string;
    name: string;
    email: string;
  } | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  _id: string;
  senderType: 'customer' | 'admin';
  senderName: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface Crew {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [crew, setCrew] = useState<Crew[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedChatToAssign, setSelectedChatToAssign] = useState<Chat | null>(null);
  const [lastMessageCount, setLastMessageCount] = useState<{ [key: string]: number }>({});
  const [newMessageAlert, setNewMessageAlert] = useState<string | null>(null);
  const [isFetchingChats, setIsFetchingChats] = useState(false);
  const [isFetchingMessages, setIsFetchingMessages] = useState(false);
  const [chatFilter, setChatFilter] = useState<'all' | 'my'>('all');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchChats();
    fetchCrew();
    getCurrentUser();
    
    // Set up polling for real-time updates
    const interval = setInterval(() => {
      if (!isFetchingChats) {
        fetchChats();
      }
    }, 5000); // Poll chat list every 5 seconds
    
    return () => clearInterval(interval);
  }, [isFetchingChats, chatFilter]); // Add chatFilter dependency

  const getCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/check');
      if (res.ok) {
        const data = await res.json();
        console.log('Current user data:', data.user); // Debug log
        console.log('Current user ID:', data.user?.id); // Debug log
        setCurrentUser(data.user);
      } else {
        console.log('Auth check failed:', res.status);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  // Separate polling for messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id);
    }
  }, [selectedChat]);

  // Set up message polling with stable reference
  useEffect(() => {
    if (!selectedChat) return;
    
    const messageInterval = setInterval(() => {
      if (!isFetchingMessages && selectedChat) {
        fetchMessages(selectedChat._id);
      }
    }, 5000);
    
    return () => clearInterval(messageInterval);
  }, [selectedChat?._id, isFetchingMessages]); // Only recreate when chat ID changes

  const fetchChats = async () => {
    if (isFetchingChats) return; // Prevent duplicate requests
    
    try {
      setIsFetchingChats(true);
      const url = chatFilter === 'my' ? '/api/admin/chats/my' : '/api/admin/chats';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setChats(data);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setIsFetchingChats(false);
      setLoading(false);
    }
  };

  const fetchCrew = async () => {
    try {
      const res = await fetch('/api/admin/crew');
      if (res.ok) {
        const data = await res.json();
        setCrew(data.filter((c: Crew) => c.role === 'super_admin' || c.role === 'manager'));
      }
    } catch (error) {
      console.error('Error fetching crew:', error);
    }
  };

  const fetchMessages = async (chatId: string) => {
    if (isFetchingMessages) return; // Prevent duplicate requests
    
    try {
      setIsFetchingMessages(true);
      const res = await fetch(`/api/admin/chats/${chatId}`);
      if (res.ok) {
        const data = await res.json();
        const newCount = data.messages.length;
        const oldCount = lastMessageCount[chatId] || 0;
        
        setMessages(data.messages);
        setLastMessageCount(prev => ({ ...prev, [chatId]: newCount }));
        
        // Check for new messages from customer
        if (newCount > oldCount) {
          const latestMessage = data.messages[data.messages.length - 1];
          if (latestMessage && latestMessage.senderType === 'customer') {
            setNewMessageAlert(`New message from ${data.chat.customerName}`);
            setTimeout(() => setNewMessageAlert(null), 3000);
          }
        }
        
        // Update selected chat if it's the current one and different
        if (selectedChat && selectedChat._id === chatId) {
          // Only update if the chat data has actually changed
          if (JSON.stringify(selectedChat) !== JSON.stringify(data.chat)) {
            setSelectedChat(data.chat);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsFetchingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    
    // Check if chat is assigned
    if (!selectedChat.assignedTo) {
      console.error('Chat must be assigned before sending messages');
      return;
    }

    try {
      setMessageLoading(true);
      const res = await fetch(`/api/admin/chats/${selectedChat._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage.trim(),
          senderType: 'admin',
          senderId: 'admin',
          senderName: 'Admin',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages([...messages, data]);
        setNewMessage('');
        
        // Fetch messages immediately after sending to get the latest
        fetchMessages(selectedChat._id);
      } else {
        const errorData = await res.json();
        console.error('Send message error:', errorData);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setMessageLoading(false);
    }
  };

  const convertToInquiry = async () => {
    if (!selectedChat) return;

    try {
      setMessageLoading(true);
      
      // Create inquiry with chat log
      const res = await fetch('/api/admin/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedChat.customerName,
          email: selectedChat.customerEmail,
          subject: `Live Chat - ${selectedChat.customerName}`,
          message: `Customer inquiry from live chat session.\n\nCustomer: ${selectedChat.customerName}\nEmail: ${selectedChat.customerEmail}\nPhone: ${selectedChat.customerPhone || 'Not provided'}\n\nStatus: ${selectedChat.status}\nAssigned: ${selectedChat.assignedTo ? 'Yes' : 'No'}\nCreated: ${new Date(selectedChat.createdAt).toLocaleString()}`,
          source: 'live_chat',
          chatLog: messages
        }),
      });

      if (res.ok) {
        const inquiry = await res.json();
        alert(`Inquiry created successfully!\nCase ID: ${inquiry.caseId}\n\nYou can now manage this inquiry in the Inquiries section.`);
        
        // Optionally close the chat after conversion
        if (confirm('Would you like to close this chat after converting to inquiry?')) {
          updateChatStatus(selectedChat._id, 'close');
        }
      } else {
        const error = await res.json();
        alert(`Failed to create inquiry: ${error.message}`);
      }
    } catch (error) {
      console.error('Error converting to inquiry:', error);
      alert('Failed to create inquiry. Please try again.');
    } finally {
      setMessageLoading(false);
    }
  };

  const assignToMe = async () => {
    if (!selectedChat) return;

    try {
      setMessageLoading(true);
      
      // Get current user info (we'll need to modify the API to accept this)
      const res = await fetch(`/api/admin/chats/${selectedChat._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'assign',
          assignToMe: true // Flag to assign to current user
        }),
      });

      if (res.ok) {
        const updatedChat = await res.json();
        setSelectedChat(updatedChat);
        fetchChats(); // Refresh chat list
      } else {
        const errorData = await res.json();
        console.error('Assign to me error:', errorData);
      }
    } catch (error) {
      console.error('Error assigning chat:', error);
    } finally {
      setMessageLoading(false);
    }
  };

  const deleteChat = async (chatId: string) => {
    if (!confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      return;
    }

    try {
      setMessageLoading(true);
      
      const res = await fetch(`/api/admin/chats/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        alert('Chat deleted successfully!');
        setSelectedChat(null);
        fetchChats(); // Refresh chat list
      } else {
        const error = await res.json();
        alert(`Failed to delete chat: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Failed to delete chat. Please try again.');
    } finally {
      setMessageLoading(false);
    }
  };

  const updateChatStatus = async (chatId: string, action: string, adminId?: string) => {
    try {
      const res = await fetch(`/api/admin/chats/${chatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, adminId }),
      });

      if (res.ok) {
        fetchChats();
        if (selectedChat && selectedChat._id === chatId) {
          const updatedChat = await res.json();
          setSelectedChat(updatedChat);
        }
        
        // If chat was reopened, fetch messages immediately
        if (action === 'reopen' && selectedChat && selectedChat._id === chatId) {
          fetchMessages(chatId);
        }
      }
    } catch (error) {
      console.error('Error updating chat:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <MessageCircle className="h-4 w-4" />;
      case 'assigned':
        return <Users className="h-4 w-4" />;
      case 'closed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6">
      {/* New Message Alert */}
      {newMessageAlert && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium">{newMessageAlert}</span>
          <button
            onClick={() => setNewMessageAlert(null)}
            className="text-green-500 hover:text-green-700"
          >
            ×
          </button>
        </div>
      )}
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Live Chat Management</h1>
        <p className="text-gray-600">Manage customer conversations and assign chats to team members</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500">Live</span>
                </div>
              </div>
              
              {/* Chat Filter */}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setChatFilter('all')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    chatFilter === 'all' 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All Chats
                </button>
                <button
                  onClick={() => setChatFilter('my')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    chatFilter === 'my' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  My Chats
                </button>
              </div>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : chats.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No active conversations
                </div>
              ) : (
                chats.map((chat) => (
                  <div
                    key={chat._id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      selectedChat?._id === chat._id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{chat.customerName}</h3>
                        <p className="text-sm text-gray-500">{chat.customerEmail}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {chat.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                            {chat.unreadCount}
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(chat.status)}`}>
                          {getStatusIcon(chat.status)}
                          <span className="ml-1">{chat.status}</span>
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(chat.lastMessageTime), 'MMM d, h:mm a')}
                    </p>
                    {chat.assignedTo && (
                      <div className="mt-2 text-xs text-gray-500">
                        Assigned to: {(chat.assignedTo as any)?.name || 'Unknown'}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="lg:col-span-2">
          {selectedChat ? (
            <div className="bg-white rounded-lg shadow h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedChat.customerName}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {selectedChat.customerEmail}
                      </span>
                      {selectedChat.customerPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {selectedChat.customerPhone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedChat.status === 'active' && (
                      <button
                        onClick={() => {
                          setSelectedChatToAssign(selectedChat);
                          setShowAssignModal(true);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Assign
                      </button>
                    )}
                    {selectedChat.status === 'closed' && (
                      <button
                        onClick={() => updateChatStatus(selectedChat._id, 'reopen')}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Reopen
                      </button>
                    )}
                    {selectedChat.status !== 'closed' && (
                      <button
                        onClick={() => updateChatStatus(selectedChat._id, 'close')}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto">
                {messageLoading ? (
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderType === 'admin'
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm font-medium mb-1">{message.senderName}</p>
                          <p className="text-sm">{message.message}</p>
                          <p className={`text-xs mt-1 ${
                            message.senderType === 'admin' ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            {format(new Date(message.timestamp), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chat Actions */}
              <div className="p-4 border-t bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Chat Actions</h3>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedChat.status)}`}>
                    {selectedChat.status}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {/* Assign Chat Button */}
                  <button
                    onClick={() => {
                      setSelectedChatToAssign(selectedChat);
                      setShowAssignModal(true);
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    Assign Chat
                  </button>
                  
                  {/* Delete Chat Button - Only for My Chat */}
                  {currentUser && selectedChat.assignedTo && (selectedChat.assignedTo as any)?._id === currentUser.id && (
                    <button
                      onClick={() => deleteChat(selectedChat._id)}
                      disabled={messageLoading}
                      className="w-full px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      Delete Chat
                    </button>
                  )}
                  
                  {/* Convert to Inquiry Button - Only for My Chat */}
                  {currentUser && selectedChat.assignedTo && (selectedChat.assignedTo as any)?._id === currentUser.id && (
                    <button
                      onClick={() => convertToInquiry()}
                      disabled={messageLoading}
                      className="w-full px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 disabled:opacity-50"
                    >
                      Convert to Inquiry
                    </button>
                  )}
                </div>
              </div>
              {selectedChat && (
                <div className="p-4 border-t">
                  {!selectedChat.assignedTo ? (
                    <div className="text-center py-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 font-medium">Chat not assigned</p>
                      <p className="text-xs text-yellow-600 mt-1">Please assign this chat to an admin before replying</p>
                      <button
                        onClick={() => {
                          setSelectedChatToAssign(selectedChat);
                          setShowAssignModal(true);
                        }}
                        className="mt-3 px-4 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700"
                      >
                        Assign Chat
                      </button>
                    </div>
                  ) : currentUser && selectedChat.assignedTo && (selectedChat.assignedTo as any)?._id === currentUser.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || messageLoading}
                        className="bg-gray-900 text-white p-2 rounded-md hover:bg-black disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 font-medium">Cannot reply to this chat</p>
                      <p className="text-xs text-red-600 mt-1">This chat is assigned to {(selectedChat.assignedTo as any)?.name || 'another admin'}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow h-[600px] flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && selectedChatToAssign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Assign Chat</h3>
            <p className="text-gray-600 mb-4">
              Assign conversation with {selectedChatToAssign.customerName} to:
            </p>
            <div className="space-y-2">
              {crew
                .sort((a, b) => {
                  // Put current user first
                  if (currentUser && a._id === currentUser.id) return -1;
                  if (currentUser && b._id === currentUser.id) return 1;
                  return a.name.localeCompare(b.name);
                })
                .map((member) => (
                  <button
                    key={member._id}
                    onClick={() => {
                      updateChatStatus(selectedChatToAssign._id, 'assign', member._id);
                      setShowAssignModal(false);
                      setSelectedChatToAssign(null);
                    }}
                    className="w-full text-left p-3 rounded border hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                      <div className="text-xs text-gray-400 capitalize">{member.role}</div>
                    </div>
                    {currentUser && member._id === currentUser.id && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        Current
                      </span>
                    )}
                  </button>
                ))}
            </div>
            <button
              onClick={() => {
                setShowAssignModal(false);
                setSelectedChatToAssign(null);
              }}
              className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
