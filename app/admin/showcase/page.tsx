'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiArrowUp, FiArrowDown, FiEye, FiEyeOff } from 'react-icons/fi';
import Image from 'next/image';

interface ShowcaseItem {
  _id: string;
  imageUrl: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ShowcaseAdminPage() {
  const [showcaseItems, setShowcaseItems] = useState<ShowcaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<ShowcaseItem | null>(null);
  const [formData, setFormData] = useState({
    imageUrl: '',
    order: 0
  });

  useEffect(() => {
    fetchShowcaseItems();
  }, []);

  const fetchShowcaseItems = async () => {
    try {
      const response = await fetch('/api/showcase');
      if (response.ok) {
        const items = await response.json();
        setShowcaseItems(items.sort((a: ShowcaseItem, b: ShowcaseItem) => a.order - b.order));
      }
    } catch (error) {
      console.error('Error fetching showcase items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      imageUrl: '',
      order: 0
    });
    setIsAddingItem(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingItem 
        ? `/api/showcase/${editingItem._id}`
        : '/api/showcase';
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          order: editingItem ? formData.order : showcaseItems.length
        }),
      });

      if (response.ok) {
        await fetchShowcaseItems();
        resetForm();
      } else {
        alert('Failed to save showcase item');
      }
    } catch (error) {
      console.error('Error saving showcase item:', error);
      alert('Failed to save showcase item');
    }
  };

  const handleEdit = (item: ShowcaseItem) => {
    setEditingItem(item);
    setFormData({
      imageUrl: item.imageUrl,
      order: item.order
    });
    setIsAddingItem(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this showcase item?')) {
      return;
    }

    try {
      const response = await fetch(`/api/showcase/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchShowcaseItems();
      } else {
        alert('Failed to delete showcase item');
      }
    } catch (error) {
      console.error('Error deleting showcase item:', error);
      alert('Failed to delete showcase item');
    }
  };

  const toggleActive = async (item: ShowcaseItem) => {
    try {
      const response = await fetch(`/api/showcase/${item._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...item,
          isActive: !item.isActive
        }),
      });

      if (response.ok) {
        await fetchShowcaseItems();
      } else {
        alert('Failed to update showcase item');
      }
    } catch (error) {
      console.error('Error updating showcase item:', error);
      alert('Failed to update showcase item');
    }
  };

  const moveItem = async (item: ShowcaseItem, direction: 'up' | 'down') => {
    const currentIndex = showcaseItems.findIndex(i => i._id === item._id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= showcaseItems.length) {
      return;
    }

    const otherItem = showcaseItems[newIndex];

    try {
      // Update both items' orders
      await Promise.all([
        fetch(`/api/showcase/${item._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...item, order: newIndex }),
        }),
        fetch(`/api/showcase/${otherItem._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...otherItem, order: currentIndex }),
        }),
      ]);

      await fetchShowcaseItems();
    } catch (error) {
      console.error('Error reordering items:', error);
      alert('Failed to reorder items');
    }
  };

  const handleGoogleDriveUrl = (url: string) => {
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
      
      setFormData(prev => ({
        ...prev,
        imageUrl: proxyUrl
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Showcase Management</h1>
        <button
          onClick={() => setIsAddingItem(true)}
          className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          <FiPlus className="mr-2" />
          Add New Item
        </button>
      </div>

      {/* Add/Edit Form */}
      {isAddingItem && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingItem ? 'Edit Showcase Item' : 'Add New Showcase Item'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Google Drive Image URL *
              </label>
              <input
                type="url"
                required
                placeholder="https://drive.google.com/file/d/..."
                onBlur={(e) => handleGoogleDriveUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
              <p className="text-sm text-gray-500 mt-1">
                Paste Google Drive file URL and click outside the field to convert
              </p>
            </div>

            {formData.imageUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preview
                </label>
                <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={formData.imageUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
              >
                {editingItem ? 'Update' : 'Add'} Showcase Item
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Showcase Items List */}
      <div className="space-y-4">
        {showcaseItems.map((item, index) => (
          <div key={item._id} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex gap-6">
              {/* Image Preview */}
              <div className="relative w-48 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={item.imageUrl}
                  alt="Showcase image"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Item Details */}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-semibold">Showcase Item #{index + 1}</h3>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive(item)}
                      className={`p-2 rounded-lg ${item.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                      title={item.isActive ? 'Hide from showcase' : 'Show in showcase'}
                    >
                      {item.isActive ? <FiEye /> : <FiEyeOff />}
                    </button>
                    
                    <button
                      onClick={() => moveItem(item, 'up')}
                      disabled={index === 0}
                      className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <FiArrowUp />
                    </button>
                    
                    <button
                      onClick={() => moveItem(item, 'down')}
                      disabled={index === showcaseItems.length - 1}
                      className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <FiArrowDown />
                    </button>
                    
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200"
                      title="Edit"
                    >
                      <FiEdit2 />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-500">
                  Order: {item.order} | Status: {item.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showcaseItems.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FiImage className="mx-auto text-4xl text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Showcase Items</h3>
          <p className="text-gray-500 mb-4">Add your first showcase item to get started</p>
          <button
            onClick={() => setIsAddingItem(true)}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Add First Item
          </button>
        </div>
      )}
    </div>
  );
}
