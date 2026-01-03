'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import GoogleDriveImport from '@/components/GoogleDriveImport';

interface BusinessGalleryImage {
  url: string;
  alt?: string;
  originalUrl?: string;
  source?: 'upload' | 'google-drive';
  id: string; // Google Drive file ID
  name: string;
  thumbnailUrl?: string;
}

interface BusinessFormData {
  title: string;
  businessName: string;
  businessEmail: string;
  eventDate: string;
  eventType: string;
  driveFolderId: string;
  driveFolderUrl: string;
  notes: string;
  coverPhotoUrl: string;
  photos: BusinessGalleryImage[];
  status: 'draft' | 'published' | 'archived';
  // Business-specific fields
  backgroundColor: string;
  backgroundImageUrl: string;
  backgroundImageId: string;
}

interface BusinessGalleryFormProps {
  initialData?: BusinessFormData & { _id?: string; albumCode?: string };
  isEditing?: boolean;
  onSave?: () => void;
  isNew?: boolean;
}

export default function BusinessGalleryForm({ 
  initialData, 
  isEditing = false, 
  onSave, 
  isNew = false 
}: BusinessGalleryFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdGallery, setCreatedGallery] = useState<any>(null);

  const [formData, setFormData] = useState<BusinessFormData>({
    title: '',
    businessName: '',
    businessEmail: '',
    eventDate: '',
    eventType: '',
    driveFolderId: '',
    driveFolderUrl: '',
    notes: '',
    coverPhotoUrl: '',
    photos: [],
    status: 'draft',
    backgroundColor: '#ffffff',
    backgroundImageUrl: '',
    backgroundImageId: '',
  });

  const [isBackgroundImageModalOpen, setIsBackgroundImageModalOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      // Transform photos from database format to form format
      const transformedPhotos = initialData.photos?.map((photo: any) => ({
        url: photo.url,
        alt: photo.alt || '',
        originalUrl: photo.url,
        source: 'google-drive' as const,
        id: photo.driveFileId, // Map driveFileId to id for form
        name: photo.alt || `Photo`,
        thumbnailUrl: photo.url
      })) || [];

      setFormData({
        title: initialData.title || '',
        businessName: initialData.businessName || '',
        businessEmail: initialData.businessEmail || '',
        eventDate: initialData.eventDate ? new Date(initialData.eventDate).toISOString().split('T')[0] : '',
        eventType: initialData.eventType || '',
        driveFolderId: initialData.driveFolderId || '',
        driveFolderUrl: initialData.driveFolderUrl || '',
        notes: initialData.notes || '',
        coverPhotoUrl: initialData.coverPhotoUrl || '',
        photos: transformedPhotos,
        status: initialData.status || 'draft',
        backgroundColor: initialData.backgroundColor || '#ffffff',
        backgroundImageUrl: initialData.backgroundImageUrl || '',
        backgroundImageId: initialData.backgroundImageId || '',
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check form validation first
      if (!formData.title) {
        throw new Error('Title is required');
      }
      if (!formData.businessName) {
        throw new Error('Business name is required');
      }
      if (!formData.businessEmail) {
        throw new Error('Business email is required');
      }
      if (!formData.eventDate) {
        throw new Error('Event date is required');
      }
      if (!formData.eventType) {
        throw new Error('Event type is required');
      }
      
      // Transform photos to match database schema
      const transformedPhotos = formData.photos.map((photo, index) => ({
        url: photo.url,
        alt: photo.alt || photo.name || `Photo ${index + 1}`,
        driveFileId: photo.id, // Map id to driveFileId for database
        order: index
      }));

      const submissionData = {
        ...formData,
        photos: transformedPhotos
      };

      const url = isEditing ? `/api/business-galleries?id=${initialData?._id}` : '/api/business-galleries';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to save business gallery';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // If response is not JSON, get the text instead
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch (textError) {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      const savedGallery = await response.json();
      setCreatedGallery(savedGallery);
      setShowSuccessModal(true);

      if (onSave) {
        onSave();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (images: BusinessGalleryImage[]) => {
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...images],
      coverPhotoUrl: prev.coverPhotoUrl || (images[0]?.url || ''),
      driveFolderId: images[0]?.id || prev.driveFolderId,
      driveFolderUrl: prev.driveFolderUrl || `https://drive.google.com/drive/folders/${images[0]?.id || ''}`
    }));
    setIsImportModalOpen(false);
  };

  const handleBackgroundImageImport = (images: BusinessGalleryImage[]) => {
    if (images.length > 0) {
      setFormData(prev => ({
        ...prev,
        backgroundImageUrl: images[0].url,
        backgroundImageId: images[0].id || '',
      }));
    }
    setIsBackgroundImageModalOpen(false);
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const setCoverPhoto = (url: string) => {
    setFormData(prev => ({ ...prev, coverPhotoUrl: url }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Business Gallery' : 'Create New Business Gallery'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditing ? 'Update business gallery information' : 'Set up a new gallery for business clients'}
            </p>
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

            {/* Business Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.businessEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessEmail: e.target.value }))}
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
                Business Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Any notes for the business client..."
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

            {/* Background Customization */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Background Customization</h3>
              
              <div className="space-y-4">
                {/* Background Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                {/* Background Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Image (Optional)
                  </label>
                  <div className="space-y-3">
                    {formData.backgroundImageUrl && (
                      <div className="relative">
                        <Image
                          src={formData.backgroundImageUrl}
                          alt="Background preview"
                          width={400}
                          height={200}
                          className="rounded-lg object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-medium">Background Image</span>
                        </div>
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => setIsBackgroundImageModalOpen(true)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      {formData.backgroundImageUrl ? 'Change Background Image' : 'Upload Background Image'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Drive Photos */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Gallery Photos</h3>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Import from Google Drive
                </button>
              </div>

              {formData.photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.photos.map((photo, index) => (
                    <div key={photo.id} className="relative group">
                      <div className="aspect-square relative overflow-hidden rounded-lg">
                        <Image
                          src={photo.url}
                          alt={photo.alt || `Photo ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      
                      {/* Cover photo indicator */}
                      {formData.coverPhotoUrl === photo.url && (
                        <div className="absolute top-2 left-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded">
                          Cover
                        </div>
                      )}

                      {/* Actions overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setCoverPhoto(photo.url)}
                          className="p-2 bg-white rounded-full hover:bg-gray-100"
                          title="Set as cover photo"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
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
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => router.push('/admin/business-renting')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : (isEditing ? 'Update Gallery' : 'Create Gallery')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Google Drive Import Modal */}
      <GoogleDriveImport
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
      />

      {/* Background Image Import Modal */}
      <GoogleDriveImport
        isOpen={isBackgroundImageModalOpen}
        onClose={() => setIsBackgroundImageModalOpen(false)}
        onImport={handleBackgroundImageImport}
      />

      {/* Success Modal */}
      {showSuccessModal && createdGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isEditing ? 'Gallery Updated Successfully!' : 'Gallery Created Successfully!'}
              </h3>
              <p className="text-gray-600 mb-4">
                Business gallery "{createdGallery.title}" {isEditing ? 'has been updated' : `has been created with album code: <strong>${createdGallery.albumCode}</strong>`}
              </p>
              <div className="bg-gray-50 rounded p-3 mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Next Steps:</strong><br />
                  {isEditing ? (
                    <>
                      1. Review any changes to the gallery<br />
                      2. Upload additional photos if needed<br />
                      3. Share the updated gallery link with your client
                    </>
                  ) : (
                    <>
                      1. Upload photos to the Google Drive folder<br />
                      2. Use the Indexing App to process face recognition<br />
                      3. Share the gallery link with your client
                    </>
                  )}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push('/admin/business-renting/list');
                  }}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Done
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    // Reset form for new gallery
                    setFormData({
                      title: '',
                      businessName: '',
                      businessEmail: '',
                      eventDate: '',
                      eventType: '',
                      driveFolderId: '',
                      driveFolderUrl: '',
                      notes: '',
                      coverPhotoUrl: '',
                      photos: [],
                      status: 'draft',
                      backgroundColor: '#ffffff',
                      backgroundImageUrl: '',
                      backgroundImageId: '',
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Create Another
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
