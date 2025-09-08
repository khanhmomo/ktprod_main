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
  FiMaximize2,
  FiMinimize2,
  FiAlertCircle,
  FiZoomIn,
  FiZoomOut,
  FiRotateCw
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
}

export default function AlbumViewer({ album, id }: { album: Album | null; id: string }) {
  const [isLoading, setIsLoading] = useState(!album);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  // Process image URL to handle Google Drive links
  const processImageUrl = useCallback((url: string): string => {
    if (!url) return '';
    
    // If it's already a Google Drive URL with the export view, return as is
    if (url.includes('drive.google.com/uc?export=view')) {
      return url;
    }
    
    // If it's a Google Drive file ID, construct the URL
    if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.split('/d/')[1]?.split('/')[0];
      if (fileId) {
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
      }
    }
    
    // If it's a Google Drive shareable link
    if (url.includes('drive.google.com/open')) {
      const fileId = new URL(url).searchParams.get('id');
      if (fileId) {
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
      }
    }
    
    // If it's a relative URL, prepend the base URL
    if (url.startsWith('/')) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      return `${baseUrl}${url}`;
    }
    
    return url;
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
    setImageLoadErrors(prev => ({
      ...prev,
      [url]: true
    }));
  };

  const handleNext = () => {
    if (!album?.images?.length) return;
    setCurrentImageIndex(prev => 
      prev < album.images.length - 1 ? prev + 1 : 0
    );
    setScale(1);
  };

  const handlePrev = () => {
    if (!album?.images?.length) return;
    setCurrentImageIndex(prev => 
      prev > 0 ? prev - 1 : album.images.length - 1
    );
    setScale(1);
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
    setIsViewerOpen(true);
    setScale(1);
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
          <h1 className="text-lg font-medium text-gray-900">{album.title}</h1>
          <div className="w-24">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="ml-auto p-2 text-gray-700 hover:text-gray-900 focus:outline-none"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
            </button>
          </div>
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
                onClick={() => setScale(1)}
                className="p-2 text-white hover:bg-white/10 rounded-full"
                aria-label="Reset zoom"
              >
                <FiRotateCw className="w-5 h-5" />
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
              onClick={handlePrev}
              className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full z-10"
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
