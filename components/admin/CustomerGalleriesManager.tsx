'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiCopy, FiCalendar, FiMail, FiUser, FiFolder, FiDownload, FiX, FiCheck, FiAlertCircle, FiRefreshCw, FiSearch } from 'react-icons/fi';
import Image from 'next/image';

interface Photo {
  url: string;
  alt: string;
  driveFileId: string;
  order: number;
}

interface CustomerGallery {
  _id: string;
  albumCode: string;
  customerName: string;
  customerEmail: string;
  eventDate: string;
  eventType: string;
  coverPhotoUrl: string;
  photos: Photo[];
  driveFolderId: string;
  driveFolderUrl: string;
  status: 'draft' | 'published' | 'archived';
  deliveryDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  faceRecognitionEnabled?: boolean;
  indexingStatus?: {
    status: 'not_started' | 'in_progress' | 'completed' | 'failed';
    totalPhotos: number;
    indexedPhotos: number;
    progress: number;
    isReadyToSend: boolean;
    estimatedTimeRemaining: number; // in minutes
  };
  faceIndexing?: {
    status: 'not_started' | 'in_progress' | 'completed' | 'failed';
    indexedPhotos: number;
    totalPhotos: number;
    lastIndexedAt: string | null;
    errorMessage: string;
  };
}

