'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { MessageCircle, Send, X, Minimize2, Maximize2 } from 'lucide-react';

interface Message {
  _id: string;
  senderType: 'customer' | 'admin';
  senderName: string;
  message: string;
  timestamp: string;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

export default function CustomerChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: ''
  });
  const [chatId, setChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatEnded, setChatEnded] = useState(false);

  // Memoize polling interval
  const pollInterval = useMemo(() => 5000, []);

  // Optimized fetch messages with useCallback
  const fetchMessages = useCallback(async () => {
    if (!chatId) return;
    
    try {
      const res = await fetch(`/api/chat?chatId=${chatId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        
        // Check if chat is closed (has system message about ending)
        const hasEndMessage = data.some((msg: Message) => 
          msg.senderType === 'admin' && 
          msg.senderName === 'System' && 
          msg.message.includes('chat has been ended')
        );
        
        if (hasEndMessage) {
          setIsTyping(false);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [chatId]);

  useEffect(() => {
    if (chatId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, pollInterval);
      return () => clearInterval(interval);
    }
  }, [chatId, fetchMessages, pollInterval]);

  const startChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInfo.name || !customerInfo.email || !newMessage.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          message: newMessage
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatId(data.chatId);
        setShowCustomerForm(false);
        setNewMessage('');
        fetchMessages();
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatId) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          message: newMessage
        }),
      });

      if (res.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = useCallback((timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }, []);

  // Check if chat is closed
  const isChatClosed = useMemo(() => {
    return messages.some(msg => 
      msg.senderType === 'admin' && 
      msg.senderName === 'System' && 
      msg.message.includes('chat has been ended')
    );
  }, [messages]);

  // Reset chat when it's closed and customer reopens
  const resetChat = useCallback(() => {
    setChatId(null);
    setMessages([]);
    setNewMessage('');
    setShowCustomerForm(true);
    setCustomerInfo({
      name: '',
      email: '',
      phone: ''
    });
    setChatEnded(false);
    setIsTyping(false);
  }, []);

  // Check if chat was ended and reset when reopening
  useEffect(() => {
    if (isChatClosed && !chatEnded) {
      setChatEnded(true);
    }
  }, [isChatClosed, chatEnded]);

  // When chat is ended and customer reopens, reset for new chat
  const handleReopen = useCallback(() => {
    if (chatEnded) {
      resetChat();
    }
  }, [chatEnded, resetChat]);

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => {
            setIsOpen(true);
            handleReopen();
          }}
          className="bg-gray-900 hover:bg-black text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Live Chat</h3>
          <p className="text-xs text-gray-300">We typically reply in minutes</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-gray-800 p-1 rounded"
            aria-label={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-gray-800 p-1 rounded"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {showCustomerForm ? (
              <form onSubmit={startChat} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="(123) 456-7890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="How can we help you?"
                    rows={3}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-black disabled:opacity-50"
                >
                  {isLoading ? 'Starting chat...' : 'Start Chat'}
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Start a conversation with us!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message._id}
                      className={`flex ${message.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg ${
                          message.senderType === 'customer'
                            ? 'bg-gray-900 text-white'
                            : message.senderName === 'System'
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200 text-center'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        {message.senderName !== 'System' && (
                          <p className="text-sm font-medium mb-1">{message.senderName}</p>
                        )}
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.senderType === 'customer' 
                            ? 'text-gray-300' 
                            : message.senderName === 'System'
                            ? 'text-yellow-600'
                            : 'text-gray-500'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 text-gray-900 px-3 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          {!showCustomerForm && (
            <div className="p-4 border-t bg-white">
              {isChatClosed ? (
                <div className="text-center">
                  <div className="text-gray-500 py-2">
                    <p className="text-sm">This chat has been ended by the admin.</p>
                    <p className="text-xs mt-1">Thank you for contacting us!</p>
                  </div>
                  <button
                    onClick={resetChat}
                    className="mt-3 w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-black"
                  >
                    Start New Chat
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                    disabled={isLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isLoading}
                    className="bg-gray-900 text-white p-2 rounded-md hover:bg-black disabled:opacity-50"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
