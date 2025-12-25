'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiX, FiChevronLeft, FiChevronRight, FiGrid, FiList } from 'react-icons/fi';
import Masonry from 'react-masonry-css';

interface Photo {
  url: string;
  alt: string;
  driveFileId: string;
  order: number;
}

interface Gallery {
  _id: string;
  albumCode: string;
  title: string;
  customerName: string;
  customerEmail: string;
  eventDate: string;
  eventType: string;
  coverPhotoUrl: string;
  photos: Photo[];
  driveFolderId: string;
  driveFolderUrl: string;
  status: string;
  deliveryDate: string;
  notes: string;
}

export default function CustomerGalleryPage() {
  const params = useParams();
  const router = useRouter();
  const albumCode = params.albumCode as string;

  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Masonry breakpoints - same as albums section
  const breakpointColumnsObj = {
    default: 3,
    1100: 3,
    700: 2,
    500: 1
  };

  // Process Google Drive URLs like albums section
  const processImageUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;

    try {
      if (url.includes('drive.google.com') || url.includes('googleusercontent.com')) {
        let fileId = '';
        
        if (url.includes('/file/d/')) {
          fileId = url.split('/file/d/')[1]?.split('/')[0];
        } else if (url.includes('id=')) {
          fileId = new URL(url).searchParams.get('id') || '';
        } else {
          const match = url.match(/[\w-]{25,}/);
          if (match) fileId = match[0];
        }
        
        if (fileId) {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
          return `${baseUrl}/api/drive/image?id=${fileId}`;
        }
      }
    } catch (error) {
      console.error('Error processing image URL:', error);
    }
    
    return url;
  };

  useEffect(() => {
    if (albumCode) {
      fetchGallery();
    }
  }, [albumCode]);

  const fetchGallery = async () => {
    try {
      const response = await fetch(`/api/customer-galleries/public/${albumCode}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('Gallery data:', data);
        setGallery(data);
        // Load favorites for this album
        await loadFavorites();
      } else {
        setError('Gallery not found or access denied');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const response = await fetch(`/api/customer-galleries/favorites/${albumCode}`);
      if (response.ok) {
        const favData = await response.json();
        setFavorites(new Set(favData.favorites || []));
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  };

  const toggleFavorite = async (photoIndex: number) => {
    const newFavorites = new Set(favorites);
    
    if (newFavorites.has(photoIndex)) {
      newFavorites.delete(photoIndex);
      // Remove favorite from backend
      await fetch('/api/customer-galleries/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumCode, photoIndex })
      });
    } else {
      newFavorites.add(photoIndex);
      // Add favorite to backend
      await fetch('/api/customer-galleries/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumCode, photoIndex })
      });
    }
    
    setFavorites(newFavorites);
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (!gallery || selectedPhotoIndex === null) return;
    
    if (direction === 'prev') {
      setSelectedPhotoIndex(selectedPhotoIndex > 0 ? selectedPhotoIndex - 1 : gallery.photos.length - 1);
    } else {
      setSelectedPhotoIndex(selectedPhotoIndex < gallery.photos.length - 1 ? selectedPhotoIndex + 1 : 0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Gallery Not Found</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{gallery.title || gallery.customerName}</h1>
              <p className="text-xl text-gray-600 mb-1">{gallery.customerName}</p>
              <p className="text-lg text-gray-500">
                {gallery.eventType} • {new Date(gallery.eventDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {viewMode === 'grid' ? <FiList className="w-5 h-5" /> : <FiGrid className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  showFavoritesOnly 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FiHeart className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {showFavoritesOnly ? 'All Photos' : 'Show Favorites'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Gallery Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Gallery Introduction */}
        {gallery.notes && (
          <div className="relative rounded-xl overflow-hidden mb-8 shadow-lg">
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat filter blur-sm"
              style={{ backgroundImage: `url(${processImageUrl(gallery.coverPhotoUrl)})` }}
            />
            
            {/* Dark Overlay for Text Readability */}
            <div className="absolute inset-0 bg-black bg-opacity-60" />
            
            {/* Content */}
            <div className="relative z-10 p-8">
              <div className="max-w-4xl mx-auto text-white">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-full mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <h2 className="text-2xl font-serif text-white mb-2">Welcome to Your Gallery</h2>
                  <p className="text-sm text-gray-200 font-medium uppercase tracking-wide">An Introduction</p>
                </div>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-100 leading-relaxed font-serif text-lg text-center whitespace-pre-line">
                    {gallery.notes}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Photos Grid/List */}
        {viewMode === 'grid' ? (
          <div className="w-full">
            {showFavoritesOnly && favorites.size === 0 ? (
              <div className="text-center py-12">
                <FiHeart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No favorites yet</h3>
                <p className="text-gray-500">Click the heart icon on photos to add them to your favorites</p>
              </div>
            ) : (
              <Masonry
                breakpointCols={breakpointColumnsObj}
                className="flex -ml-4 w-auto"
                columnClassName="pl-4 bg-clip-padding"
              >
                {gallery.photos
                  .map((photo, originalIndex) => ({ photo, originalIndex }))
                  .filter(({ originalIndex }) => !showFavoritesOnly || favorites.has(originalIndex))
                  .map(({ photo, originalIndex }) => (
                  <div key={photo.driveFileId} className="mb-4">
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="relative group cursor-pointer"
                      onClick={() => setSelectedPhotoIndex(originalIndex)}
                    >
                      <div className="relative overflow-hidden rounded-lg">
                        <img
                          src={processImageUrl(photo.url)}
                          alt={photo.alt || `Photo ${originalIndex + 1}`}
                          className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(originalIndex);
                        }}
                        className={`absolute bottom-2 right-2 p-2 rounded-full transition-colors ${
                          favorites.has(originalIndex)
                            ? 'bg-red-500 text-white'
                            : 'bg-white/80 text-gray-700 hover:bg-white'
                        }`}
                      >
                        <FiHeart className={`w-4 h-4 ${favorites.has(originalIndex) ? 'fill-current' : ''}`} />
                      </button>
                    </motion.div>
                  </div>
                ))}
              </Masonry>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {gallery.photos
              .map((photo, originalIndex) => ({ photo, originalIndex }))
              .filter(({ originalIndex }) => !showFavoritesOnly || favorites.has(originalIndex))
              .map(({ photo, originalIndex }) => (
              <motion.div
                key={photo.driveFileId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedPhotoIndex(originalIndex)}
              >
                <div className="w-24 h-24 relative overflow-hidden rounded-lg">
                  <img
                    src={processImageUrl(photo.url)}
                    alt={photo.alt || `Photo ${originalIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Photo {originalIndex + 1}</p>
                  <p className="text-sm text-gray-500">{photo.alt || 'No description'}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(originalIndex);
                  }}
                  className={`p-2 rounded-full transition-colors ${
                    favorites.has(originalIndex)
                      ? 'bg-red-500 text-white'
                      : 'bg-white/80 text-gray-700 hover:bg-white'
                  }`}
                >
                  <FiHeart className={`w-4 h-4 ${favorites.has(originalIndex) ? 'fill-current' : ''}`} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Photo Modal */}
      <AnimatePresence>
        {selectedPhotoIndex !== null && gallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
            onClick={() => setSelectedPhotoIndex(null)}
          >
            <div className="relative max-w-6xl max-h-screen p-4">
              <img
                src={processImageUrl(gallery.photos[selectedPhotoIndex].url)}
                alt={gallery.photos[selectedPhotoIndex].alt || `Photo ${selectedPhotoIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
              
              {/* Navigation */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigatePhoto('prev');
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all"
              >
                <FiChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigatePhoto('next');
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all"
              >
                <FiChevronRight className="w-6 h-6" />
              </button>
              
              {/* Close */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPhotoIndex(null);
                }}
                className="absolute top-4 right-4 p-3 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all"
              >
                <FiX className="w-6 h-6" />
              </button>
              
              {/* Favorite button in modal */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(selectedPhotoIndex);
                }}
                className={`absolute bottom-4 right-4 p-3 rounded-full transition-colors ${
                  favorites.has(selectedPhotoIndex)
                    ? 'bg-red-500 text-white'
                    : 'bg-white bg-opacity-80 text-gray-700 hover:bg-opacity-100'
                }`}
              >
                <FiHeart className={`w-6 h-6 ${favorites.has(selectedPhotoIndex) ? 'fill-current' : ''}`} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
