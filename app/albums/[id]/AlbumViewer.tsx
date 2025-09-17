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
  category?: string; // Add category to props
}

export default function AlbumViewer({ album, id, category = 'gallery' }: AlbumViewerProps) {
  const [isLoading, setIsLoading] = useState(!album);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});
  
  const viewerRef = useRef<HTMLDivElement>(null);
  
  // Masonry breakpoints
  const breakpointColumnsObj = {
    default: 3,
    1100: 3,
    700: 2,
    500: 1
  };

  // Process image URL to handle various sources including Google Drive
  const processImageUrl = useCallback((url: string): string => {
    try {
      if (!url) {
        console.warn('Empty image URL provided');
        return '';
      }
      
      // If it's already a processed URL or direct URL, return as is
      if (url.startsWith('http') || url.startsWith('data:')) {
        return url;
      }
      
      // Handle Google Drive URLs
      if (url.includes('drive.google.com') || url.includes('googleusercontent.com')) {
        // If it's already in the correct format
        if (url.includes('uc?export=view')) {
          return url;
        }
        
        // Extract file ID from various Google Drive URL formats
        let fileId = '';
        
        try {
          // Format: https://drive.google.com/file/d/FILE_ID/...
          if (url.includes('/file/d/')) {
            fileId = url.split('/file/d/')[1]?.split('/')[0];
          }
          // Format: https://drive.google.com/open?id=FILE_ID
          else if (url.includes('open?id=')) {
            fileId = new URL(url).searchParams.get('id') || '';
          }
          // Format: https://drive.google.com/uc?id=FILE_ID
          else if (url.includes('uc?id=')) {
            fileId = new URL(url).searchParams.get('id') || '';
          }
          // Try to match any Google Drive file ID in the URL
          else {
            const match = url.match(/[\w-]{25,}/);
            if (match) fileId = match[0];
          }
          
          if (fileId) {
            const processedUrl = `/api/drive/image?id=${encodeURIComponent(fileId)}`;
            console.log(`Processed Google Drive URL: ${url} -> ${processedUrl}`);
            return processedUrl;
          }
        } catch (error) {
          console.error('Error processing Google Drive URL:', { url, error });
          return url; // Return original URL if processing fails
        }
      }
      
      // For relative URLs, prepend the base URL
      if (url.startsWith('/')) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        return `${baseUrl}${url}`;
      }
      
      return url;
    } catch (error) {
      console.error('Error in processImageUrl:', { url, error });
      return url; // Return original URL if any error occurs
    }
  }, []);

  // Handle keyboard navigation in the viewer
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
  }, [isViewerOpen, album?.images]);

  // Handle click outside to close viewer
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

  const handleImageLoad = (url: string) => {
    // Only update state if it hasn't been loaded yet
    setLoadedImages(prev => prev[url] ? prev : {
      ...prev,
      [url]: true
    });
    
    // Clear any previous error for this image
    setImageLoadErrors(prev => prev[url] === false ? prev : {
      ...prev,
      [url]: false
    });
  };

  const handleImageError = (url: string, error?: any) => {
    console.warn(`Failed to load image: ${url}`, error);
    
    // Only update state if there isn't already an error
    setImageLoadErrors(prev => prev[url] === true ? prev : {
      ...prev,
      [url]: true
    });
    
    // If this is a Google Drive URL, try falling back to direct URL
    if (url.includes('/api/drive/image')) {
      const fileId = new URL(url, window.location.origin).searchParams.get('id');
      if (fileId) {
        const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
        console.log(`Trying fallback URL for ${fileId}: ${directUrl}`);
        
        // Update the image source directly for this instance
        const imgElements = document.querySelectorAll(`img[src="${url}"]`);
        imgElements.forEach(img => {
          if (img.getAttribute('data-fallback-tried') !== 'true') {
            img.setAttribute('data-fallback-tried', 'true');
            img.setAttribute('src', directUrl);
          }
        });
      }
    }
  };

  const handleNext = () => {
    if (!album?.images?.length) return;
    setCurrentImageIndex(prev => 
      prev < album.images.length - 1 ? prev + 1 : 0
    );
  };

  const handlePrev = () => {
    if (!album?.images?.length) return;
    setCurrentImageIndex(prev => 
      prev > 0 ? prev - 1 : album.images.length - 1
    );
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
    setIsViewerOpen(true);
  };

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
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Album Info */}
        <div className="mb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-left">
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
              <p className="text-gray-600">{album.location} • {new Date(album.date).toLocaleDateString()}</p>
            )}
          </div>
          {album.description && (
            <p className="mt-4 text-gray-700 text-justify">
              {album.description}
            </p>
          )}
        </div>

        {/* Masonry Grid */}
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="flex -ml-4 w-auto"
          columnClassName="pl-4 bg-clip-padding"
        >
          {album.images.map((image, index) => (
            <div 
              key={image._id || index} 
              className="mb-4 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => handleThumbnailClick(index)}
            >
              <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-w-1 aspect-h-1">
                <Image
                  src={processImageUrl(image.url)}
                  alt={image.alt || `Image ${index + 1}`}
                  width={800}
                  height={600}
                  className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105 ${
                    imageLoadErrors[image.url] ? 'opacity-50' : ''
                  }`}
                  onLoad={() => handleImageLoad(image.url)}
                  onError={(e) => handleImageError(image.url, e)}
                  unoptimized={image.url.includes('google.com')}
                  priority={index < 3} // Preload first 3 images
                  loading={index > 2 ? 'lazy' : undefined}
                />
                {imageLoadErrors[image.url] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200/50">
                    <FiAlertCircle className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                {!loadedImages[image.url] && !imageLoadErrors[image.url] && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-pulse w-full h-full bg-gray-200"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </Masonry>

        {album.images.length === 0 && (
          <div className="text-center py-12">
            <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No images found</h3>
            <p className="mt-1 text-sm text-gray-500">This album doesn't contain any images.</p>
          </div>
        )}
      </main>

      {/* Image Viewer Modal */}
      <AnimatePresence>
        {isViewerOpen && currentImage && (
          <motion.div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={() => setIsViewerOpen(false)}
                className="p-2 text-white hover:bg-white/10 rounded-full"
                aria-label="Close viewer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handlePrev}
              className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full z-10"
              aria-label="Previous image"
            >
              <FiChevronLeft className="w-8 h-8" />
            </button>

            <div className="relative w-full h-full flex items-center justify-center">
              <motion.div
                className="relative max-w-full max-h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  maxWidth: '90vw',
                  maxHeight: '90vh'
                }}
              >
                <Image
                  src={processedImageUrl}
                  alt={currentImage.alt || `Image ${currentImageIndex + 1}`}
                  width={1200}
                  height={800}
                  className="max-w-[90vw] max-h-[90vh] object-contain"
                  priority
                />
              </motion.div>
            </div>

            <button
              onClick={handleNext}
              className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-full z-10"
              aria-label="Next image"
            >
              <FiChevronRight className="w-8 h-8" />
            </button>

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {currentImageIndex + 1} / {album.images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
