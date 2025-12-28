'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiX, FiChevronLeft, FiChevronRight, FiGrid, FiList, FiAlertCircle, FiDownload } from 'react-icons/fi';
import Masonry from 'react-masonry-css';
import Image from 'next/image';

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

interface GalleryClientProps {
  gallery: Gallery;
}

const MAX_RETRIES = 3;

interface ImageLoadState {
  error: boolean;
  retryCount: number;
  loading: boolean;
}

export default function GalleryClient({ gallery: initialGallery }: GalleryClientProps) {
  const [gallery, setGallery] = useState<Gallery>(initialGallery);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [imageLoadState, setImageLoadState] = useState<Record<string, ImageLoadState>>({});
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const imageTimeoutsRef = useRef<Record<string, number>>({});
  const params = useParams();
  const router = useRouter();

  // Process Google Drive URLs for proper display
  const processImageUrl = useCallback((url: string, isRetry = false): string => {
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
          // For retries, try different URL formats
          if (isRetry) {
            const formats = [
              `https://drive.google.com/uc?export=view&id=${fileId}`,
              `https://drive.google.com/uc?export=download&id=${fileId}`,
              `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
              `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/drive/image?id=${fileId}`
            ];
            return formats[Math.floor(Math.random() * formats.length)];
          }
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
          return `${baseUrl}/api/drive/image?id=${fileId}`;
        }
      }
    } catch (e) {
      console.error("Error processing image URL:", url, e);
    }
    
    return url; // Return original URL if not a Google Drive link or ID not found
  }, []);

  const handleImageLoad = useCallback((url: string) => {
    // Clear any existing timeout for this image
    const timeoutId = imageTimeoutsRef.current[url];
    if (timeoutId) {
      clearTimeout(timeoutId);
      delete imageTimeoutsRef.current[url];
    }
    
    setLoadedImages(prev => ({
      ...prev,
      [url]: true
    }));

    setImageLoadState((prev: Record<string, ImageLoadState>) => ({
      ...prev,
      [url]: { 
        ...(prev[url] || { error: false, retryCount: 0, loading: false }),
        error: false,
        loading: false
      }
    }));
  }, []);

  const handleImageError = useCallback((event: React.SyntheticEvent<HTMLImageElement, Event>, url: string, index: number) => {
    console.error(`Error loading image ${index}:`, { url, event });
    
    const currentState = imageLoadState[url] || { error: false, retryCount: 0, loading: false };
    const currentRetryCount = currentState.retryCount;
    
    if (currentRetryCount >= MAX_RETRIES) {
      setImageLoadState((prev: Record<string, ImageLoadState>) => ({
        ...prev,
        [url]: {
          ...(prev[url] || { error: false, retryCount: 0, loading: false }),
          error: true,
          retryCount: currentRetryCount,
          loading: false
        }
      }));
      return;
    }
    
    const retryCount = currentRetryCount + 1;
    
    // Force re-render with processed URL
    const img = document.querySelector(`img[data-photo-index="${index}"]`) as HTMLImageElement;
    if (img) {
      img.src = processImageUrl(url, true);
    }
    
    setImageLoadState((prev: Record<string, ImageLoadState>) => ({
      ...prev,
      [url]: { 
        ...(prev[url] || { error: false, retryCount: 0, loading: false }),
        error: true,
        retryCount,
        loading: false
      }
    }));
  }, [imageLoadState, processImageUrl]);

  // Load favorites on component mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const response = await fetch(`/api/customer-galleries/favorites/${params.albumCode}`);
      if (response.ok) {
        const data = await response.json();
        setFavorites(new Set(data.favorites || []));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (photoIndex: number) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(photoIndex)) {
      newFavorites.delete(photoIndex);
    } else {
      newFavorites.add(photoIndex);
    }
    setFavorites(newFavorites);

    try {
      const response = await fetch(`/api/customer-galleries/favorites/${params.albumCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIndex }),
      });

      if (!response.ok) {
        // Revert on error
        setFavorites(favorites);
        console.error('Failed to update favorite');
      } else {
        const result = await response.json();
        console.log('Favorite toggle result:', result);
        
        // Update local state based on server response
        if (result.action === 'added') {
          setFavorites(prev => new Set(prev).add(photoIndex));
        } else if (result.action === 'removed') {
          setFavorites(prev => {
            const updated = new Set(prev);
            updated.delete(photoIndex);
            return updated;
          });
        }
      }
    } catch (error) {
      // Revert on error
      setFavorites(favorites);
      console.error('Error updating favorite:', error);
    }
  };

  const handleDownloadAlbum = () => {
    setShowDownloadOptions(true);
  };

  const handleDownloadChoice = async (downloadType: 'full' | 'favorites') => {
    setShowDownloadOptions(false);
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadStatus('Starting download...');
    
    try {
      // For favorites, pass the favorite indices to the server
      const url = downloadType === 'favorites' 
        ? `/api/customer-gallery/${params.albumCode}/download?type=favorites&favorites=${Array.from(favorites).join(',')}`
        : `/api/customer-gallery/${params.albumCode}/download?type=full`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }
      
      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const suffix = downloadType === 'favorites' ? '_Favorites' : '';
      const filename = filenameMatch?.[1] || `${gallery.customerName}_${gallery.eventType}${suffix}_Photos.tar.gz`;
      
      setDownloadStatus('Downloading archive...');
      setDownloadProgress(90);
      
      // Create blob and download
      const blob = await response.blob();
      const url2 = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url2;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url2);
      document.body.removeChild(a);
      
      setDownloadProgress(100);
      setDownloadStatus('Download complete!');
      
      // Reset after a short delay
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
        setDownloadStatus('');
      }, 2000);
      
    } catch (error) {
      console.error('Download error:', error);
      setDownloadStatus('Download failed');
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
        setDownloadStatus('');
      }, 3000);
    }
  };

  if (!gallery) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Gallery Not Found</h1>
          <p className="text-gray-600 mb-8">The gallery you're looking for doesn't exist or isn't available.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Filter photos based on favorites
  const filteredPhotos = showFavoritesOnly 
    ? gallery.photos.filter((_, index) => favorites.has(index))
    : gallery.photos;

  // Masonry breakpoints - same as albums section
  const breakpointColumnsObj = {
    default: 3,
    1100: 3,
    700: 2,
    500: 1
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Download Options Modal */}
      {showDownloadOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Options</h3>
            <p className="text-gray-600 mb-6">What would you like to download?</p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleDownloadChoice('full')}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <FiDownload className="w-5 h-5 text-blue-500 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Full Album</p>
                    <p className="text-sm text-gray-500">All {gallery.photos.length} photos</p>
                  </div>
                </div>
                <span className="text-blue-500">→</span>
              </button>
              
              <button
                onClick={() => handleDownloadChoice('favorites')}
                disabled={favorites.size === 0}
                className={`w-full flex items-center justify-between p-4 border rounded-lg transition-colors ${
                  favorites.size === 0 
                    ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <FiHeart className={`w-5 h-5 mr-3 ${
                    favorites.size === 0 ? 'text-gray-400' : 'text-red-500'
                  }`} />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Favorites Only</p>
                    <p className="text-sm text-gray-500">
                      {favorites.size === 0 ? 'No favorites selected' : `${favorites.size} favorite photos`}
                    </p>
                  </div>
                </div>
                <span className={favorites.size === 0 ? 'text-gray-400' : 'text-blue-500'}>→</span>
              </button>
            </div>
            
            <button
              onClick={() => setShowDownloadOptions(false)}
              className="w-full mt-4 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Download Progress Modal */}
      {isDownloading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-3"></div>
              <h3 className="text-lg font-semibold text-gray-900">Downloading Album</h3>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{downloadStatus}</span>
                <span>{downloadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 text-center">
              {downloadProgress < 30 && 'Downloading images from gallery...'}
              {downloadProgress >= 30 && downloadProgress < 70 && 'Creating compressed archive...'}
              {downloadProgress >= 70 && downloadProgress < 90 && 'Finalizing download...'}
              {downloadProgress >= 90 && 'Almost done!'}
            </p>
          </div>
        </div>
      )}

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
                onClick={handleDownloadAlbum}
                disabled={isDownloading}
                className={`hidden md:flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isDownloading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                <FiDownload className={`w-4 h-4 ${isDownloading ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">
                  {isDownloading ? 'Preparing...' : 'Download Album'}
                </span>
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {viewMode === 'grid' ? <FiList className="w-5 h-5" /> : <FiGrid className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  showFavoritesOnly
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FiHeart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
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
                        {(() => {
                          const imageUrl = processImageUrl(photo.url);
                          const isLoaded = !!loadedImages[imageUrl];
                          const hasError = imageLoadState[imageUrl]?.error || false;
                          
                          return (
                            <>
                              {!isLoaded && !hasError && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="animate-pulse w-full h-full bg-gray-200"></div>
                                </div>
                              )}
                              {hasError ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                  <div className="text-center p-4">
                                    <FiAlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">Couldn't load image</p>
                                  </div>
                                </div>
                              ) : (
                                <Image
                                  key={`${photo.driveFileId}-${imageLoadState[imageUrl]?.retryCount || 0}`}
                                  src={imageUrl}
                                  alt={photo.alt || `Photo ${originalIndex + 1}`}
                                  data-photo-index={originalIndex}
                                  width={400}
                                  height={400}
                                  className={`w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                                  onLoad={() => handleImageLoad(imageUrl)}
                                  onError={(e) => handleImageError(e, imageUrl, originalIndex)}
                                  loading="lazy"
                                  unoptimized={imageUrl.includes('google.com')}
                                />
                              )}
                            </>
                          );
                        })()}
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
          <div className="space-y-6">
            {gallery.photos
              .map((photo, originalIndex) => ({ photo, originalIndex }))
              .filter(({ originalIndex }) => !showFavoritesOnly || favorites.has(originalIndex))
              .map(({ photo, originalIndex }) => (
              <div key={photo.driveFileId} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3">
                    {(() => {
                      const imageUrl = processImageUrl(photo.url);
                      const isLoaded = !!loadedImages[imageUrl];
                      const hasError = imageLoadState[imageUrl]?.error || false;
                      
                      return (
                        <div className="relative w-full h-48 md:h-full">
                          {!isLoaded && !hasError && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="animate-pulse w-full h-full bg-gray-200"></div>
                            </div>
                          )}
                          {hasError ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                              <div className="text-center p-4">
                                <FiAlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-500">Couldn't load image</p>
                              </div>
                            </div>
                          ) : (
                            <Image
                              key={`${photo.driveFileId}-${imageLoadState[imageUrl]?.retryCount || 0}`}
                              src={imageUrl}
                              alt={photo.alt || `Photo ${originalIndex + 1}`}
                              data-photo-index={originalIndex}
                              width={400}
                              height={300}
                              className={`w-full h-48 md:h-full object-cover ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                              onLoad={() => handleImageLoad(imageUrl)}
                              onError={(e) => handleImageError(e, imageUrl, originalIndex)}
                              loading="lazy"
                              unoptimized={imageUrl.includes('google.com')}
                            />
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="md:w-2/3 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {photo.alt || `Photo ${originalIndex + 1}`}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Beautiful moment captured during {gallery.eventType.toLowerCase()}.
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Photo {originalIndex + 1} of {gallery.photos.length}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedPhotoIndex(originalIndex)}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                          View Full Size
                        </button>
                        <button
                          onClick={() => toggleFavorite(originalIndex)}
                          className={`p-2 rounded-full transition-colors ${
                            favorites.has(originalIndex)
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <FiHeart className={`w-4 h-4 ${favorites.has(originalIndex) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lightbox */}
        <AnimatePresence>
          {selectedPhotoIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedPhotoIndex(null)}
            >
              <div className="absolute top-4 right-4 z-50">
                <button
                  onClick={() => setSelectedPhotoIndex(null)}
                  className="p-2 text-white hover:bg-white/10 rounded-full"
                  aria-label="Close viewer"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="relative w-full h-full flex items-center justify-center">
                <motion.div
                  className="relative max-w-full max-h-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Image
                    src={processImageUrl(gallery.photos[selectedPhotoIndex].url)}
                    alt={gallery.photos[selectedPhotoIndex].alt || `Photo ${selectedPhotoIndex + 1}`}
                    width={1200}
                    height={800}
                    className="max-w-[90vw] max-h-[90vh] object-contain"
                    priority
                    unoptimized={processImageUrl(gallery.photos[selectedPhotoIndex].url).includes('google.com')}
                  />
                </motion.div>

                {gallery.photos.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPhotoIndex(Math.max(0, selectedPhotoIndex - 1));
                      }}
                      className="absolute left-4 text-white hover:text-gray-300 transition-colors z-10"
                      disabled={selectedPhotoIndex === 0}
                    >
                      <FiChevronLeft className="w-8 h-8" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPhotoIndex(Math.min(gallery.photos.length - 1, selectedPhotoIndex + 1));
                      }}
                      className="absolute right-4 text-white hover:text-gray-300 transition-colors z-10"
                      disabled={selectedPhotoIndex === gallery.photos.length - 1}
                    >
                      <FiChevronRight className="w-8 h-8" />
                    </button>
                  </>
                )}
              </div>
              
              <div className="absolute bottom-4 left-0 right-0 text-center text-white">
                <p className="text-lg">
                  {gallery.photos[selectedPhotoIndex].alt || `Photo ${selectedPhotoIndex + 1}`}
                </p>
                <p className="text-sm text-gray-300">
                  {selectedPhotoIndex + 1} of {gallery.photos.length}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
