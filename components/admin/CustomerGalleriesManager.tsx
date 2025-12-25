'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiCopy, FiCalendar, FiMail, FiUser, FiFolder, FiDownload, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
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
}

function CustomerGalleriesManager() {
  const router = useRouter();
  const [galleries, setGalleries] = useState<CustomerGallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchGalleries();
  }, []);

  const fetchGalleries = async () => {
    try {
      const response = await fetch('/api/customer-galleries');
      if (response.ok) {
        const data = await response.json();
        setGalleries(data);
      }
    } catch (error) {
      console.error('Error fetching galleries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this gallery?')) return;

    try {
      const response = await fetch(`/api/customer-galleries/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchGalleries();
      }
    } catch (error) {
      console.error('Error deleting gallery:', error);
    }
  };

  const handleStatusChange = async (id: string, status: 'draft' | 'published' | 'archived') => {
    try {
      const response = await fetch(`/api/customer-galleries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        await fetchGalleries();
      }
    } catch (error) {
      console.error('Error updating status:', error);
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Galleries</h1>
            <p className="text-gray-600 mt-2">Manage private photo galleries for your customers</p>
          </div>
          <button
            onClick={() => router.push('/admin/customer-galleries')}
            className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            New Gallery
          </button>
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
                
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    gallery.status === 'published' 
                      ? 'bg-green-100 text-green-800'
                      : gallery.status === 'archived'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {gallery.status}
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

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
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
                    className="text-xs border border-gray-300 rounded px-2 py-1"
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
          <div className="text-center py-12">
            <FiFolder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No galleries yet</h3>
            <p className="text-gray-600 mb-4">Create your first customer gallery to get started</p>
            <button
              onClick={() => router.push('/admin/customer-galleries')}
              className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors mx-auto"
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
