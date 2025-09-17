'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Masonry from 'react-masonry-css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiChevronLeft, 
  FiChevronRight, 
  FiArrowLeft, 
  FiX,
  FiAlertCircle
} from 'react-icons/fi';

interface AlbumImage {
  url: string;
  alt?: string;
  _id: string;
  width?: number;
  height?: number;
}

interface Album {
  _id: string;
  title: string;
  images: AlbumImage[];
  date: string;
  location: string;
  description?: string;
  isPublished: boolean;
  coverImage?: string;
  category?: string;
}

interface AlbumViewerProps {
  album: Album | null;
  id: string;
  category?: string;
}

type ImageLoadState = Record<string, boolean | number>;

const MAX_RETRIES = 3;

export default function AlbumViewer({ album, id, category = 'gallery' }: AlbumViewerProps) {
  const [isLoading, setIsLoading] = useState(!album);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean | number>>({});
  const viewerRef = useRef<HTMLDivElement>(null);
  
  const breakpointColumnsObj = {
    default: 3,
    1100: 3,
    700: 2,
    500: 1
  };

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
      
      if (url.startsWith('/')) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        return `${baseUrl}${url}`;
      }
      
      return url;
    } catch (error) {
      console.error('Error processing image URL:', { url, error });
      return url;
    }
  }, []);

  const handleImageLoad = useCallback((url: string, index: number) => {
    console.log(`Image ${index} loaded successfully:`, url);
    setLoadedImages(prev => ({
      ...prev,
      [url]: true
    }));
    
    setImageLoadErrors(prev => ({
      ...prev,
      [url]: false
    }));
  }, []);

  const handleImageError = useCallback((event: React.SyntheticEvent<HTMLImageElement, Event>, url: string, index: number) => {
    console.error(`Error loading image ${index}:`, { url, event });
    
    const currentRetryCount = (imageLoadErrors[`${url}_retry`] as number) || 0;
    
    if (currentRetryCount >= MAX_RETRIES) {
      console.warn(`Giving up on image after ${currentRetryCount} attempts:`, url);
      return;
    }
    
    const retryCount = currentRetryCount + 1;
    console.log(`Retry ${retryCount} for image ${index} with URL:`, url);
    
    // If it's a Google Drive URL, try alternative formats
    const isDriveUrl = url.includes('drive.google.com') || 
                      url.includes('googleusercontent.com') || 
                      url.includes('/api/drive/image');
    
    if (isDriveUrl) {
      let fileId = '';
      
      // Try to extract file ID from different URL formats
      if (url.includes('/file/d/')) {
        fileId = url.split('/file/d/')[1]?.split('/')[0] || '';
      } else if (url.includes('id=')) {
        try {
          // Only try to parse as URL if it's a valid URL
          if (url.startsWith('http')) {
            const urlObj = new URL(url);
            fileId = urlObj.searchParams.get('id') || '';
          } else {
            // Handle relative URLs or malformed URLs
            const match = url.match(/[\w-]{25,}/);
            fileId = match ? match[0] : '';
          }
        } catch (e) {
          console.error('Error parsing URL:', e);
          const match = url.match(/[\w-]{25,}/);
          fileId = match ? match[0] : '';
        }
      } else {
        // Fallback to regex extraction
        const match = url.match(/[\w-]{25,}/);
        fileId = match ? match[0] : '';
      }

      if (fileId) {
        const formats = [
          `https://drive.google.com/uc?export=view&id=${fileId}`,
          `https://drive.google.com/uc?export=download&id=${fileId}`,
          `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
          `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/drive/image?id=${fileId}`
        ];
        
        const newUrl = formats[Math.min(retryCount - 1, formats.length - 1)];
        
        setImageLoadErrors(prev => ({
          ...prev,
          [url]: true,
          [newUrl]: false,
          [`${url}_retry`]: retryCount
        }));
        
        // Update the image source with the new URL
        setTimeout(() => {
          const imgElements = document.querySelectorAll(`img[src*="${url}"]`);
          imgElements.forEach(img => {
            if (img.getAttribute('data-retry') !== retryCount.toString()) {
              img.setAttribute('src', newUrl);
              img.setAttribute('data-retry', retryCount.toString());
            }
          });
        }, 300 * retryCount);
        
        return;
      }
    }
    
    // For non-Google Drive URLs or if file ID extraction failed
    const newUrl = processImageUrl(url, true);
    
    setImageLoadErrors(prev => ({
      ...prev,
      [url]: true,
      [newUrl]: false,
      [`${url}_retry`]: retryCount
    }));
    
    // Update the image source with the new URL
    setTimeout(() => {
      const imgElements = document.querySelectorAll(`img[src*="${url}"]`);
      imgElements.forEach(img => {
        if (img.getAttribute('data-retry') !== retryCount.toString()) {
          img.setAttribute('src', newUrl);
          img.setAttribute('data-retry', retryCount.toString());
        }
      });
    }, 300 * retryCount);
  }, [imageLoadErrors, processImageUrl]);

  const handleNext = useCallback(() => {
    if (!album?.images?.length) return;
    setCurrentImageIndex(prev => 
      prev < album.images.length - 1 ? prev + 1 : 0
    );
  }, [album?.images]);

  const handlePrev = useCallback(() => {
    if (!album?.images?.length) return;
    setCurrentImageIndex(prev => 
      prev > 0 ? prev - 1 : album.images.length - 1
    );
  }, [album?.images]);

  const handleThumbnailClick = useCallback((index: number) => {
    setCurrentImageIndex(index);
    setIsViewerOpen(true);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isViewerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!album?.images?.length) return;
      
      switch (e.key) {
        case 'Escape':
          setIsViewerOpen(false);
          break;
        case 'ArrowLeft':
          handlePrev();
          break;
        case 'ArrowRight':
          handleNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isViewerOpen, album?.images, handleNext, handlePrev]);

  // Click outside to close viewer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (viewerRef.current && !viewerRef.current.contains(event.target as Node)) {
        setIsViewerOpen(false);
      }
    };
    
    if (isViewerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isViewerOpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Error loading album</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <Link 
              href="/albums"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <FiArrowLeft className="-ml-1 mr-2 h-5 w-5" />
              Back to albums
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Album not found</h3>
          <p className="mt-1 text-sm text-gray-500">The requested album could not be found.</p>
          <div className="mt-6">
            <Link 
              href="/albums"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <FiArrowLeft className="-ml-1 mr-2 h-5 w-5" />
              Back to albums
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentImage = album.images?.[currentImageIndex];
  const processedImageUrl = currentImage ? processImageUrl(currentImage.url) : '';

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <Link 
              href={`/gallery/${album?.category?.toLowerCase() || category}`} 
              className="text-gray-700 hover:text-gray-900 transition-colors duration-200 flex items-center"
              aria-label={`Back to ${album?.category || 'gallery'}`}
            >
              <FiArrowLeft className="w-6 h-6 mr-2 mt-0.5" />
              <h1 className="text-3xl font-bold text-gray-900">{album.title}</h1>
            </Link>
          </div>
          {album.location && (
            <p className="text-gray-600">
              {album.location} • {new Date(album.date).toLocaleDateString()}
            </p>
          )}
          {album.description && (
            <p className="mt-4 text-gray-700 text-justify">
              {album.description}
            </p>
          )}
        </div>

        {album.images.length > 0 ? (
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="flex -ml-4 w-auto"
            columnClassName="pl-4 bg-clip-padding"
          >
            {album.images.map((image, index) => {
              const imageUrl = processImageUrl(image.url);
              const isLoaded = !!loadedImages[imageUrl];
              const hasError = !!imageLoadErrors[imageUrl];
              
              return (
                <div 
                  key={image._id || index}
                  className="mb-4 break-inside-avoid relative group"
                  onClick={() => handleThumbnailClick(index)}
                >
                  <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-w-1 aspect-h-1">
                    {!isLoaded && !hasError && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-pulse w-full h-full bg-gray-200"></div>
                      </div>
                    )}
                    {hasError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="text-center p-4">
                          <FiAlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">Couldn't load image</p>
                        </div>
                      </div>
                    )}
                    <Image
                      key={`${image._id || index}-${imageLoadErrors[`${imageUrl}_retry`] || 0}`}
                      src={imageUrl}
                      alt={image.alt || `Image ${index + 1}`}
                      width={400}
                      height={400}
                      className="w-full h-auto object-cover"
                      onLoad={() => setLoadedImages(prev => ({ ...prev, [imageUrl]: true }))}
                      onError={(e) => handleImageError(e, imageUrl, index)}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="bg-black bg-opacity-50 text-white rounded-full p-2">
                        <FiChevronRight className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </Masonry>
        ) : (
          <div className="text-center py-12">
            <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No images found</h3>
            <p className="mt-1 text-sm text-gray-500">This album doesn't contain any images.</p>
          </div>
        )}
      </main>

      <AnimatePresence>
        {isViewerOpen && currentImage && (
          <motion.div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            ref={viewerRef}
          >
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={() => setIsViewerOpen(false)}
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
                  src={processedImageUrl}
                  alt={currentImage.alt || `Image ${currentImageIndex + 1}`}
                  width={currentImage.width || 1200}
                  height={currentImage.height || 800}
                  className="max-w-[90vw] max-h-[90vh] object-contain"
                  priority
                  unoptimized={process.env.NODE_ENV !== 'production'}
                />
              </motion.div>

              {album.images.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
                    aria-label="Previous image"
                  >
                    <FiChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
                    aria-label="Next image"
                  >
                    <FiChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} of {album.images.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
