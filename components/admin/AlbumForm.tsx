'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import GoogleDriveImport from '@/components/GoogleDriveImport';

const categories = [
  { value: 'Wedding', label: 'Wedding' },
  { value: 'Prewedding', label: 'Prewedding' },
  { value: 'Event', label: 'Event' },
  { value: 'Studio', label: 'Studio' }
];

interface AlbumImage {
  url: string;
  alt?: string;
  originalUrl?: string;
  source?: 'upload' | 'google-drive';
}

interface FormData {
  title: string;
  description: string;
  coverImage: string;
  images: AlbumImage[];
  date: string;
  location: string;
  isPublished: boolean;
  category: string;
}

interface AlbumFormProps {
  initialData?: FormData & { _id?: string; featuredInHero?: boolean };
  isEditing?: boolean;
  onSave?: () => void;
  isNew?: boolean;
}

export default function AlbumForm({ 
  initialData, 
  isEditing = false, 
  onSave, 
  isNew = false 
}: AlbumFormProps) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    coverImage: '',
    images: [],
    date: new Date().toISOString().split('T')[0],
    location: '',
    isPublished: false,
    category: 'Event'
  });

  // Initialize form with initialData
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        coverImage: initialData.coverImage || '',
        images: initialData.images || [],
        date: initialData.date || new Date().toISOString().split('T')[0],
        location: initialData.location || '',
        isPublished: initialData.isPublished || false,
        category: initialData.category || 'Event'
      });
      if (initialData.coverImage) {
        setCoverImage(initialData.coverImage);
      }
    }
  }, [initialData]);

  useEffect(() => {
    if (formData.images.length > 0 && !formData.coverImage) {
      setCoverImage(formData.images[0].url);
      setFormData(prev => ({
        ...prev,
        coverImage: formData.images[0].url
      }));
    }
  }, [formData.images]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: checked !== undefined ? checked : value
    }));
  };

  const addImage = () => {
    if (!imageUrl.trim()) return;
    
    const newImage = {
      url: processImageUrl(imageUrl),
      originalUrl: imageUrl,
      source: 'upload' as const
    };
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, newImage]
    }));
    
    if (!formData.coverImage) {
      const setCoverImage = (url: string) => {
        console.log('Setting cover image to:', url);
        setFormData(prev => {
          const updated = {
            ...prev,
            coverImage: url
          };
          console.log('Updated formData:', updated);
          return updated;
        });
      };
      setCoverImage(newImage.url);
    }
    
    setImageUrl('');
  };

  const handleImportFromDrive = (images: Array<{ url: string; originalUrl: string; name: string }>) => {
    const newImages = images.map(img => ({
      url: processImageUrl(img.url),
      originalUrl: img.originalUrl,
      alt: img.name,
      source: 'google-drive' as const
    }));
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
    
    if (!formData.coverImage && newImages.length > 0) {
      setFormData(prev => ({
        ...prev,
        coverImage: newImages[0].url
      }));
      setCoverImage(newImages[0].url);
    }
    
    setIsImportModalOpen(false);
  };

  const removeImage = (index: number) => {
    const newImages = [...formData.images];
    const removedImage = newImages.splice(index, 1)[0];
    
    setFormData(prev => ({
      ...prev,
      images: newImages,
      coverImage: prev.coverImage === removedImage.url ? '' : prev.coverImage
    }));
    
    if (coverImage === removedImage.url) {
      setCoverImage('');
    }
  };

  // Function to process image URLs for display
  const processImageUrl = (url: string) => {
    if (!url) return '';
    
    // If it's already a processed URL, return as is
    if (url.startsWith('/api/') || url.startsWith('http')) {
      return url;
    }
    
    // If it's a Google Drive URL, use the proxy API
    if (url.includes('drive.google.com') || url.includes('googleusercontent.com')) {
      // Extract file ID from Google Drive URL
      let fileId = '';
      const match = url.match(/[\w-]{25,}/);
      if (match) fileId = match[0];
      
      if (fileId) {
        return `/api/drive/image?id=${encodeURIComponent(fileId)}`;
      }
    }
    
    // For relative URLs, prepend the base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Ensure cover image is set to the first image if not set
    const formDataToSave = { ...formData };
    if (formDataToSave.images.length > 0 && !formDataToSave.coverImage) {
      formDataToSave.coverImage = formDataToSave.images[0].url;
    }

    try {
      // First, verify the user is still authenticated
      const authCheck = await fetch('/api/auth/check', {
        credentials: 'include'
      });

      if (!authCheck.ok) {
        // If not authenticated, redirect to login
        window.location.href = '/admin';
        return;
      }

      // Ensure category is included
      if (!formData.category) {
        throw new Error('Please select a category');
      }
      
      const url = isEditing && initialData?._id 
        ? `/api/albums/${initialData._id}`
        : '/api/albums';
      
      const method = isEditing ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for sending cookies
        body: JSON.stringify({
          ...formDataToSave,
          // Ensure we don't send internal fields to the API
          _id: undefined,
          featuredInHero: undefined,
          // Make sure coverImage is included in the payload
          coverImage: formDataToSave.coverImage
        }),
      });

      const responseData = await response.json();

      if (response.status === 401) {
        // Session expired, redirect to login
        window.location.href = '/admin';
        return;
      }

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to save album');
      }

      // Call the onSave callback if provided
      if (onSave) {
        onSave();
      }

      // If this is a new album, redirect to the edit page
      if (!isEditing && responseData._id) {
        router.push(`/admin/albums/${responseData._id}`);
      }

      // Show success message
      alert(`Album ${isEditing ? 'updated' : 'created'} successfully!`);
    } catch (err) {
      console.error('Error saving album:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving the album');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={handleSave}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {isEditing ? 'Edit Album' : 'Create New Album'}
          </h2>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Album'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-md"
            required
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className="p-2 border rounded-md"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div className="mb-6 flex items-center">
          <input
            type="checkbox"
            id="isPublished"
            name="isPublished"
            checked={formData.isPublished}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 rounded"
          />
          <label htmlFor="isPublished" className="ml-2 text-sm text-gray-700">
            Published
          </label>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Images
            </label>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Import from Google Drive
            </button>
          </div>

          <div className="flex mb-4">
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Paste image URL"
              className="flex-1 p-2 border rounded-l-md"
            />
            <button
              type="button"
              onClick={addImage}
              disabled={!imageUrl.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 disabled:opacity-50"
            >
              Add
            </button>
          </div>

          {formData.images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative group">
                  <div className="relative w-full h-32 overflow-hidden rounded-md">
                    <div className="relative w-full h-full">
                      <Image
                        src={processImageUrl(image.url)}
                        alt={image.alt || `Image ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className={`object-cover ${
                          formData.coverImage === image.url ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '/images/placeholder.jpg';
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCoverImage(image.url);
                        }}
                        className="bg-white text-gray-800 px-2 py-1 rounded text-sm font-medium mr-2 hover:bg-gray-100"
                      >
                        {formData.coverImage === image.url ? '✓ Cover' : 'Set as Cover'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(index);
                        }}
                        className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  {formData.coverImage === image.url && (
                    <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                      Cover
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center">
              <p className="text-gray-500">No images added yet</p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || formData.images.length === 0}
            className={`px-4 py-2 rounded-md text-white ${
              loading || formData.images.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </span>
            ) : isEditing ? (
              'Update Album'
            ) : (
              'Create Album'
            )}
          </button>
        </div>
      </form>

      <GoogleDriveImport
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportFromDrive}
      />
    </div>
  );
}
