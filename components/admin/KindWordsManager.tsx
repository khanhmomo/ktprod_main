'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiEdit, FiSave, FiX, FiPlus, FiTrash2, FiImage, FiMove } from 'react-icons/fi';

interface KindWord {
  _id: string;
  text: string;
  customerName?: string;
  imageUrl: string;
  imageAlt: string;
  createdAt: string;
  order?: number;
}

export default function KindWordsManager() {
  const [kindWords, setKindWords] = useState<KindWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editImageAlt, setEditImageAlt] = useState('');
  const [saving, setSaving] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);

  useEffect(() => {
    fetchKindWords();
  }, []);

  const fetchKindWords = async () => {
    try {
      const response = await fetch('/api/kind-words');
      const data = await response.json();
      // Sort by order field, then by createdAt if no order
      const sortedData = data.sort((a: KindWord, b: KindWord) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      setKindWords(sortedData);
    } catch (error) {
      console.error('Error fetching kind words:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteKindWord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this kind word?')) return;
    
    try {
      await fetch(`/api/kind-words?id=${id}`, { method: 'DELETE' });
      setKindWords(words => words.filter(word => word._id !== id));
    } catch (error) {
      console.error('Error deleting kind word:', error);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragEnter = (index: number) => {
    setDragOverItem(index);
  };

  const handleDragEnd = async () => {
    if (draggedItem !== null && dragOverItem !== null && draggedItem !== dragOverItem) {
      const draggedWord = kindWords[draggedItem];
      const newWords = [...kindWords];
      
      // Remove the dragged item and insert it at the new position
      newWords.splice(draggedItem, 1);
      newWords.splice(dragOverItem, 0, draggedWord);
      
      // Update order numbers
      const updatedWords = newWords.map((word, index) => ({
        ...word,
        order: index
      }));
      
      setKindWords(updatedWords);
      
      // Save the new order to the database
      await saveOrder(updatedWords);
    }
    
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const saveOrder = async (words: KindWord[]) => {
    try {
      const response = await fetch('/api/kind-words/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          words: words.map(word => ({ id: word._id, order: word.order }))
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to save order');
      }
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const startEditing = (kindWord: KindWord) => {
    console.log('Starting edit for kindWord:', kindWord);
    setEditingId(kindWord._id);
    setEditText(kindWord.text);
    // Explicitly set the customer name, defaulting to 'Happy Client' if it doesn't exist
    const customerName = kindWord.customerName || 'Happy Client';
    setEditCustomerName(customerName);
    setEditImageUrl(kindWord.imageUrl || '');
    setEditImageAlt(kindWord.imageAlt || '');
    console.log('Set editCustomerName to:', customerName);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText('');
    setEditCustomerName('');
    setEditImageUrl('');
    setEditImageAlt('');
  };

  const saveEdit = async () => {
    console.log('Saving with data:', {
      editingId,
      editText,
      editCustomerName,
      editImageUrl,
      editImageAlt
    });
    
    setSaving(true);
    try {
      let response;
      
      if (editingId === 'new') {
        // Create new kind word
        console.log('Creating new kind word...');
        response = await fetch('/api/kind-words', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: editText,
            customerName: editCustomerName,
            imageUrl: editImageUrl,
            imageAlt: editImageAlt,
          }),
        });
      } else {
        // Update existing kind word
        console.log('Updating existing kind word:', editingId);
        response = await fetch('/api/kind-words', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            text: editText,
            customerName: editCustomerName,
            imageUrl: editImageUrl,
            imageAlt: editImageAlt,
          }),
        });
      }

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (response.ok) {
        const savedKindWord = responseData;
        
        if (editingId === 'new') {
          setKindWords(words => [savedKindWord, ...words]);
        } else {
          setKindWords(words => 
            words.map(word => 
              word._id === editingId ? savedKindWord : word
            )
          );
        }
        
        cancelEditing();
      } else {
        console.error('Save failed:', responseData);
      }
    } catch (error) {
      console.error('Error saving kind word:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Kind Words</h2>
        <p className="text-sm text-gray-600">Drag and drop to reorder</p>
      </div>

      {/* Add New Form */}
      {editingId === 'new' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Kind Word</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                value={editCustomerName}
                onChange={(e) => setEditCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter customer name..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kind Word Text</label>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter kind word text..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Google Drive Image URL</label>
              <input
                type="url"
                value={editImageUrl}
                onChange={(e) => setEditImageUrl(e.target.value)}
                onBlur={(e) => {
                  const url = e.target.value;
                  if (url.trim()) {
                    // Validate it's a Google Drive URL
                    if (!url.includes('drive.google.com') && !url.includes('googleusercontent.com')) {
                      alert('Please enter a valid Google Drive URL');
                      return;
                    }
                    
                    // Extract file ID from various Google Drive URL formats
                    let fileId = '';
                    const patterns = [
                      /\/file\/d\/([\w-]+)/, // /file/d/FILE_ID/
                      /[?&]id=([\w-]+)/, // ?id=FILE_ID or &id=FILE_ID
                      /^([\w-]{25,})$/ // Just the ID (25+ characters)
                    ];
                    
                    for (const pattern of patterns) {
                      const match = url.match(pattern);
                      if (match && match[1]) {
                        fileId = match[1];
                        break;
                      }
                    }
                    
                    if (!fileId) {
                      alert('Could not extract file ID from the URL. Please check the URL format.');
                      return;
                    }
                    
                    // Create the proxy URL
                    const proxyUrl = `/api/drive/image?id=${encodeURIComponent(fileId)}`;
                    setEditImageUrl(proxyUrl);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://drive.google.com/file/d/..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Paste Google Drive file URL and click outside the field to convert
              </p>
              {editImageUrl && (
                <div className="mt-3">
                  <img 
                    src={editImageUrl} 
                    alt="Preview" 
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image Alt Text</label>
              <input
                type="text"
                value={editImageAlt}
                onChange={(e) => setEditImageAlt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter image alt text..."
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <FiSave className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={cancelEditing}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                <FiX className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Add New Button */}
      {editingId !== 'new' && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => {
            setEditingId('new');
            setEditText('');
            setEditCustomerName('');
            setEditImageUrl('');
            setEditImageAlt('');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <FiPlus className="w-4 h-4" />
          Add New Kind Word
        </motion.button>
      )}

      {/* Kind Words List */}
      <div className="space-y-4">
        {kindWords.map((kindWord, index) => (
          <motion.div
            key={kindWord._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            style={{
              opacity: draggedItem === index ? 0.5 : 1,
              transform: dragOverItem === index ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            {editingId === kindWord._id ? (
              <div className="space-y-4 cursor-move">
                <div className="flex items-center gap-2 mb-2">
                  <FiMove className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Editing - Order {index + 1}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={editCustomerName}
                    onChange={(e) => setEditCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter customer name..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kind Word Text</label>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter kind word text..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Google Drive Image URL</label>
                  <input
                    type="url"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    onBlur={(e) => {
                      const url = e.target.value;
                      if (url.trim()) {
                        // Validate it's a Google Drive URL
                        if (!url.includes('drive.google.com') && !url.includes('googleusercontent.com')) {
                          alert('Please enter a valid Google Drive URL');
                          return;
                        }
                        
                        // Extract file ID from various Google Drive URL formats
                        let fileId = '';
                        const patterns = [
                          /\/file\/d\/([\w-]+)/, // /file/d/FILE_ID/
                          /[?&]id=([\w-]+)/, // ?id=FILE_ID or &id=FILE_ID
                          /^([\w-]{25,})$/ // Just the ID (25+ characters)
                        ];
                        
                        for (const pattern of patterns) {
                          const match = url.match(pattern);
                          if (match && match[1]) {
                            fileId = match[1];
                            break;
                          }
                        }
                        
                        if (!fileId) {
                          alert('Could not extract file ID from the URL. Please check the URL format.');
                          return;
                        }
                        
                        // Create the proxy URL
                        const proxyUrl = `/api/drive/image?id=${encodeURIComponent(fileId)}`;
                        setEditImageUrl(proxyUrl);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://drive.google.com/file/d/..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Paste Google Drive file URL and click outside the field to convert
                  </p>
                  {editImageUrl && (
                    <div className="mt-3">
                      <img 
                        src={editImageUrl} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image Alt Text</label>
                  <input
                    type="text"
                    value={editImageAlt}
                    onChange={(e) => setEditImageAlt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter image alt text..."
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <FiSave className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    <FiX className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between cursor-move">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FiMove className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Order {index + 1}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{kindWord.text}</h3>
                  <p className="text-sm text-gray-600 mb-2">- {kindWord.customerName || 'Happy Client'}</p>
                  {kindWord.imageUrl && (
                    <div className="mb-4">
                      <img 
                        src={kindWord.imageUrl} 
                        alt={kindWord.imageAlt || 'Kind word image'} 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 ml-4 pointer-events-none">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(kindWord);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 pointer-events-auto"
                  >
                    <FiEdit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteKindWord(kindWord._id);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 pointer-events-auto"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
