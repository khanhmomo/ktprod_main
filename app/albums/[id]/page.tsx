'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { FiArrowLeft, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Masonry from 'react-masonry-css';

interface AlbumImage {
  url: string;
  alt?: string;
}

interface Album {
  _id: string;
  title: string;
  images: AlbumImage[];
  date: string;
  location: string;
  description?: string;
  isPublished: boolean;
}

// Server Component that fetches the album data
async function getAlbum(id: string) {
  const response = await fetch(`/api/albums/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch album');
  }
  return response.json();
}

export default function AlbumPage({ params }: { params: { id: string } }) {
  const [album, setAlbum] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        setIsLoading(true);
        const data = await getAlbum(params.id);
        setAlbum(data);
      } catch (err) {
        console.error('Error fetching album:', err);
        setError('Failed to load album. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchAlbum();
    }
  }, [params.id]);

  const goToPrevious = () => {
    if (!album) return;
    setCurrentImageIndex(prevIndex => 
      prevIndex === 0 ? album.images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    if (!album) return;
    setCurrentImageIndex(prevIndex => 
      prevIndex === album.images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    document.body.style.overflow = 'auto';
  };

  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4 text-center">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Album not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 pt-16 pb-12">
        <Link 
          href="/albums" 
          className="inline-flex items-center text-gray-600 hover:text-black mb-8 transition-colors"
        >
          <FiArrowLeft className="mr-2" /> Back to Albums
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{album.title}</h1>
          
          {(album.location || album.date) && (
            <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
              {album.location && <span>{album.location}</span>}
              {album.date && <span>{formatDate(album.date)}</span>}
            </div>
          )}
          
          {album.description && (
            <p className="text-gray-700 max-w-3xl">{album.description}</p>
          )}
        </div>

        <Masonry
          breakpointCols={{
            default: 4,
            1100: 3,
            700: 2,
            500: 1
          }}
          className="flex -ml-4 w-auto"
          columnClassName="pl-4 bg-clip-padding"
        >
          {album.images.map((image, index) => (
            <motion.div
              key={index}
              className="mb-4 group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => openLightbox(index)}
            >
              <div className="overflow-hidden rounded-lg shadow-md bg-gray-100">
                <img
                  src={image.url}
                  alt={image.alt || `${album.title} - Image ${index + 1}`}
                  className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                  loading={index > 3 ? 'lazy' : 'eager'}
                />
              </div>
            </motion.div>
          ))}
        </Masonry>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && album.images.length > 0 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && closeLightbox()}
        >
          {/* Close button */}
          <button 
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white text-3xl focus:outline-none z-10"
            aria-label="Close lightbox"
          >
            &times;
          </button>
          
          {/* Main image */}
          <div className="relative w-full max-w-5xl h-[80vh] flex items-center justify-center p-4">
            <div className="relative w-full h-full flex items-center justify-center">
              <motion.img
                key={currentImageIndex}
                src={album.images[currentImageIndex].url}
                alt={album.images[currentImageIndex].alt || `Image ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                style={{
                  maxHeight: 'calc(80vh - 100px)', // Account for padding and controls
                  maxWidth: '100%',
                  display: 'block',
                  margin: '0 auto'
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onLoad={(e) => {
                  // Force consistent height for both vertical and horizontal images
                  const img = e.target as HTMLImageElement;
                  const isPortrait = img.naturalHeight > img.naturalWidth;
                  if (isPortrait) {
                    img.style.height = '80vh';
                    img.style.width = 'auto';
                    img.style.maxWidth = 'none';
                  } else {
                    img.style.width = '100%';
                    img.style.height = 'auto';
                    img.style.maxHeight = '80vh';
                  }
                }}
              />
            </div>

            {/* Navigation arrows */}
            {album.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
                  aria-label="Previous image"
                >
                  &larr;
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
                  aria-label="Next image"
                >
                  &rarr;
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {album.images.length > 1 && (
            <div className="mt-4 overflow-x-auto py-2 max-w-full">
              <div className="flex gap-2 px-4">
                {album.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-16 h-16 flex-shrink-0 rounded overflow-hidden border-2 transition-all ${
                      currentImageIndex === index 
                        ? 'border-white transform scale-110' 
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Image info */}
          <div className="mt-4 text-white text-center max-w-2xl px-4">
            <p className="text-sm text-gray-300">
              {currentImageIndex + 1} of {album.images.length}
            </p>
            {album.images[currentImageIndex]?.alt && (
              <p className="mt-2 text-gray-300">
                {album.images[currentImageIndex]?.alt}
              </p>
            )}
          </div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
}
