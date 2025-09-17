'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Masonry from 'react-masonry-css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiChevronLeft, 
  FiChevronRight, 
  FiArrowLeft, 
  FiX,
  FiMaximize2,
  FiMinimize2,
  FiAlertCircle,
  FiZoomIn,
  FiZoomOut
} from 'react-icons/fi';

interface AlbumImage {
  url: string;
  alt?: string;
  _id: string;
  createdAt?: string;
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
}

export interface AlbumPageClientProps {
  album: Album | null;
  id: string;
}

export default function NewAlbumClient({ 
  album: initialAlbum, 
  id,
}: AlbumPageClientProps) {
  const [album, setAlbum] = useState<Album | null>(initialAlbum);
  const [isLoading, setIsLoading] = useState(!initialAlbum);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const mainImageRef = useRef<HTMLDivElement>(null);
  const imageViewerRef = useRef<HTMLDivElement>(null);
  
  // Masonry breakpoints
  const breakpointColumnsObj = {
    default: 3,
    1100: 3,
    700: 2,
    500: 1
  };
  
  // Handle click outside to close viewer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (imageViewerRef.current && !imageViewerRef.current.contains(event.target as Node)) {
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

  // Process image URL to handle Google Drive links
  const processImageUrl = useCallback((url: string): string => {
    if (!url) return '';
    
    // If it's already a Google Drive URL with the export view, return as is
    if (url.includes('drive.google.com/uc?export=view')) {
      return url;
    }
    
    // If it's a Google Drive file ID, construct the proper URL
    if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.match(/\/file\/d\/([^/]+)/)?.[1];
      if (fileId) {
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
      }
    }
    
    // If it's a Google Drive file ID directly
    if (url.length === 33 && !url.includes('/')) {
      return `https://drive.google.com/uc?export=view&id=${url}`;
    }
    
    return url;
  }, []);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!album?.images?.length) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          handlePrev();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'Escape':
          setIsFullscreen(false);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentImageIndex, album?.images]);

  const handleNext = () => {
    if (!album?.images?.length) return;
    setCurrentImageIndex((prevIndex) => 
      prevIndex === album.images.length - 1 ? 0 : prevIndex + 1
    );
    // Scroll to top of the image container
    mainImageRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePrev = () => {
    if (!album?.images?.length) return;
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? album.images.length - 1 : prevIndex - 1
    );
    // Scroll to top of the image container
    mainImageRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
    setIsViewerOpen(true);
    setScale(1);
  };

  const handleImageLoad = (url: string) => {
    setLoadedImages(prev => ({
      ...prev,
      [url]: true
    }));
    
    // Clear any previous error for this image
    setImageLoadErrors(prev => ({
      ...prev,
      [url]: false
    }));
  };

  const handleImageError = (url: string) => {
    console.error(`Error loading image: ${url}`);
    setImageLoadErrors(prev => ({
      ...prev,
      [url]: true
    }));
  };

  // Fetch album data if not provided
  useEffect(() => {
    const fetchAlbum = async () => {
      if (initialAlbum) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Use absolute URL to avoid path resolution issues
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/albums/${id}`, {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error('Failed to fetch album:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          });
          throw new Error(`Failed to fetch album: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Fetched album data:', data);
        
        if (!data || !data.images) {
          throw new Error('Invalid album data received from server');
        }
        
        setAlbum(data);
      } catch (err) {
        console.error('Error fetching album:', err);
        setError(err instanceof Error ? err.message : 'Failed to load album. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbum();
  }, [id, initialAlbum]);

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
          setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : album.images.length - 1));
          setScale(1);
          break;
        case 'ArrowRight':
          setCurrentImageIndex(prev => (prev < album.images.length - 1 ? prev + 1 : 0));
          setScale(1);
          break;
        case '+':
        case '=':
          e.preventDefault();
          setScale(prev => Math.min(prev + 0.2, 3));
          break;
        case '-':
          e.preventDefault();
          setScale(prev => Math.max(prev - 0.2, 0.5));
          break;
        case '0':
          e.preventDefault();
          setScale(1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isViewerOpen, album?.images]);

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 bg-black z-50' : 'min-h-screen bg-gray-50'}`}>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link 
            href="/albums"
            className="inline-flex items-center text-gray-700 hover:text-gray-900"
          >
            <FiArrowLeft className="-ml-1 mr-2 h-5 w-5" />
            Back to albums
          </Link>
          
        </div>
      </header>

      {/* Main content */}
      <main className={`${isFullscreen ? 'h-[calc(100vh-64px)]' : 'max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8'}`}>
        {/* Album Info */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{album.title}</h1>
          {album.location && (
            <p className="text-gray-600">{album.location} • {new Date(album.date).toLocaleDateString()}</p>
          )}
          {album.description && (
            <p className="mt-2 text-gray-700 max-w-3xl mx-auto">{album.description}</p>
          )}
        </div>

        {/* Masonry Grid */}
        {album.images.length > 0 ? (
          <div className="w-full">
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
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onLoad={() => handleImageLoad(image.url)}
                      onError={() => handleImageError(image.url)}
                    />
                    {!loadedImages[image.url] && !imageLoadErrors[image.url] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="animate-pulse rounded-full h-12 w-12 bg-gray-200"></div>
                      </div>
                    )}
                    {imageLoadErrors[image.url] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <FiAlertCircle className="h-8 w-8 text-red-500" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </Masonry>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No images found in this album.</p>
          </div>
        )}

        {album.images.length > 0 && (
          <div className="mt-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Gallery</h2>
              <p className="text-gray-600">Click on any image to view it in full size</p>
            </div>
            <div 
              ref={mainImageRef}
              className="relative bg-black rounded-lg overflow-hidden mb-4" 
              style={{ aspectRatio: '16/9' }}
            >
                {!loadedImages[processedImageUrl] && !imageLoadErrors[processedImageUrl] && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                )}
                
                {imageLoadErrors[processedImageUrl] ? (
                  <div className="h-full flex items-center justify-center bg-gray-100">
                    <div className="text-center p-4">
                      <FiAlertCircle className="mx-auto h-8 w-8 text-red-500" />
                      <p className="mt-2 text-sm text-gray-500">Failed to load image</p>
                    </div>
                  </div>
                ) : (
                  <Image
                    src={processedImageUrl}
                    alt={currentImage.alt || `Image ${currentImageIndex + 1}`}
                    fill
                    className={`object-contain transition-opacity duration-300 ${
                      loadedImages[processedImageUrl] ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => handleImageLoad(processedImageUrl)}
                    onError={() => handleImageError(processedImageUrl)}
                    priority
                  />
                )}
              </div>
              
              {/* Navigation arrows */}
              {album.images.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="Previous image"
                  >
                    <FiChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="Next image"
                  >
                    <FiChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
              
              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                {currentImageIndex + 1} / {album.images.length}
              </div>
            </div>

            {/* Thumbnails */}
            {album.images.length > 1 && (
              <div className="mt-4 flex space-x-2 overflow-x-auto pb-4">
                {album.images.map((image, index) => {
                  const thumbUrl = processImageUrl(image.url);
                  return (
                    <button
                      key={image._id || index}
                      onClick={() => handleThumbnailClick(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                        currentImageIndex === index 
                          ? 'border-blue-500 ring-2 ring-blue-500' 
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      {!loadedImages[thumbUrl] && !imageLoadErrors[thumbUrl] ? (
                        <div className="w-full h-full bg-gray-200 animate-pulse"></div>
                      ) : imageLoadErrors[thumbUrl] ? (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <FiAlertCircle className="text-red-500" />
                        </div>
                      ) : (
                        <Image
                          src={thumbUrl}
                          alt={image.alt || `Thumbnail ${index + 1}`}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                          onLoad={() => handleImageLoad(thumbUrl)}
                          onError={() => handleImageError(thumbUrl)}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Album info */}
            <div className="mt-6 bg-white p-4 rounded-lg shadow">
              <h2 className="text-2xl font-bold text-gray-900">{album.title}</h2>
              
              {(album.location || album.date) && (
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                  {album.location && (
                    <div className="flex items-center">
                      <span className="text-gray-500">Location:</span>
                      <span className="ml-1 font-medium">{album.location}</span>
                    </div>
                  )}
                  {album.date && (
                    <div className="flex items-center">
                      <span className="text-gray-500">Date:</span>
                      <span className="ml-1 font-medium">
                        {new Date(album.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {album.description && (
                <p className="mt-4 text-gray-700">{album.description}</p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Image Viewer Modal */}
      <AnimatePresence>
        {isViewerOpen && currentImage && album && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <motion.div 
              className="w-full h-full relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="absolute top-4 right-4 z-50 flex space-x-2">
                <button
                  onClick={() => setScale(prev => Math.min(prev + 0.2, 3))}
                  className="p-2 text-white hover:bg-white/10 rounded-full"
                  aria-label="Zoom in"
                >
                  <FiZoomIn className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setScale(prev => Math.max(prev - 0.2, 0.5))}
                  className="p-2 text-white hover:bg-white/10 rounded-full"
                  aria-label="Zoom out"
                >
                  <FiZoomOut className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsViewerOpen(false)}
                  className="p-2 text-white hover:bg-white/10 rounded-full"
                  aria-label="Close viewer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => handlePrev()}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white hover:bg-white/10 rounded-full z-10"
                aria-label="Previous image"
              >
                <FiChevronLeft className="w-8 h-8" />
              </button>

              <div className="relative w-full h-full flex items-center justify-center">
                <motion.div
                  className="relative max-w-full max-h-full"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  style={{ transform: `scale(${scale})` }}
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
                onClick={() => handleNext()}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white hover:bg-white/10 rounded-full z-10"
                aria-label="Next image"
              >
                <FiChevronRight className="w-8 h-8" />
              </button>

              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {album.images.length}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
