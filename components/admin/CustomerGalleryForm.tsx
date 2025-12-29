'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import GoogleDriveImport from '@/components/GoogleDriveImport';

interface CustomerGalleryImage {
  url: string;
  alt?: string;
  originalUrl?: string;
  source?: 'upload' | 'google-drive';
  driveFileId?: string;
}

interface CustomerFormData {
  title: string;
  customerName: string;
  customerEmail: string;
  eventDate: string;
  eventType: string;
  driveFolderId: string;
  driveFolderUrl: string;
  notes: string;
  coverPhotoUrl: string;
  photos: CustomerGalleryImage[];
  status: 'draft' | 'published' | 'archived';
  faceRecognitionEnabled: boolean;
}

interface CustomerGalleryFormProps {
  initialData?: CustomerFormData & { _id?: string; albumCode?: string };
  isEditing?: boolean;
  onSave?: () => void;
  isNew?: boolean;
}

export default function CustomerGalleryForm({ 
  initialData, 
  isEditing = false, 
  onSave, 
  isNew = false 
}: CustomerGalleryFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdGallery, setCreatedGallery] = useState<any>(null);

  const [formData, setFormData] = useState<CustomerFormData>({
    title: '',
    customerName: '',
    customerEmail: '',
    eventDate: new Date().toISOString().split('T')[0],
    eventType: '',
    driveFolderId: '',
    driveFolderUrl: '',
    notes: '',
    coverPhotoUrl: '',
    photos: [],
    status: 'draft',
    faceRecognitionEnabled: true // Default to true for new galleries
  });

  // Initialize form with initialData
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        customerName: initialData.customerName || '',
        customerEmail: initialData.customerEmail || '',
        eventDate: initialData.eventDate ? new Date(initialData.eventDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        eventType: initialData.eventType || '',
        driveFolderId: initialData.driveFolderId || '',
        driveFolderUrl: initialData.driveFolderUrl || '',
        notes: initialData.notes || '',
        coverPhotoUrl: initialData.coverPhotoUrl || '',
        photos: initialData.photos || [],
        status: initialData.status || 'draft',
        faceRecognitionEnabled: initialData.faceRecognitionEnabled ?? true // Default to true if not set
      });
    }
  }, [initialData]);

  const handleDriveImport = (images: Array<{ url: string; originalUrl: string; name: string; thumbnailUrl?: string; id: string }>) => {
    const galleryImages: CustomerGalleryImage[] = images.map((img, index) => ({
      url: img.url,
      alt: img.name,
      originalUrl: img.originalUrl,
      source: 'google-drive' as const,
      driveFileId: img.id
    }));

    setFormData(prev => ({
      ...prev,
      photos: galleryImages,
      coverPhotoUrl: galleryImages[0]?.url || prev.coverPhotoUrl,
      driveFolderId: images[0]?.id || prev.driveFolderId
    }));

    setIsImportModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Submitting form data:', formData); // Debug log
      
      const url = isEditing 
        ? `/api/customer-galleries/${initialData?._id}`
        : '/api/customer-galleries';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save gallery');
      }

      const savedGallery = await response.json();
      
      if (isNew) {
        // For new galleries, redirect immediately to admin list
        console.log('Gallery created successfully, redirecting to admin list...');
        router.push('/admin/customer-galleries/list');
      } else {
        // For edits, just navigate back or call onSave
        if (onSave) {
          onSave();
        } else {
          router.push('/admin/customer-galleries/list');
        }
      }
    } catch (error) {
      console.error('Error saving gallery:', error);
      setError(error instanceof Error ? error.message : 'Failed to save gallery');
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => {
      const newPhotos = prev.photos.filter((_, i) => i !== index);
      const newCoverPhoto = prev.coverPhotoUrl === prev.photos[index]?.url 
        ? (newPhotos[0]?.url || '') 
        : prev.coverPhotoUrl;
      
      return {
        ...prev,
        photos: newPhotos,
        coverPhotoUrl: newCoverPhoto
      };
    });
  };

  const setAsCover = (photoUrl: string) => {
    setFormData(prev => ({
      ...prev,
      coverPhotoUrl: photoUrl
    }));
  };

  const copyGalleryLink = async () => {
    if (!createdGallery) return;
    
    const galleryUrl = `https://thewildstudio.org/customer-gallery/${createdGallery.albumCode}`;
    try {
      await navigator.clipboard.writeText(galleryUrl);
      // You could show a temporary "Copied!" message here
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setCreatedGallery(null);
    router.push('/admin/customer-galleries/list');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isNew ? 'Create Customer Gallery' : 'Edit Customer Gallery'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Gallery Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gallery Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                placeholder="Enter gallery title"
              />
            </div>
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Email *
              </label>
              <input
                type="email"
                required
                value={formData.customerEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Date *
              </label>
              <input
                type="date"
                required
                value={formData.eventDate}
                onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type *
              </label>
              <input
                type="text"
                required
                value={formData.eventType}
                onChange={(e) => setFormData(prev => ({ ...prev, eventType: e.target.value }))}
                placeholder="e.g., Wedding, Portrait, Event"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Any notes for the customer..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gallery Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Face Recognition Toggle */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Face Recognition
                </label>
                <p className="text-xs text-gray-500">
                  Enable "Find My Photo" feature for customers to search for their photos using face recognition
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.faceRecognitionEnabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, faceRecognitionEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Google Drive Import */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Photos</h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Import from Google Drive
              </button>
            </div>

            {/* Photos Grid */}
            {formData.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square overflow-hidden rounded-lg border-2 border-gray-200">
                      <Image
                        src={photo.url}
                        alt={photo.alt || `Photo ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    
                    {/* Cover Badge */}
                    {formData.coverPhotoUrl === photo.url && (
                      <div className="absolute top-2 left-2 bg-black text-white text-xs px-2 py-1 rounded">
                        Cover
                      </div>
                    )}

                    {/* Actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                      {formData.coverPhotoUrl !== photo.url && (
                        <button
                          type="button"
                          onClick={() => setAsCover(photo.url)}
                          className="p-2 bg-white rounded-full hover:bg-gray-100"
                          title="Set as cover"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="p-2 bg-white rounded-full hover:bg-gray-100"
                        title="Remove photo"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {formData.photos.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">No photos imported yet</p>
                <p className="text-sm text-gray-400 mt-1">Click "Import from Google Drive" to add photos</p>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/admin/customer-galleries')}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Gallery' : 'Create Gallery')}
            </button>
          </div>
        </form>
      </div>

      {/* Google Drive Import Modal */}
      <GoogleDriveImport
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleDriveImport}
      />

      {/* Success Modal */}
      {showSuccessModal && createdGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Gallery Created Successfully!</h3>
              <p className="text-sm text-gray-600 mb-4">
                {createdGallery.customerName}'s {createdGallery.eventType} gallery is ready.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">Gallery Link:</p>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={`https://thewildstudio.org/customer-gallery/${createdGallery.albumCode}`}
                    readOnly
                    className="flex-1 text-xs bg-white border border-gray-300 rounded px-2 py-1"
                  />
                  <button
                    onClick={copyGalleryLink}
                    className="px-3 py-1 bg-black text-white text-xs rounded hover:bg-gray-800 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => window.open(`https://thewildstudio.org/customer-gallery/${createdGallery.albumCode}`, '_blank')}
                  className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
                >
                  View Gallery
                </button>
                <button
                  onClick={closeSuccessModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
