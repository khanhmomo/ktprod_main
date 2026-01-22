'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import RichTextEditor from '@/components/admin/RichTextEditor';

interface Advertisement {
  id: string;
  title: string;
  content: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdvertisementsPage() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAd, setCurrentAd] = useState<Partial<Advertisement> | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasActiveAd, setHasActiveAd] = useState(false);
  const [imageInputUrl, setImageInputUrl] = useState('');

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const res = await fetch('/api/admin/advertisements');
      if (res.ok) {
        const data = await res.json();
        setAds(data);
        setHasActiveAd(data.some((ad: Advertisement) => ad.isActive));
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAd) return;

    // If creating a new ad and making it active, deactivate all other ads
    if (!currentAd.id && currentAd.isActive) {
      try {
        await fetch('/api/admin/advertisements/deactivate-all', {
          method: 'POST',
        });
      } catch (error) {
        console.error('Error deactivating other ads:', error);
      }
    }

    const url = currentAd.id 
      ? `/api/admin/advertisements/${currentAd.id}`
      : '/api/admin/advertisements';
    
    const method = currentAd.id ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentAd),
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchAds();
      } else {
        console.error('Failed to save ad');
      }
    } catch (error) {
      console.error('Error saving ad:', error);
    }
  };

  const deleteAd = async (id: string) => {
    if (confirm('Are you sure you want to delete this ad?')) {
      try {
        await fetch(`/api/admin/advertisements/${id}`, { method: 'DELETE' });
        fetchAds();
      } catch (error) {
        console.error('Error deleting ad:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Advertisements</h1>
        <div className="flex gap-3">
          {!isModalOpen && (
            <button
              onClick={() => {
                setCurrentAd({
                  title: '',
                  content: '',
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  isActive: true,
                });
                setIsModalOpen(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={hasActiveAd}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Advertisement
            </button>
          )}
        </div>
      </div>

      {hasActiveAd && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            <strong>Note:</strong> Only one advertisement can be active at a time. 
            Creating a new active advertisement will deactivate the current one.
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ads.map((ad) => (
              <tr key={ad.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{ad.title}</div>
                  {ad.ctaText && (
                    <div className="text-sm text-gray-500">CTA: {ad.ctaText}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${ad.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {ad.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(ad.startDate), 'MMM d, yyyy')} - {format(new Date(ad.endDate), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      setCurrentAd(ad);
                      setIsModalOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteAd(ad.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && currentAd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[90vh] overflow-y-auto">
            <div className="p-3 sm:p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  {currentAd.id ? 'Edit' : 'New'} Advertisement
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 text-xs sm:text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="advertisement-form"
                    className="px-2 py-1 sm:px-3 sm:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs sm:text-sm"
                  >
                    {currentAd.id ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
              
              <form id="advertisement-form" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                  {/* Form Section - 2 columns on desktop */}
                  <div className="xl:col-span-2 space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        value={currentAd.title || ''}
                        onChange={(e) => setCurrentAd({ ...currentAd, title: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs sm:text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700">Content</label>
                      <RichTextEditor
                        content={currentAd?.content || ''}
                        onChange={(content) => setCurrentAd(prev => prev ? { ...prev, content } : null)}
                        placeholder="Enter advertisement content here..."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700">Start Date</label>
                        <input
                          type="date"
                          value={currentAd.startDate?.toString().split('T')[0] || ''}
                          onChange={(e) => setCurrentAd({ ...currentAd, startDate: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700">End Date</label>
                        <input
                          type="date"
                          value={currentAd.endDate?.toString().split('T')[0] || ''}
                          onChange={(e) => setCurrentAd({ ...currentAd, endDate: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs sm:text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700">CTA Text</label>
                        <input
                          type="text"
                          value={currentAd.ctaText || ''}
                          onChange={(e) => setCurrentAd({ ...currentAd, ctaText: e.target.value })}
                          placeholder="Book Now"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700">CTA Link</label>
                        <input
                          type="url"
                          value={currentAd.ctaLink || ''}
                          onChange={(e) => setCurrentAd({ ...currentAd, ctaLink: e.target.value })}
                          placeholder="https://example.com/book-now"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700">Image URL</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-2 sm:px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-xs">
                          <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                        </span>
                        <input
                          type="url"
                          value={imageInputUrl}
                          onChange={(e) => setImageInputUrl(e.target.value)}
                          placeholder="https://drive.google.com/file/d/..."
                          className="flex-1 min-w-0 block w-full px-2 sm:px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                          onBlur={(e) => {
                            const url = e.target.value;
                            if (url.trim()) {
                              // Check if it's already a proxy URL
                              if (url.includes('/api/drive/image?id=')) {
                                return; // Already converted
                              }
                              
                              if (!url.includes('drive.google.com') && !url.includes('googleusercontent.com')) {
                                alert('Please enter a valid Google Drive URL');
                                setImageInputUrl('');
                                setCurrentAd({ ...currentAd, imageUrl: '' });
                                return;
                              }
                              
                              let fileId = '';
                              const patterns = [
                                /\/file\/d\/([\w-]+)/,
                                /[?&]id=([\w-]+)/,
                                /^([\w-]{25,})$/
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
                                setImageInputUrl('');
                                setCurrentAd({ ...currentAd, imageUrl: '' });
                                return;
                              }
                              
                              const proxyUrl = `/api/drive/image?id=${encodeURIComponent(fileId)}`;
                              setCurrentAd({ ...currentAd, imageUrl: proxyUrl });
                            }
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Paste Google Drive URL and click outside to convert
                      </p>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="isActive"
                        type="checkbox"
                        checked={currentAd.isActive || false}
                        onChange={(e) => setCurrentAd({ ...currentAd, isActive: e.target.checked })}
                        className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="ml-2 block text-xs sm:text-sm text-gray-700">
                        Active
                      </label>
                    </div>
                  </div>

                  {/* Preview Section - 1 column on desktop */}
                  <div className="xl:col-span-1">
                    <div className="sticky top-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Preview</h3>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 bg-gray-50">
                        {/* Advertisement Popup Preview */}
                        <div className="bg-white rounded-lg shadow-lg max-w-full mx-auto overflow-hidden">
                          {currentAd.imageUrl && (
                            <div className="h-32 bg-gray-100 overflow-hidden">
                              <img 
                                src={currentAd.imageUrl} 
                                alt={currentAd.title} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          <div className="p-4">
                            <h4 className="text-lg font-bold text-center mb-2 text-red-600">
                              {currentAd.title || 'Advertisement Title'}
                            </h4>
                            <div 
                              className="prose prose-sm text-gray-600 mb-4 text-center"
                              dangerouslySetInnerHTML={{ __html: currentAd.content || '<p>Advertisement content will appear here...</p>' }}
                            />
                            
                            {currentAd.ctaLink && currentAd.ctaText && (
                              <div className="text-center">
                                <a
                                  href={currentAd.ctaLink}
                                  className="inline-block bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-full text-sm"
                                >
                                  {currentAd.ctaText}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-4 text-xs text-gray-500 text-center">
                          <p>Preview of how your advertisement will appear</p>
                          <p>Active: {currentAd.isActive ? 'Yes' : 'No'}</p>
                          {currentAd.startDate && currentAd.endDate && (
                            <p>
                              {format(new Date(currentAd.startDate), 'MMM d, yyyy')} - {format(new Date(currentAd.endDate), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
