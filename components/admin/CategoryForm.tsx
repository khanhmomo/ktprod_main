'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiSave, FiX, FiImage } from 'react-icons/fi';
import Image from 'next/image';
import GoogleDriveImport from '../GoogleDriveImport';

interface Category {
  id?: string;
  name: string;
  slug: string;
  coverImage: string;
  description?: string;
  isActive?: boolean;
}

type CategoryFormProps = {
  initialData?: Category;
  isEditing?: boolean;
};

export default function CategoryForm({ initialData, isEditing = false }: CategoryFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<Omit<Category, 'id'>>({
    name: '',
    slug: '',
    coverImage: '',
    description: '',
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isDriveImportOpen, setIsDriveImportOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        slug: initialData.slug,
        coverImage: initialData.coverImage,
        description: initialData.description || '',
        isActive: initialData.isActive ?? true,
      });
      setImagePreview(initialData.coverImage);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: value,
        slug: slug
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    
    // Check if it's a Google Drive file URL and convert to proxy URL
    let finalUrl = url;
    if (url.includes('drive.google.com/file/d/')) {
      const match = url.match(/\/file\/d\/([\w-]+)/);
      if (match && match[1]) {
        finalUrl = `/api/drive/image?id=${encodeURIComponent(match[1])}`;
        console.log('🔄 Google Drive URL detected and converted to proxy URL');
      }
    }
    
    setFormData(prev => ({ ...prev, coverImage: finalUrl }));
    setImagePreview(finalUrl);
  };

  const handleDriveImageImport = (images: Array<{ url: string; originalUrl: string; name: string; thumbnailUrl?: string; id: string }>) => {
    if (images.length > 0) {
      const image = images[0]; // Take the first selected image for category cover
      const proxyUrl = `/api/drive/image?id=${encodeURIComponent(image.id)}`;
      setFormData(prev => ({ ...prev, coverImage: proxyUrl }));
      setImagePreview(proxyUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the cover image URL
    if (!formData.coverImage.trim()) {
      alert('Please enter a cover image URL');
      return;
    }
    
    // Basic URL validation - accept regular URLs and Google Drive URLs
    const urlPattern = /^(https?:\/\/|\/api\/drive\/image)/;
    const driveUrlPattern = /drive\.google\.com\/file\/d\//;
    
    if (!urlPattern.test(formData.coverImage) && !driveUrlPattern.test(formData.coverImage)) {
      alert('Please enter a valid image URL or Google Drive file URL');
      return;
    }
    
    setIsLoading(true);

    try {
      const url = isEditing && initialData?.id
        ? `/api/categories/${initialData.id}`
        : '/api/categories';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/admin/categories');
        router.refresh();
      } else {
        let errorMessage = 'Failed to save category. Please try again.';
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Category' : 'Create New Category'}
          </h1>
          <button
            onClick={() => router.push('/admin/categories')}
            className="text-gray-600 hover:text-gray-900"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Wedding Day"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
              URL Slug *
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., wedding-day"
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be used in the URL: /gallery/{formData.slug}
            </p>
          </div>

          <div>
            <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image *
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    id="coverImage"
                    name="coverImage"
                    value={formData.coverImage}
                    onChange={handleImageChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg or https://drive.google.com/file/d/FILE_ID"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsDriveImportOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center"
                >
                  <FiImage className="mr-2 h-5 w-5" />
                  Google Drive
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Enter any image URL including Google Drive file links, or use the Google Drive import button
              </p>
            </div>
          </div>

          {imagePreview && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image Preview
              </label>
              <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={imagePreview}
                  alt="Category cover preview"
                  fill
                  className="object-cover"
                  onError={() => setImagePreview('')}
                />
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, coverImage: '' }));
                    setImagePreview('');
                  }}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                  title="Remove image"
                >
                  <FiX className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional description for this category..."
            />
          </div>

          {isEditing && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Active (visible in public gallery)
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/admin/categories')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="mr-2 h-5 w-5" />
                  {isEditing ? 'Update Category' : 'Create Category'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Google Drive Import Modal */}
      <GoogleDriveImport
        isOpen={isDriveImportOpen}
        onClose={() => setIsDriveImportOpen(false)}
        onImport={handleDriveImageImport}
      />
    </>
  );
}
