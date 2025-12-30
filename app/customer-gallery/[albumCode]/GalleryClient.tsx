'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiX, FiChevronLeft, FiChevronRight, FiGrid, FiList, FiAlertCircle, FiDownload, FiCamera, FiSearch } from 'react-icons/fi';
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
  faceRecognitionEnabled?: boolean;
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
  const [showFaceMatchesOnly, setShowFaceMatchesOnly] = useState(false);
  const [faceMatchedPhotos, setFaceMatchedPhotos] = useState<Photo[]>([]); // Store actual photo objects
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [imageLoadState, setImageLoadState] = useState<Record<string, ImageLoadState>>({});
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [showFaceSearch, setShowFaceSearch] = useState(false);
  const [isSearchingFaces, setIsSearchingFaces] = useState(false);
  const [faceSearchResults, setFaceSearchResults] = useState<any[]>([]);
  const [faceSearchSelfie, setFaceSearchSelfie] = useState<string | null>(null);
  const [searchProgress, setSearchProgress] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(1);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [hasMoreBatches, setHasMoreBatches] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const imageTimeoutsRef = useRef<Record<string, number>>({});
  const params = useParams();
  const router = useRouter();

  // Cleanup function for face search
  const stopFaceSearch = () => {
    // Close EventSource connection
    if (eventSourceRef.current) {
      console.log('Closing EventSource connection...');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    // Clear progress interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // Reset states
    setIsSearchingFaces(false);
    setSearchProgress(0);
    setFaceSearchResults([]);
    setFaceSearchSelfie(null);
    setTotalPhotos(0);
    
    console.log('Face search stopped by user');
  };

  // Monitor faceMatchedPhotos state changes
  useEffect(() => {
    console.log('faceMatchedPhotos state changed:', {
      size: faceMatchedPhotos.length,
      urls: faceMatchedPhotos.slice(0, 3).map(p => p.url),
      showFaceMatchesOnly
    });
  }, [faceMatchedPhotos, showFaceMatchesOnly]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopFaceSearch();
    };
  }, []);

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
      console.log('Loading global favorites for album:', params.albumCode);
      const response = await fetch(`/api/customer-galleries/favorites/${params.albumCode}`);
      console.log('Global favorites response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Global favorites data received:', data);
        setFavorites(new Set(data.favorites || []));
        console.log('Global favorites set to:', new Set(data.favorites || []));
      } else {
        const errorData = await response.json();
        console.error('Failed to load global favorites:', errorData);
      }
    } catch (error) {
      console.error('Error loading global favorites:', error);
    }
  };

  const toggleFavorite = async (photoIndex: number) => {
    console.log('Toggling global favorite for photo index:', photoIndex);
    const newFavorites = new Set(favorites);
    if (newFavorites.has(photoIndex)) {
      newFavorites.delete(photoIndex);
      console.log('Removing global favorite');
    } else {
      newFavorites.add(photoIndex);
      console.log('Adding global favorite');
    }
    setFavorites(newFavorites);

    try {
      console.log('Sending global favorite toggle request...');
      const response = await fetch(`/api/customer-galleries/favorites/${params.albumCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIndex }),
      });

      console.log('Toggle global favorite response status:', response.status);

      if (!response.ok) {
        // Revert on error
        setFavorites(favorites);
        console.error('Failed to update global favorite');
      } else {
        const result = await response.json();
        console.log('Toggle global favorite result:', result);
        
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
      console.error('Error updating global favorite:', error);
    }
  };

  const handleDownloadAlbum = () => {
    setShowDownloadOptions(true);
  };

  const handleFaceSearch = async (selfieFile: File) => {
    setIsSearchingFaces(true);
    setFaceSearchSelfie(URL.createObjectURL(selfieFile));
    setFaceSearchResults([]);
    setSearchProgress(0);
    
    try {
      // Close any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      // Get total photos first
      const galleryResponse = await fetch(`/api/customer-gallery/${params.albumCode}`);
      const galleryData = await galleryResponse.json();
      const totalPhotos = galleryData.photos?.length || 0;
      setTotalPhotos(totalPhotos);

      // Simulate progress based on actual processing time
      let currentProgress = 0;
      progressIntervalRef.current = setInterval(() => {
        // Slower, more realistic progress
        currentProgress += 1; // 1% increments
        if (currentProgress >= 95) {
          currentProgress = 95; // Cap at 95% until complete
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
        }
        setSearchProgress(currentProgress);
      }, 1000); // Update every second

      // Create form data for the request
      const formData = new FormData();
      formData.append('selfie', selfieFile);

      // Make the POST request
      const response = await fetch(`/api/customer-gallery/${params.albumCode}/face-search/simple`, {
        method: 'POST',
        body: formData,
      });

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setSearchProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Face search failed');
      }

      const data = await response.json();
      console.log('Face search complete:', data);

      setFaceSearchResults(data.matches || []);
      
      // Extract actual photo objects from face search results
      const apiMatches = data.matches || [];
      const matchedPhotoObjects: Photo[] = apiMatches
        .map((match: any) => gallery.photos[match.index])
        .filter(photo => photo && photo.url); // Only include valid photos
      
      console.log('Matched photo objects count:', matchedPhotoObjects.length);
      console.log('Matched photo objects preview:', matchedPhotoObjects.slice(0, 3).map(p => p.url));
      
      setFaceMatchedPhotos(matchedPhotoObjects);
      setShowFaceMatchesOnly(true);
      
      console.log('=== Face search completed ===');
      console.log('setFaceMatchedPhotos called with', matchedPhotoObjects.length, 'photos');
      console.log('setShowFaceMatchesOnly called with: true');
      
      setIsSearchingFaces(false);

    } catch (error) {
      console.error('Face search error:', error);
      alert(`Face search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsSearchingFaces(false);
    }
  };

  const handleDownloadChoice = async (downloadType: 'full' | 'favorites' | 'face-matches') => {
    setShowDownloadOptions(false);
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadStatus('Starting download...');
    
    try {
      // Build download URL based on type
      let url;
      if (downloadType === 'favorites') {
        url = `/api/customer-gallery/${params.albumCode}/download-progress?type=favorites&favorites=${Array.from(favorites).join(',')}&progress=true`;
      } else if (downloadType === 'face-matches') {
        // Get the original indices for face-matched photos
        const faceMatchIndices = faceMatchedPhotos.map(photo => {
          const index = gallery.photos.findIndex(p => p.url === photo.url);
          return index >= 0 ? index : 0;
        });
        url = `/api/customer-gallery/${params.albumCode}/download-progress?type=face-matches&faces=${faceMatchIndices.join(',')}&progress=true`;
      } else {
        url = `/api/customer-gallery/${params.albumCode}/download-progress?type=full&progress=true`;
      }
      
      // Use EventSource for progress updates
      const eventSource = new EventSource(url);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setDownloadProgress(data.progress);
          setDownloadStatus(data.status);
          
          // When download is ready, trigger the actual download
          if (data.progress === 100 && data.downloadUrl) {
            eventSource.close();
            
            // Create a temporary link to download the file
            const link = document.createElement('a');
            link.href = data.downloadUrl;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Reset download state after a short delay
            setTimeout(() => {
              setIsDownloading(false);
              setDownloadProgress(0);
              setDownloadStatus('');
            }, 2000);
          }
        } catch (error) {
          console.error('Error parsing progress data:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('Download progress error:', error);
        eventSource.close();
        // Reset after a short delay
        setTimeout(() => {
          setIsDownloading(false);
          setDownloadProgress(0);
          setDownloadStatus('');
        }, 2000);
      };
      
    } catch (error) {
      console.error('Download error:', error);
      setIsDownloading(false);
      setDownloadStatus('Download failed');
      setDownloadProgress(0);
    }
  }

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

  // Filter photos based on favorites and face matches
  const getFilteredPhotos = () => {
    console.log('=== getFilteredPhotos called ===');
    console.log('showFavoritesOnly:', showFavoritesOnly);
    console.log('showFaceMatchesOnly:', showFaceMatchesOnly);
    console.log('faceMatchedPhotos.length:', faceMatchedPhotos.length);
    console.log('gallery.photos.length:', gallery.photos.length);
    
    if (showFavoritesOnly) {
      const sortedFavorites = Array.from(favorites).sort((a, b) => a - b);
      console.log('Favorites filter - sorted indices:', sortedFavorites);
      const result = sortedFavorites.map(index => gallery.photos[index]);
      console.log('Favorites filter - result length:', result.length);
      return result;
    }
    if (showFaceMatchesOnly) {
      console.log('Face matches filter - using stored photo objects');
      console.log('Face matched photos count:', faceMatchedPhotos.length);
      return faceMatchedPhotos; // Return the actual photo objects directly
    }
    console.log('No filter - returning all photos');
    return gallery.photos;
  };

  const filteredPhotos = getFilteredPhotos();

  // Monitor filteredPhotos changes
  useEffect(() => {
    console.log('filteredPhotos changed:', {
      count: filteredPhotos.length,
      showFavoritesOnly,
      showFaceMatchesOnly,
      favoritesSize: favorites.size,
      faceMatchedPhotosSize: faceMatchedPhotos.length
    });
  }, [filteredPhotos, showFavoritesOnly, showFaceMatchesOnly, favorites.size, faceMatchedPhotos.length]);

  // Get original indices for filtered photos
  const getOriginalIndex = (filteredIndex: number) => {
    if (showFavoritesOnly) {
      return Array.from(favorites).sort((a, b) => a - b)[filteredIndex];
    }
    if (showFaceMatchesOnly) {
      // Find the index in the original gallery for this face-matched photo
      const faceMatchedPhoto = faceMatchedPhotos[filteredIndex];
      if (!faceMatchedPhoto) return 0;
      
      // Find this photo in the original gallery array
      const originalIndex = gallery.photos.findIndex(photo => 
        photo.url === faceMatchedPhoto.url
      );
      return originalIndex >= 0 ? originalIndex : 0;
    }
    return filteredIndex;
  };

  // Get current filtered index from original index
  const getFilteredIndex = (originalIndex: number) => {
    if (showFavoritesOnly) {
      const sortedFavorites = Array.from(favorites).sort((a, b) => a - b);
      return sortedFavorites.indexOf(originalIndex);
    }
    if (showFaceMatchesOnly) {
      // Find this photo in the face-matched array
      const originalPhoto = gallery.photos[originalIndex];
      if (!originalPhoto) return 0;
      
      const filteredIndex = faceMatchedPhotos.findIndex(photo => 
        photo.url === originalPhoto.url
      );
      return filteredIndex >= 0 ? filteredIndex : 0;
    }
    return originalIndex;
  };

  // Debug logging
  console.log('Filter state:', { showFavoritesOnly, showFaceMatchesOnly });
  console.log('Favorites count:', favorites.size);
  console.log('Face matches count:', faceMatchedPhotos.length);
  console.log('Filtered photos count:', filteredPhotos.length);
  console.log('Face matched photos URLs:', faceMatchedPhotos.slice(0, 5).map(p => p.url));
  console.log('Total photos in gallery:', gallery.photos.length);
  console.log('Face search results count:', faceSearchResults.length);

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
                    <p className="font-medium text-gray-900">Global Favorites</p>
                    <p className="text-sm text-gray-500">
                      {favorites.size === 0 ? 'No global favorites' : `${favorites.size} global favorites`}
                    </p>
                  </div>
                </div>
                <span className={favorites.size === 0 ? 'text-gray-400' : 'text-blue-500'}>→</span>
              </button>
              
              {/* Face Matches Download Option */}
              {faceMatchedPhotos.length > 0 && (
                <button
                  onClick={() => handleDownloadChoice('face-matches')}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <FiCamera className="w-5 h-5 text-purple-500 mr-3" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Face Matches Only</p>
                      <p className="text-sm text-gray-500">{faceMatchedPhotos.length} matched photos</p>
                    </div>
                  </div>
                  <span className="text-purple-500">→</span>
                </button>
              )}
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

      {/* Face Search Modal */}
      {showFaceSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Find Your Photos</h3>
              <button
                onClick={() => {
                  stopFaceSearch();
                  setShowFaceSearch(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            {!faceSearchSelfie ? (
              <div className="text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                    <FiSearch className="w-8 h-8 text-purple-500" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Your Selfie</h4>
                  <p className="text-gray-600 mb-4">
                    Take a clear photo of your face and we'll find all photos with you in the gallery!
                  </p>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <input
                    type="file"
                    id="selfie-upload"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFaceSearch(file);
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="selfie-upload"
                    className="cursor-pointer inline-flex items-center px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    <FiSearch className="w-4 h-4 mr-2" />
                    Choose Selfie Photo
                  </label>
                  <p className="text-sm text-gray-500 mt-3">
                    JPG, PNG or GIF (max 10MB)
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <img
                      src={faceSearchSelfie}
                      alt="Your selfie"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-purple-200"
                    />
                  </div>
                  
                  {isSearchingFaces ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto mb-3"></div>
                      <p className="text-gray-600">Analyzing faces in gallery...</p>
                      
                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Analyzing photos...</span>
                          <span>{searchProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-200 ease-out"
                            style={{ width: `${searchProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {totalPhotos > 0 
                            ? `Processed ${Math.floor(totalPhotos * searchProgress / 100)} of ${totalPhotos} photos`
                            : 'Initializing...'
                          }
                        </p>
                        {searchProgress > 0 && searchProgress < 100 && (
                          <p className="text-xs text-purple-600 mt-1 font-medium">
                            {searchProgress < 25 ? 'Initializing face detection...' :
                             searchProgress < 50 ? 'Finding matching faces...' :
                             searchProgress < 75 ? 'Analyzing facial features...' :
                             'Almost done!'}
                          </p>
                        )}
                      </div>
                      
                      {/* Real-time Results Display */}
                      {faceSearchResults.length > 0 && (
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-900">
                              Found {faceSearchResults.length} photo{faceSearchResults.length !== 1 ? 's' : ''}!
                            </h4>
                            {isSearchingFaces && (
                              <span className="text-xs text-purple-600 animate-pulse">
                                Searching...
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                            {faceSearchResults.map((result, index) => (
                              <div 
                                key={result.index} 
                                className={`relative group cursor-pointer transform transition-all duration-300 ${
                                  result.isNew 
                                    ? 'scale-110 animate-pulse ring-2 ring-green-400 ring-opacity-50' 
                                    : 'scale-100 hover:scale-105'
                                }`}
                                onClick={() => setSelectedPhotoIndex(result.index)}
                              >
                                <img
                                  src={processImageUrl(result.url)}
                                  alt={result.alt}
                                  className="w-full h-20 object-cover rounded-lg shadow-sm"
                                />
                                {result.confidence && (
                                  <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 rounded shadow">
                                    {Math.round(result.confidence * 100)}%
                                  </div>
                                )}
                                {result.isNew && (
                                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
                                    ✓
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <FiSearch className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-lg font-medium text-gray-900">
                        Complete! Found {faceSearchResults.length} photos with your face!
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Searched {totalPhotos} photos in the gallery
                      </p>
                      {faceSearchResults.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          Click any photo to view full size
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                {faceSearchResults.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Your Photos:</h4>
                    <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                      {faceSearchResults.map((result, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={processImageUrl(result.url)}
                            alt={result.alt}
                            className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setSelectedPhotoIndex(result.index)}
                          />
                          {result.confidence && (
                            <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 rounded">
                              {Math.round(result.confidence * 100)}%
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={() => setSelectedPhotoIndex(faceSearchResults[0]?.index)}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        View First Photo
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 text-center">
                  <button
                    onClick={() => {
                      setFaceSearchSelfie(null);
                      setFaceSearchResults([]);
                    }}
                    className="text-purple-500 hover:text-purple-600 text-sm"
                  >
                    Try with a different photo
                  </button>
                </div>
              </div>
            )}
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
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-1 md:mb-2">{gallery.title || gallery.customerName}</h1>
              <p className="text-sm md:text-xl text-gray-600 mb-1">{gallery.customerName}</p>
              <p className="text-xs md:text-lg text-gray-500">
                {gallery.eventType} • {new Date(gallery.eventDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
              {gallery.faceRecognitionEnabled !== false && (
                <button
                  onClick={() => setShowFaceSearch(true)}
                  className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors text-sm font-medium"
                >
                  <FiSearch className="w-4 h-4" />
                  <span>Find My Photos</span>
                </button>
              )}
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                  showFavoritesOnly
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FiHeart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                <span>{showFavoritesOnly ? 'All Photos' : 'Global Favorites'}</span>
              </button>
              
              {/* Face Filter Button */}
              {faceMatchedPhotos.length > 0 && (
                <button
                  onClick={() => {
                    setShowFaceMatchesOnly(!showFaceMatchesOnly);
                    if (showFaceMatchesOnly) {
                      setShowFavoritesOnly(false);
                    }
                  }}
                  className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                    showFaceMatchesOnly
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <FiCamera className={`w-4 h-4 ${showFaceMatchesOnly ? 'fill-current' : ''}`} />
                  <span>{showFaceMatchesOnly ? 'All' : `Faces (${faceMatchedPhotos.length})`}</span>
                </button>
              )}
              
              {/* Desktop-only buttons */}
              <div className="hidden md:flex items-center gap-3">
                <button
                  onClick={handleDownloadAlbum}
                  disabled={isDownloading}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    isDownloading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  <FiDownload className={`w-4 h-4 ${isDownloading ? 'animate-spin' : ''}`} />
                  <span>{isDownloading ? 'Preparing...' : 'Download'}</span>
                </button>
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {viewMode === 'grid' ? <FiList className="w-5 h-5" /> : <FiGrid className="w-5 h-5" />}
                </button>
              </div>
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
                  <h2 className="text-2xl font-serif text-white mb-2">Welcome to Your Gallery</h2>
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
                {filteredPhotos
                  .map((photo, filteredIndex) => {
                    const originalIndex = getOriginalIndex(filteredIndex);
                    return { photo, originalIndex };
                  })
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
            {filteredPhotos
              .map((photo, filteredIndex) => {
                const originalIndex = getOriginalIndex(filteredIndex);
                return { photo, originalIndex };
              })
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

                {filteredPhotos.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const currentFilteredIndex = getFilteredIndex(selectedPhotoIndex);
                        const prevFilteredIndex = Math.max(0, currentFilteredIndex - 1);
                        setSelectedPhotoIndex(getOriginalIndex(prevFilteredIndex));
                      }}
                      className="absolute left-4 text-white hover:text-gray-300 transition-colors z-10"
                      disabled={getFilteredIndex(selectedPhotoIndex) === 0}
                    >
                      <FiChevronLeft className="w-8 h-8" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const currentFilteredIndex = getFilteredIndex(selectedPhotoIndex);
                        const nextFilteredIndex = Math.min(filteredPhotos.length - 1, currentFilteredIndex + 1);
                        setSelectedPhotoIndex(getOriginalIndex(nextFilteredIndex));
                      }}
                      className="absolute right-4 text-white hover:text-gray-300 transition-colors z-10"
                      disabled={getFilteredIndex(selectedPhotoIndex) === filteredPhotos.length - 1}
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
