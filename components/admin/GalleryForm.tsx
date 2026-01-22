'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiX, FiImage, FiTrash2, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface GalleryImage {
  url: string;
  alt?: string;
  file?: File;
  isNew?: boolean;
}

interface GalleryFormData {
  title: string;
  slug: string;
  description: string;
  isPublished: boolean;
  images: GalleryImage[];
}

interface GalleryFormProps {
  initialData?: {
    _id?: string;
    title: string;
    slug: string;
    description: string;
    isPublished: boolean;
    images: { url: string; alt?: string }[];
  };
  isEdit?: boolean;
}

export default function GalleryForm({ initialData, isEdit = false }: GalleryFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<GalleryFormData>({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    isPublished: initialData?.isPublished || false,
    images: initialData?.images?.map(img => ({ ...img })) || [],
  });

  // Generate slug from title
  useEffect(() => {
    if (!isEdit && formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title, formData.slug, isEdit]);

  // Handle file uploads with dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      alt: '',
      isNew: true,
    }));
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages],
    }));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageAltChange = (index: number, alt: string) => {
    const updatedImages = [...formData.images];
    updatedImages[index] = { ...updatedImages[index], alt };
    setFormData(prev => ({ ...prev, images: updatedImages }));
  };

  const removeImage = (index: number) => {
    const updatedImages = [...formData.images];
    
    // Revoke object URL if it's a new image
    if (updatedImages[index].isNew && updatedImages[index].url.startsWith('blob:')) {
      URL.revokeObjectURL(updatedImages[index].url);
    }
    
    updatedImages.splice(index, 1);
    setFormData(prev => ({ ...prev, images: updatedImages }));
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const updatedImages = [...formData.images];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < updatedImages.length) {
      [updatedImages[index], updatedImages[newIndex]] = [updatedImages[newIndex], updatedImages[index]];
      setFormData(prev => ({ ...prev, images: updatedImages }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.slug) {
      setError('Title and slug are required');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('slug', formData.slug);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('isPublished', String(formData.isPublished));
      
      // Add existing images data
      formData.images.forEach((img, index) => {
        if (!img.isNew) {
          formDataToSend.append(`images[${index}][url]`, img.url);
          formDataToSend.append(`images[${index}][alt]`, img.alt || '');
        }
      });
      
      // Add new image files
      formData.images.forEach((img, index) => {
        if (img.isNew && img.file) {
          formDataToSend.append(`newImages`, img.file);
          formDataToSend.append(`newImagesAlt`, img.alt || '');
        }
      });
      
      const url = isEdit && initialData?._id 
        ? `/api/galleries/${initialData._id}` 
        : '/api/galleries';
      
      const method = isEdit ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        body: formDataToSend,
        credentials: 'include', // This ensures cookies are sent with the request
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save gallery');
      }
      
      const result = await response.json();
      toast.success(isEdit ? 'Gallery updated successfully!' : 'Gallery created successfully!');
      
      // Redirect to galleries list after a short delay
      setTimeout(() => {
        router.push('/admin/galleries');
        router.refresh();
      }, 1000);
      
    } catch (error) {
      console.error('Error saving gallery:', error);
      setError(error instanceof Error ? error.message : 'Failed to save gallery');
      toast.error('Failed to save gallery. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Gallery' : 'Create New Gallery'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isEdit ? 'Update your gallery details and images.' : 'Fill in the details to create a new gallery.'}
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="title"
                    id="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
              
              <div className="sm:col-span-4">
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                  URL Slug <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    /gallery/
                  </span>
                  <input
                    type="text"
                    name="slug"
                    id="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300"
                    required
                    pattern="[a-z0-9-]+"
                    title="Only lowercase letters, numbers, and hyphens are allowed"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Only lowercase letters, numbers, and hyphens are allowed
                </p>
              </div>
              
              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                    placeholder="A brief description of your gallery"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-6">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="isPublished"
                      name="isPublished"
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={handleInputChange}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="isPublished" className="font-medium text-gray-700">
                      Publish this gallery
                    </label>
                    <p className="text-gray-500">
                      {formData.isPublished 
                        ? 'This gallery is visible to the public.' 
                        : 'This gallery is hidden from the public.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900">Gallery Images</h3>
            <p className="mt-1 text-sm text-gray-500">
              Upload and arrange your images. The first image will be used as the cover.
            </p>
          </div>
          
          <div className="px-4 pb-5 sm:px-6">
            {/* Image upload dropzone */}
            <div 
              {...getRootProps()} 
              className={`mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
                isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
              }`}
            >
              <div className="space-y-1 text-center">
                <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                  >
                    <span>Upload files</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" {...getInputProps()} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, WEBP up to 10MB
                </p>
              </div>
            </div>
            
            {/* Image list */}
            {formData.images.length > 0 && (
              <div className="mt-6">
                <div className="space-y-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="flex items-start space-x-4 p-3 border rounded-md hover:bg-gray-50">
                      <div className="flex-shrink-0 h-20 w-20 bg-gray-200 rounded-md overflow-hidden">
                        <img
                          src={image.url}
                          alt={image.alt || `Image ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={image.alt}
                            onChange={(e) => handleImageAltChange(index, e.target.value)}
                            placeholder="Add a caption (optional)"
                            className="block w-full border-0 border-b border-transparent focus:border-indigo-500 focus:ring-0 sm:text-sm p-0"
                          />
                        </div>
                        <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
                          <span>Image {index + 1}</span>
                          {image.isNew && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-1">
                        <button
                          type="button"
                          onClick={() => moveImage(index, 'up')}
                          disabled={index === 0}
                          className={`p-1 rounded-full ${
                            index === 0 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-100'
                          }`}
                          title="Move up"
                        >
                          <FiArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(index, 'down')}
                          disabled={index === formData.images.length - 1}
                          className={`p-1 rounded-full ${
                            index === formData.images.length - 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-100'
                          }`}
                          title="Move down"
                        >
                          <FiArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="p-1 rounded-full text-red-500 hover:bg-red-50"
                          title="Remove"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 text-sm text-gray-500">
                  {formData.images.length} {formData.images.length === 1 ? 'image' : 'images'} in this gallery
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push('/admin/galleries')}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={isSubmitting || formData.images.length === 0}
          >
            {isSubmitting ? (
              'Saving...'
            ) : isEdit ? (
              'Update Gallery'
            ) : (
              'Create Gallery'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
