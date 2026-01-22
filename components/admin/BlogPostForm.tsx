'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiSave, FiX, FiImage } from 'react-icons/fi';
import RichTextEditor from './RichTextEditor';
import Image from 'next/image';

type BlogPost = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  status: 'draft' | 'published';
  publishedAt: string;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[];
};

type BlogPostFormProps = {
  initialData?: Partial<BlogPost>;
  isEditing?: boolean;
};

export default function BlogPostForm({ initialData, isEditing = false }: BlogPostFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<BlogPost, 'id'>>(() => {
    const defaultData = {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featuredImage: '',
      status: 'draft' as const,
      publishedAt: new Date().toISOString().split('T')[0],
      metaTitle: '',
      metaDescription: '',
      tags: [] as string[],
    };

    console.log('Form initialization - initialData:', initialData);

    if (!initialData) {
      console.log('No initial data, using defaults');
      return defaultData;
    }

    const finalData = {
      ...defaultData,
      ...initialData,
      // Ensure publishedAt is properly formatted for date inputs
      publishedAt: initialData.publishedAt ? new Date(initialData.publishedAt).toISOString().split('T')[0] : defaultData.publishedAt,
    };

    console.log('Final form data:', finalData);
    return finalData;
  });

  const [tagInput, setTagInput] = useState('');

  // Debug: Log form data changes
  useEffect(() => {
    console.log('Form data updated:', formData);
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    console.log(`handleChange called for field: ${name}, value:`, value);
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      console.log('New form data:', newData);
      return newData;
    });
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      content
    }));
  };

  const handleGoogleDriveUrl = (url: string) => {
    if (url.trim()) {
      console.log('Original URL:', url);
      
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
      
      console.log('Extracted file ID:', fileId);
      
      // Create the proxy URL
      const proxyUrl = `/api/drive/image?id=${encodeURIComponent(fileId)}`;
      console.log('Generated proxy URL:', proxyUrl);
      
      setFormData(prev => ({
        ...prev,
        featuredImage: proxyUrl
      }));
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags?.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...(prev.tags || []), tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  // Function to process image URLs for display (same as AlbumForm)
  const processImageUrl = (url: string) => {
    console.log('Processing URL:', url);
    
    if (!url) return '';
    
    // If it's already a processed URL, return as is
    if (url.startsWith('/api/') || url.startsWith('http')) {
      console.log('URL already processed, returning as is');
      return url;
    }
    
    // If it's a Google Drive URL, use the proxy API
    if (url.includes('drive.google.com') || url.includes('googleusercontent.com')) {
      console.log('Detected Google Drive URL');
      // Extract file ID from Google Drive URL
      let fileId = '';
      const match = url.match(/[\w-]{25,}/);
      if (match) fileId = match[0];
      
      console.log('Extracted file ID:', fileId);
      
      if (fileId) {
        const proxyUrl = `/api/drive/image?id=${encodeURIComponent(fileId)}`;
        console.log('Generated proxy URL:', proxyUrl);
        return proxyUrl;
      } else {
        console.error('Could not extract file ID from URL');
      }
    }
    
    // For relative URLs, prepend the base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const finalUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
    console.log('Final URL (base URL):', finalUrl);
    return finalUrl;
  };

  
  
  const handleSubmit = async (e: React.FormEvent) => {
    console.log('handleSubmit called!');
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log('Submitting form data:', formData);
      
      const url = isEditing && initialData?.id 
        ? `/api/admin/blog/${initialData.id}`
        : '/api/admin/blog';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      console.log(`isEditing: ${isEditing}, initialData?.id: ${initialData?.id}`);
      console.log(`Making ${method} request to:`, url);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/admin/blog');
        router.refresh();
      } else {
        let errorMessage = 'Failed to save post. Please try again.';
        try {
          const error = await response.json();
          console.error('Error saving post:', error);
          errorMessage = error.error || error.message || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          const errorText = await response.text();
          console.error('Raw error response:', errorText);
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
        </h1>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => router.push('/admin/blog')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FiX className="mr-2 h-4 w-4" />
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              handleSubmit(new Event('submit') as unknown as React.FormEvent);
              setFormData(prev => ({ ...prev, status: 'draft' }));
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={() => {
              console.log('Publish button clicked - setting status to published');
              setFormData(prev => ({ ...prev, status: 'published' }));
              setTimeout(() => {
                console.log('Calling handleSubmit after setting status');
                handleSubmit(new Event('submit') as unknown as React.FormEvent);
              }, 100);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            <FiSave className="mr-2 h-4 w-4" />
            {isLoading ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter post title"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                  URL Slug *
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    /blog/
                  </span>
                  <input
                    type="text"
                    name="slug"
                    id="slug"
                    required
                    value={formData.slug}
                    onChange={handleChange}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300"
                    placeholder="post-url-slug"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700">
                  Excerpt
                </label>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  rows={3}
                  value={formData.excerpt}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="A brief summary of your post"
                />
                <p className="mt-2 text-sm text-gray-500">
                  This will be shown in blog post listings and search results.
                </p>
              </div>

              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Featured Image
                </label>
                <div className="mt-1">
                  <div className="mb-2">
                    <span className="text-sm text-gray-500">Add image via Google Drive:</span>
                  </div>

                  {/* Google Drive URL Input */}
                  <div className="flex mb-4">
                    <input
                      type="text"
                      placeholder="Paste Google Drive image URL"
                      className="flex-1 p-2 border rounded-l-md"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleGoogleDriveUrl(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        handleGoogleDriveUrl(input.value);
                        input.value = '';
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
                    >
                      Add URL
                    </button>
                  </div>

                  {/* Image Preview */}
                  {formData.featuredImage ? (
                    <div className="relative w-full border-2 border-gray-200 rounded-md p-4">
                      <div className="relative w-full h-60">
                        <Image
                          src={processImageUrl(formData.featuredImage)}
                          alt="Featured"
                          fill
                          className="object-contain rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = '/images/placeholder.jpg';
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, featuredImage: '' }))}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                        title="Remove image"
                      >
                        <FiX className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center">
                      <FiImage className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">No image added</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Add a Google Drive image URL or browse your Google Drive
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <RichTextEditor 
                  content={formData.content}
                  onChange={handleContentChange}
                  placeholder="Write your blog post here..."
                />
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                  Tags
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="tags"
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Add tags (press Enter to add)"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none"
                      >
                        <span className="sr-only">Remove tag</span>
                        <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                          <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    name="metaTitle"
                    id="metaTitle"
                    value={formData.metaTitle || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="SEO title (leave empty to use post title)"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700">
                  Meta Description
                </label>
                <textarea
                  id="metaDescription"
                  name="metaDescription"
                  rows={3}
                  value={formData.metaDescription || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="A brief description for search engines (leave empty to use excerpt)"
                />
                <p className="mt-2 text-sm text-gray-500">
                  This should be no longer than 160 characters.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
