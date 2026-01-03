'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiChevronLeft, FiChevronRight, FiAlertCircle, FiSearch } from 'react-icons/fi';
import Image from 'next/image';

interface Photo {
  url: string;
  alt: string;
  driveFileId: string;
  order: number;
}

interface BusinessGallery {
  _id: string;
  albumCode: string;
  title: string;
  businessName: string;
  businessEmail: string;
  eventDate: string;
  eventType: string;
  coverPhotoUrl: string;
  photos: Photo[];
  driveFolderId: string;
  driveFolderUrl: string;
  status: string;
  deliveryDate: string;
  notes: string;
  backgroundColor: string;
  backgroundImageUrl: string;
  backgroundImageId: string;
  faceRecognitionEnabled?: boolean;
}

interface BusinessGalleryClientProps {
  gallery: BusinessGallery;
}

const MAX_RETRIES = 3;

interface ImageLoadState {
  error: boolean;
  retryCount: number;
  loading: boolean;
}

export default function BusinessGalleryClient({ gallery: initialGallery }: BusinessGalleryClientProps) {
  const [gallery] = useState<BusinessGallery>(initialGallery);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [imageLoadStates, setImageLoadStates] = useState<Record<string, ImageLoadState>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showFaceSearch, setShowFaceSearch] = useState(false);
  const [isSearchingFaces, setIsSearchingFaces] = useState(false);
  const [faceSearchResults, setFaceSearchResults] = useState<any[]>([]);
  const [faceSearchSelfie, setFaceSearchSelfie] = useState<string | null>(null);
  const [searchProgress, setSearchProgress] = useState(0);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [showFaceMatchesOnly, setShowFaceMatchesOnly] = useState(false);
  const [faceMatchedPhotos, setFaceMatchedPhotos] = useState<Photo[]>([]); // Store actual photo objects
  const eventSourceRef = useRef<EventSource | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const params = useParams();
  
  const PHOTOS_PER_PAGE = 50;

  // Initialize image load states
  useEffect(() => {
    const states: Record<string, ImageLoadState> = {};
    gallery.photos.forEach((photo) => {
      states[photo.driveFileId] = { error: false, retryCount: 0, loading: true };
    });
    setImageLoadStates(states);
  }, [gallery.photos]);

  const handleImageError = useCallback((driveFileId: string) => {
    setImageLoadStates(prev => {
      const currentState = prev[driveFileId];
      if (currentState.retryCount < MAX_RETRIES) {
        return {
          ...prev,
          [driveFileId]: {
            ...currentState,
            error: true,
            retryCount: currentState.retryCount + 1,
            loading: true
          }
        };
      } else {
        return {
          ...prev,
          [driveFileId]: {
            ...currentState,
            error: true,
            loading: false
          }
        };
      }
    });
  }, []);

  const handleImageLoad = useCallback((driveFileId: string) => {
    setImageLoadStates(prev => ({
      ...prev,
      [driveFileId]: {
        ...prev[driveFileId],
        error: false,
        loading: false
      }
    }));
  }, []);

  const openLightbox = (filteredIndex: number) => {
    // Convert filtered index to original index
    const originalIndex = getOriginalIndex(filteredIndex);
    setSelectedPhotoIndex(originalIndex);
  };

  const closeLightbox = () => {
    setSelectedPhotoIndex(null);
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (selectedPhotoIndex === null) return;
    
    const currentFilteredIndex = getFilteredIndex(selectedPhotoIndex);
    const nextFilteredIndex = direction === 'prev' 
      ? Math.max(0, currentFilteredIndex - 1)
      : Math.min(filteredPhotos.length - 1, currentFilteredIndex + 1);
    
    const nextOriginalIndex = getOriginalIndex(nextFilteredIndex);
    setSelectedPhotoIndex(nextOriginalIndex);
    
    // Update current page if navigating to a photo on a different page
    const newPageNumber = Math.floor(nextFilteredIndex / PHOTOS_PER_PAGE) + 1;
    if (newPageNumber !== currentPage) {
      setCurrentPage(newPageNumber);
    }
  };

  // Sort photos by order
  const sortedPhotos = [...gallery.photos].sort((a, b) => a.order - b.order);
  
  // Filter photos based on face matches (exact copy from customer gallery)
  const getFilteredPhotos = () => {
    console.log('=== getFilteredPhotos called ===');
    console.log('showFaceMatchesOnly:', showFaceMatchesOnly);
    console.log('faceMatchedPhotos.length:', faceMatchedPhotos.length);
    console.log('gallery.photos.length:', gallery.photos.length);
    
    if (showFaceMatchesOnly) {
      console.log('Face matches filter - using stored photo objects');
      console.log('Face matched photos count:', faceMatchedPhotos.length);
      return faceMatchedPhotos; // Return the actual photo objects directly
    }
    console.log('No filter - returning all photos');
    return sortedPhotos;
  };

  const filteredPhotos = getFilteredPhotos();
  
  // Monitor filteredPhotos changes
  useEffect(() => {
    console.log('filteredPhotos changed:', {
      count: filteredPhotos.length,
      showFaceMatchesOnly,
      faceMatchedPhotosSize: faceMatchedPhotos.length
    });
  }, [filteredPhotos, showFaceMatchesOnly, faceMatchedPhotos.length]);

  // Get original indices for filtered photos (for lightbox navigation)
  const getOriginalIndex = (filteredIndex: number) => {
    const filteredPhoto = filteredPhotos[filteredIndex];
    return sortedPhotos.findIndex(photo => photo.driveFileId === filteredPhoto.driveFileId);
  };

  const getFilteredIndex = (originalIndex: number) => {
    const originalPhoto = sortedPhotos[originalIndex];
    return filteredPhotos.findIndex(photo => photo.driveFileId === originalPhoto.driveFileId);
  };
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredPhotos.length / PHOTOS_PER_PAGE);
  const startIndex = (currentPage - 1) * PHOTOS_PER_PAGE;
  const endIndex = startIndex + PHOTOS_PER_PAGE;
  const currentPhotos = filteredPhotos.slice(startIndex, endIndex);
  
  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Cleanup function for face search
  const stopFaceSearch = () => {
    // Close any existing connection
    if (eventSourceRef.current) {
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
  };

  // Handle selfie upload
  const handleSelfieUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Start face search with file object
    await handleFaceSearch(file);
  };

  // Handle face search (exact copy from customer gallery)
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
      const galleryResponse = await fetch(`/api/business-gallery/${params.albumCode}`);
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
      const response = await fetch(`/api/business-gallery/${params.albumCode}/face-search/simple`, {
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
        .filter((photo: Photo | undefined): photo is Photo => photo !== undefined && photo.url !== undefined); // Only include valid photos
      
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
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Background style
  const backgroundStyle = {
    backgroundColor: gallery.backgroundColor,
    backgroundImage: gallery.backgroundImageUrl 
      ? `url(${gallery.backgroundImageUrl})` 
      : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
  };

  // Apply blur to background image
  const backgroundOverlay = gallery.backgroundImageUrl ? (
    <div 
      className="fixed inset-0 backdrop-blur-sm" 
      style={{ backgroundColor: gallery.backgroundColor + '40' }}
    />
  ) : null;

  return (
    <div className="min-h-screen relative" style={backgroundStyle}>
      {backgroundOverlay}
      
      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="shadow-sm border-b border-gray-200/50" style={{ backgroundColor: gallery.backgroundColor || '#ffffff' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {gallery.title || `${gallery.businessName}'s ${gallery.eventType}`}
                </h1>
                <p className="text-gray-600">
                  {gallery.businessName} • {gallery.eventType} • {new Date(gallery.eventDate).toLocaleDateString()}
                </p>
              </div>
              {gallery.faceRecognitionEnabled && (
                <button
                  onClick={() => setShowFaceSearch(true)}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                >
                  <FiSearch className="w-4 h-4" />
                  <span>Find My Photos</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Gallery Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {sortedPhotos.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600">No photos available yet.</p>
            </div>
          ) : (
            <>
              {/* Photos Grid */}
              {showFaceMatchesOnly && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-green-800">
                        Face Match Results
                      </h3>
                      <p className="text-green-600">
                        Showing {filteredPhotos.length} photos with your face
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowFaceMatchesOnly(false);
                        setCurrentPage(1);
                      }}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Show All Photos
                    </button>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentPhotos
                  .map((photo, filteredIndex) => {
                    const originalIndex = getOriginalIndex(filteredIndex);
                    return { photo, originalIndex };
                  })
                  .map(({ photo, originalIndex }) => (
                  <motion.div
                    key={photo.driveFileId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: originalIndex * 0.05 }}
                    className="relative group cursor-pointer overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 aspect-square"
                    onClick={() => setSelectedPhotoIndex(originalIndex)}
                  >
                    <Image
                      src={photo.url}
                      alt={photo.alt}
                      fill
                      className="object-cover"
                      onLoad={() => handleImageLoad(photo.driveFileId)}
                      onError={() => handleImageError(photo.driveFileId)}
                      key={`${photo.driveFileId}-${imageLoadStates[photo.driveFileId]?.retryCount}`}
                    />
                    
                    {imageLoadStates[photo.driveFileId]?.error && (
                      <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                        <div className="text-center p-4">
                          <FiAlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Failed to load</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  </motion.div>
                  ))}
              </div>
              
              {/* Pagination Navigation */}
              {totalPages > 1 && (
                <div className="mt-8">
                  {/* Pagination Info */}
                  <div className="mb-4 text-center">
                    <p className="text-gray-600">
                      Showing {startIndex + 1}-{Math.min(endIndex, filteredPhotos.length)} of {filteredPhotos.length} photos
                      {showFaceMatchesOnly && ' (face matches)'}
                      {totalPages > 1 && ` - Page ${currentPage} of ${totalPages}`}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      First
                    </button>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              currentPage === pageNum
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                    
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Last
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhotoIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <div className="relative max-w-7xl mx-auto px-4">
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
              >
                <FiX className="w-8 h-8" />
              </button>
              
              {filteredPhotos.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const currentFilteredIndex = getFilteredIndex(selectedPhotoIndex);
                        const prevFilteredIndex = Math.max(0, currentFilteredIndex - 1);
                        setSelectedPhotoIndex(getOriginalIndex(prevFilteredIndex));
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-10"
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
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-10"
                      disabled={getFilteredIndex(selectedPhotoIndex) === filteredPhotos.length - 1}
                    >
                      <FiChevronRight className="w-8 h-8" />
                    </button>
                  </>
                )}
              
              <div className="relative">
                <Image
                  src={gallery.photos[selectedPhotoIndex].url}
                  alt={gallery.photos[selectedPhotoIndex].alt}
                  width={1200}
                  height={800}
                  className="max-h-[80vh] w-auto object-contain"
                />
              </div>
              
              <div className="absolute bottom-4 left-0 right-0 text-center text-white">
                <p className="text-lg">
                  {gallery.photos[selectedPhotoIndex].alt || `Photo ${selectedPhotoIndex + 1}`}
                </p>
                <p className="text-sm text-gray-300">
                  {getFilteredIndex(selectedPhotoIndex) + 1} of {filteredPhotos.length}
                  {showFaceMatchesOnly && ' (face matches)'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Face Search Modal */}
      <AnimatePresence>
        {showFaceSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowFaceSearch(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Find Your Photos</h3>
                  <button
                    onClick={() => setShowFaceSearch(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                {!isSearchingFaces && faceSearchResults.length === 0 && (
                  <div className="text-center">
                    <div className="mb-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                        <FiSearch className="w-8 h-8 text-purple-500" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Your Selfie</h4>
                      <p className="text-gray-600 mb-4">
                        Take a clear selfie and we'll find all photos with your face in this gallery.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <input
                        type="file"
                        id="selfie-upload"
                        accept="image/*"
                        onChange={handleSelfieUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="selfie-upload"
                        className="cursor-pointer inline-flex items-center px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        <FiSearch className="w-4 h-4 mr-2" />
                        Choose Selfie Photo
                      </label>
                      <p className="text-sm text-gray-500">
                        Supported formats: JPG, PNG, WEBP (max 10MB)
                      </p>
                    </div>
                  </div>
                )}

                {isSearchingFaces && (
                  <div className="text-center">
                    <div className="mb-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <FiSearch className="w-8 h-8 text-blue-500 animate-pulse" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Searching for Your Face...</h4>
                      <p className="text-gray-600 mb-4">
                        Scanning {totalPhotos} photos for matches
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${searchProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-500">
                        Progress: {Math.round(searchProgress)}%
                      </p>
                      <button
                        onClick={stopFaceSearch}
                        className="text-red-500 hover:text-red-600 text-sm"
                      >
                        Cancel Search
                      </button>
                    </div>
                  </div>
                )}

                {!isSearchingFaces && faceSearchResults.length > 0 && (
                  <div className="text-center">
                    <div className="mb-6">
                      <FiSearch className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-lg font-medium text-gray-900">
                        Complete! Found {faceSearchResults.length} photos with your face!
                      </p>
                      <p className="text-gray-600 mb-4">
                        The gallery now shows only your matched photos.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => setShowFaceSearch(false)}
                        className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        View Matched Photos
                      </button>
                      <button
                        onClick={() => {
                          setFaceSearchResults([]);
                          setFaceSearchSelfie(null);
                          setShowFaceMatchesOnly(false);
                          setCurrentPage(1);
                        }}
                        className="w-full px-4 py-2 text-gray-500 hover:text-gray-600"
                      >
                        Clear Filter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