function CustomerGalleriesManager() {
  const router = useRouter();
  const [galleries, setGalleries] = useState<CustomerGallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusCache, setStatusCache] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    fetchGalleries();
    
    // Set up real-time polling for indexing status
    const interval = setInterval(() => {
      fetchIndexingStatuses();
    }, 30000); // Update every 30 seconds instead of 5

    return () => clearInterval(interval);
  }, []);

  const fetchIndexingStatuses = async () => {
    try {
      const response = await fetch('/api/customer-galleries');
      if (response.ok) {
        const data = await response.json();
        
        // Only fetch status for galleries that don't have cached status or cache is old
        const galleriesWithStatus = await Promise.all(
          data.map(async (gallery: CustomerGallery) => {
            const cacheKey = gallery.albumCode;
            const cached = statusCache.get(cacheKey);
            const cacheAge = Date.now() - (cached?.timestamp || 0);
            
            // Use cached status if it's less than 2 minutes old
            if (cached && cacheAge < 120000) {
              return {
                ...gallery,
                indexingStatus: cached.status
              };
            }
            
            // Otherwise fetch fresh status
            try {
              const statusResponse = await fetch(`/api/customer-galleries/${gallery.albumCode}/indexing-status`);
              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                
                // Update cache
                setStatusCache(prev => new Map(prev.set(cacheKey, {
                  status: statusData,
                  timestamp: Date.now()
                })));
                
                return {
                  ...gallery,
                  indexingStatus: statusData
                };
              }
            } catch (error) {
              console.error(`Failed to fetch indexing status for ${gallery.albumCode}:`, error);
            }
            return gallery;
          })
        );
        
        setGalleries(prevGalleries => 
          prevGalleries.map(prev => {
            const updated = galleriesWithStatus.find(g => g._id === prev._id);
            return updated ? { ...prev, indexingStatus: updated.indexingStatus } : prev;
          })
        );
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching indexing statuses:', error);
    }
  };

  const manualRefresh = async () => {
    setIsRefreshing(true);
    await fetchIndexingStatuses();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const fetchGalleries = async () => {
    try {
      const response = await fetch('/api/customer-galleries');
      if (response.ok) {
        const data = await response.json();
        
        // Fetch indexing status for each gallery
        const galleriesWithStatus = await Promise.all(
          data.map(async (gallery: CustomerGallery) => {
            try {
              const statusResponse = await fetch(`/api/customer-galleries/${gallery.albumCode}/indexing-status`);
              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                return {
                  ...gallery,
                  indexingStatus: statusData
                };
              }
            } catch (error) {
              console.error(`Failed to fetch indexing status for ${gallery.albumCode}:`, error);
            }
            return gallery;
          })
        );
        
        setGalleries(galleriesWithStatus);
      }
    } catch (error) {
      console.error('Error fetching galleries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this gallery?')) return;

    // Optimistically remove from UI immediately
    const originalGalleries = [...galleries];
    setGalleries(prev => prev.filter(g => g._id !== id));

    try {
      const response = await fetch(`/api/customer-galleries?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        // Revert optimistic update if delete failed
        setGalleries(originalGalleries);
        const error = await response.json();
        alert(`Failed to delete gallery: ${error.error || 'Unknown error'}`);
      }
      // If successful, the optimistic update remains
    } catch (error) {
      // Revert optimistic update if error
      setGalleries(originalGalleries);
      console.error('Error deleting gallery:', error);
      alert('Failed to delete gallery. Please try again.');
    }
  };

  const handleReIndex = async (albumCode: string) => {
    if (!confirm(`Are you sure you want to re-index album "${albumCode}" with super accurate processing? This will take longer but provide better results.`)) return;

    try {
      // Reset indexing status to not_started
      const response = await fetch(`/api/customer-galleries/${albumCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          faceIndexing: { 
            status: 'not_started', 
            indexedPhotos: 0, 
            totalPhotos: 0,
            lastIndexedAt: null,
            errorMessage: ''
          }
        })
      });

      if (response.ok) {
        // Trigger the home server to start indexing
        const homeServerResponse = await fetch(`/api/customer-galleries/${albumCode}/index`, {
          method: 'POST'
        });
        
        if (homeServerResponse.ok) {
          alert('Re-indexing started! The home server will process this album with super accurate face recognition.');
          // Refresh the galleries to show updated status
          await fetchGalleries();
        } else {
          alert('Failed to trigger re-indexing. Please ensure the home server is running.');
        }
      } else {
        const error = await response.json();
        alert(`Failed to reset album: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error re-indexing album:', error);
      alert('Failed to re-index album. Please try again.');
    }
  };

  const handleStatusChange = async (id: string, status: 'draft' | 'published' | 'archived') => {
    // Optimistically update UI immediately
    const originalGalleries = [...galleries];
    setGalleries(prev => prev.map(g => 
      g._id === id ? { ...g, status } : g
    ));

    try {
      const response = await fetch(`/api/customer-galleries?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        // Revert optimistic update if failed
        setGalleries(originalGalleries);
        const error = await response.json();
        alert(`Failed to update status: ${error.error || 'Unknown error'}`);
      }
      // If successful, the optimistic update remains
    } catch (error) {
      // Revert optimistic update if error
      setGalleries(originalGalleries);
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const copyAlbumCode = async (albumCode: string) => {
    const url = `${window.location.origin}/customer-gallery/${albumCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(albumCode);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {/* Title Section */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Customer Galleries</h1>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-2 space-y-2 sm:space-y-0">
              <p className="text-gray-600">Manage private photo galleries for your customers</p>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="order-2 sm:order-1">
              {/* Mobile: New Gallery button first */}
              <button
                onClick={() => router.push('/admin/customer-galleries')}
                className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <FiPlus className="w-4 h-4 mr-2" />
                New Gallery
              </button>
            </div>
            <div className="order-1 sm:order-2">
              {/* Mobile: Refresh button second */}
              <button
                onClick={manualRefresh}
                disabled={isRefreshing}
                className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <FiRefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Galleries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleries.map((gallery) => (
            <motion.div
              key={gallery._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              {/* Cover Photo */}
              <div className="relative h-48 bg-gray-100 rounded-t-lg">
                {gallery.coverPhotoUrl ? (
                  <Image
                    src={gallery.coverPhotoUrl}
                    alt={`${gallery.customerName}'s ${gallery.eventType}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <FiFolder className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                
                {/* Status and Face Search Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    gallery.status === 'published' 
                      ? 'bg-green-100 text-green-800'
                      : gallery.status === 'archived'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {gallery.status}
                  </span>
                  
                  {/* Face Search Status */}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    gallery.faceRecognitionEnabled !== false
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    Face: {gallery.faceRecognitionEnabled !== false ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>

              {/* Gallery Info */}
              <div className="p-6">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  {gallery.customerName}
                </h3>
                <p className="text-sm text-gray-600 mb-1">{gallery.eventType}</p>
                <p className="text-xs text-gray-500 mb-4">
                  {new Date(gallery.eventDate).toLocaleDateString()}
                </p>

                {/* Album Code */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {gallery.albumCode}
                    </span>
                    <button
                      onClick={() => copyAlbumCode(gallery.albumCode)}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {copiedCode === gallery.albumCode ? (
                        <FiCheck className="w-4 h-4 text-green-500" />
                      ) : (
                        <FiCopy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Indexing Status */}
                {gallery.indexingStatus && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700">Face Recognition</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        gallery.indexingStatus.isReadyToSend
                          ? 'bg-green-100 text-green-800'
                          : gallery.indexingStatus.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : gallery.indexingStatus.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {gallery.indexingStatus.isReadyToSend
                          ? 'Ready'
                          : gallery.indexingStatus.status === 'in_progress'
                          ? 'Indexing...'
                          : gallery.indexingStatus.status === 'failed'
                          ? 'Failed'
                          : 'Not Started'
                        }
                      </span>
                    </div>
                    {gallery.indexingStatus.status === 'in_progress' && (
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <motion.div 
                          className="bg-yellow-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${gallery.indexingStatus.progress}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {gallery.indexingStatus.indexedPhotos} / {gallery.indexingStatus.totalPhotos} photos indexed
                      {gallery.indexingStatus.status === 'in_progress' && (
                        <span className="ml-2">
                          • {gallery.indexingStatus.estimatedTimeRemaining > 0 
                            ? `${gallery.indexingStatus.estimatedTimeRemaining} min remaining`
                            : 'Calculating...'
                          }
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center justify-center sm:justify-start space-x-2">
                    <button
                      onClick={() => window.open(`/customer-gallery/${gallery.albumCode}`, '_blank')}
                      className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      title="View Gallery"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => router.push(`/admin/customer-galleries/edit/${gallery._id}`)}
                      className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Edit"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReIndex(gallery.albumCode)}
                      className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Re-index with Super Accurate Mode"
                      disabled={gallery.faceIndexing?.status === 'in_progress'}
                    >
                      <FiRefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(gallery._id)}
                      className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Status Toggle */}
                  <select
                    value={gallery.status}
                    onChange={(e) => handleStatusChange(gallery._id, e.target.value as any)}
                    className="w-full sm:w-auto text-xs border border-gray-300 rounded px-2 py-1 text-center"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {galleries.length === 0 && (
          <div className="text-center py-12 px-4">
            <FiFolder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No galleries yet</h3>
            <p className="text-gray-600 mb-4">Create your first customer gallery to get started</p>
            <button
              onClick={() => router.push('/admin/customer-galleries')}
              className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors mx-auto"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Create Gallery
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerGalleriesManager;
