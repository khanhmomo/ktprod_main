'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AlbumFormProps {
  initialData?: {
    _id?: string;
    title: string;
    description: string;
    coverImage: string;
    images: { url: string; alt?: string }[];
    date: string;
    location: string;
    isPublished: boolean;
  };
  isEditing?: boolean;
  onSave?: () => void;
  isNew?: boolean;
}

export default function AlbumForm({ initialData, isEditing = false, onSave, isNew = false }: AlbumFormProps) {
  const router = useRouter();
  interface AlbumImage {
    url: string;
    alt?: string;
  }

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImage: '',
    images: [] as AlbumImage[],
    date: new Date().toISOString().split('T')[0],
    location: '',
    isPublished: false,
  });
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        // Ensure images always have an alt property
        images: initialData.images.map(img => ({
          url: img.url,
          alt: img.alt || ''
        }))
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description,
        coverImage: initialData.coverImage,
        images: initialData.images,
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        location: initialData.location,
        isPublished: initialData.isPublished,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    const checked = target.checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addImage = () => {
    const trimmedUrl = imageUrl.trim();
    if (trimmedUrl === '') return;
    
    // Basic URL validation
    try {
      new URL(trimmedUrl); // This will throw for invalid URLs
      
      // Check for duplicate URLs
      if (formData.images.some(img => img.url === trimmedUrl)) {
        alert('This image URL has already been added.');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, { url: trimmedUrl, alt: '' }]
      }));
      setImageUrl('');
    } catch (e) {
      alert('Please enter a valid URL (e.g., https://example.com/image.jpg)');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      
      // If we removed the cover image, set a new one if possible
      let newCoverImage = prev.coverImage;
      if (prev.coverImage === prev.images[index]?.url && newImages.length > 0) {
        newCoverImage = newImages[0].url;
      } else if (newImages.length === 0) {
        newCoverImage = '';
      }
      
      return {
        ...prev,
        images: newImages,
        coverImage: newCoverImage
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!formData.title.trim()) {
      setError('Title is required');
      setLoading(false);
      return;
    }

    if (formData.images.length === 0) {
      setError('Please add at least one image');
      setLoading(false);
      return;
    }

    if (!formData.coverImage) {
      setError('Please select a cover image');
      setLoading(false);
      return;
    }

    try {
      const url = isEditing && initialData?._id 
        ? `/api/albums/${initialData._id}`
        : '/api/albums';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      console.log('Sending request to:', url);
      console.log('Request method:', method);
      console.log('Request body:', JSON.stringify(formData, null, 2));
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json().catch(() => ({}));
      console.log('Response status:', response.status);
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to save album');
      }

      if (onSave) {
        onSave();
      }
      
      router.push('/admin/dashboard');
      router.refresh(); // Refresh the page to show the updated data
    } catch (error) {
      console.error('Error saving album:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(`Failed to save album: ${errorMessage}`);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Album' : 'Create New Album'}</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
              required
            />
          </div>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
            />
          </div>
          
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublished"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleChange}
              className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
            />
            <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-700">
              Publish this album
            </label>
          </div>
        </div>
        
        <div className="mt-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
          />
        </div>
        
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Images *
            </label>
            <span className="text-sm text-gray-500">
              {formData.images.length} {formData.images.length === 1 ? 'image' : 'images'} added
            </span>
          </div>
          
          <div className="mb-4">
            <div className="flex gap-2 mb-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                pattern="https?://.+"
                title="Please enter a valid URL starting with http:// or https://"
              />
              <button
                type="button"
                onClick={addImage}
                disabled={!imageUrl.trim()}
                className={`px-4 py-2 rounded-md ${
                  imageUrl.trim() 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                Add
              </button>
            </div>
          </div>
          
          {formData.images.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img.url}
                      alt={img.alt || `Image ${index + 1}`}
                      className={`w-full h-32 object-cover rounded-md ${
                        formData.coverImage === img.url 
                          ? 'ring-2 ring-blue-500 ring-offset-2' 
                          : 'border border-gray-200'
                      }`}
                    />
                    {formData.coverImage === img.url && (
                      <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1 rounded">
                        Cover
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, coverImage: img.url }))}
                        className={`p-1 rounded-full ${
                          formData.coverImage === img.url
                            ? 'bg-blue-700 text-white cursor-default'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        title="Set as cover"
                        disabled={formData.coverImage === img.url}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="p-1 bg-red-600 rounded-full text-white hover:bg-red-700"
                        title="Remove image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Image alt text inputs */}
              <div className="space-y-2">
                {formData.images.map((img, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 w-8">{index + 1}.</span>
                    <input
                      type="text"
                      value={img.alt || ''}
                      onChange={(e) => {
                        const newImages = [...formData.images];
                        newImages[index].alt = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          images: newImages
                        }));
                      }}
                      placeholder="Image description (optional)"
                      className="flex-1 text-sm px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-md text-gray-500">
              No images added yet. Add an image URL above.
            </div>
          )}
          
          {!formData.coverImage && formData.images.length > 0 && (
            <p className="mt-2 text-sm text-red-600">Please select a cover image</p>
          )}
        </div>
        
        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || formData.images.length === 0 || !formData.coverImage}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Album'}
          </button>
        </div>
      </form>
    </div>
  );
}
